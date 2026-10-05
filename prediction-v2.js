/* LAMSPAK Prediction V2.0
   Automatic FED mapping -> provisional prediction -> manual correction workflow.
   No missing text is automatically treated as non-compliance. */
(function(){
  const AUTO_STATUS_RULES={max:400,unggul5:361,unggulTransition:321,accreditedCut:200,syarat:[9,16,55,56,60]};
  const autoEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // More conservative 0-1-2 matcher: a score is suggested only when indicator relevance,
  // evidence signals and separation from competing descriptors are adequate.
  assess=function(m,blocks){
    const a=toks(m.indicator).slice(0,24), r2=toks(m.score2).slice(0,30), r1=toks(m.score1).slice(0,28), r0=toks(m.score0).slice(0,28);
    let z={text:'',a:0,r2:0,r1:0,r0:0,rel:0};
    for(const b of blocks){
      const ca=cov(b,a), c2=cov(b,r2), c1=cov(b,r1), c0=cov(b,r0);
      const descriptor=Math.max(c2,c1,c0);
      const rel=.62*ca+.38*descriptor;
      if(rel>z.rel) z={text:b,a:ca,r2:c2,r1:c1,r0:c0,rel};
    }
    const sig=evidenceSignals(z.text);
    const scores=[{score:2,v:z.r2},{score:1,v:z.r1},{score:0,v:z.r0}].sort((x,y)=>y.v-x.v);
    const top=scores[0], second=scores[1];
    let suggestion=null;
    const enoughIndicator=z.a>=.40, enoughEvidence=sig>=1, descriptorStrong=top.v>=.28, separated=(top.v-second.v)>=.045;
    if(enoughIndicator&&enoughEvidence&&descriptorStrong&&separated) suggestion=top.score;
    // Score-zero descriptors frequently contain generic negative wording; require stronger evidence.
    if(suggestion===0 && !(z.a>=.48 && z.r0>=.36 && (z.r0-Math.max(z.r1,z.r2))>=.065)) suggestion=null;
    if(suggestion!==null && suggestion<(m.scoreFloor||0)) suggestion=m.scoreFloor;
    const conf=z.rel>=.60?'Tinggi':z.rel>=.44?'Sedang':'Rendah';
    if(conf==='Rendah') suggestion=null;
    const excerpt=z.text?String(z.text).replace(/\s+/g,' ').trim().slice(0,760):'Tidak ditemukan bagian dokumen yang cukup relevan.';
    let gap='Belum cukup bukti tekstual untuk menyarankan skor. Ketidakadaan teks tidak diperlakukan sebagai ketidakpatuhan.';
    if(suggestion===2) gap='Dokumen paling dekat dengan deskriptor skor 2. Verifikasi bukti, periode data, dan konsistensi sebelum menetapkan skor manual.';
    if(suggestion===1) gap=`Dokumen paling dekat dengan deskriptor skor 1. Gap menuju skor 2: ${m.score2}`;
    if(suggestion===0) gap='Dokumen memuat indikasi yang paling dekat dengan deskriptor skor 0. Wajib diperiksa manual karena keputusan tidak memenuhi tidak boleh ditetapkan hanya dari kemiripan teks.';
    return{no:m.no,suggestion,confidence:conf,relevance:+z.rel.toFixed(3),descriptor:{r2:+z.r2.toFixed(3),r1:+z.r1.toFixed(3),r0:+z.r0.toFixed(3)},excerpt,gap};
  };

  function automaticPrediction(){
    const rs=analysisState.results||[];
    const byNo=new Map(rs.map(r=>[Number(r.no),r]));
    let knownWeighted=0, knownMax=0, minWeighted=0, maxWeighted=0;
    MATRIX.forEach(m=>{
      const r=byNo.get(m.no);
      if(r && r.suggestion!==null && Number.isFinite(Number(r.suggestion))){
        const sc=Number(r.suggestion);
        knownWeighted+=sc*m.weight;
        knownMax+=2*m.weight;
        minWeighted+=sc*m.weight;
        maxWeighted+=sc*m.weight;
      }else{
        minWeighted+=(m.scoreFloor||0)*m.weight;
        maxWeighted+=2*m.weight;
      }
    });
    const coverage=knownMax/META.weightedMax*100;
    const projection=knownMax?knownWeighted/knownMax*400:0;
    const lower=minWeighted/META.weightedMax*400;
    const upper=maxWeighted/META.weightedMax*400;
    const syarat=AUTO_STATUS_RULES.syarat.map(no=>{
      const r=byNo.get(no); const m=MATRIX.find(x=>x.no===no);
      return {no,indicator:m?.indicator||'',suggestion:r?.suggestion??null,confidence:r?.confidence||'—',met:r?.suggestion===2};
    });
    const syaratKnown=syarat.filter(x=>x.suggestion!==null).length;
    const syaratMet=syarat.filter(x=>x.met).length;
    const allSyaratMet=syaratMet===syarat.length;
    let status='Belum dapat diprediksi', reason='Belum ada cukup indikator yang dapat dipetakan dari dokumen.';
    if(knownMax){
      if(projection<=AUTO_STATUS_RULES.accreditedCut){
        status='Tidak Terakreditasi';
        reason=`Proyeksi dari indikator yang dapat dipetakan adalah ${projection.toFixed(1)}/400 (≤ 200).`;
      }else if(allSyaratMet && projection>=AUTO_STATUS_RULES.unggul5){
        status='Unggul';
        reason=`Proyeksi ${projection.toFixed(1)}/400 dan kelima syarat perlu Unggul terdeteksi pada skor 2.`;
      }else if(allSyaratMet && projection>=AUTO_STATUS_RULES.unggulTransition){
        status='Unggul';
        reason=`Proyeksi ${projection.toFixed(1)}/400 berada pada rentang 321–360 dan kelima syarat perlu Unggul terdeteksi pada skor 2.`;
      }else{
        status='Terakreditasi';
        reason=`Proyeksi ${projection.toFixed(1)}/400 berada di atas 200, tetapi kondisi Unggul belum dapat dipenuhi dari hasil pemetaan otomatis.`;
      }
    }
    const coverageLabel=coverage>=75?'tinggi':coverage>=45?'sedang':'terbatas';
    return{knownWeighted,knownMax,coverage,projection,lower,upper,status,reason,coverageLabel,syarat,syaratKnown,syaratMet};
  }
  window.automaticPrediction=automaticPrediction;

  function renderAutoPrediction(){
    const root=document.querySelector('#autoPrediction'); if(!root) return;
    if(!analysisState.results?.length){
      root.innerHTML=`<div class="panel prediction-empty"><p class="kicker">Prediksi belum tersedia</p><h3>Mulai dari dokumen FED</h3><p class="muted">Prediksi baru dihitung setelah aplikasi menemukan kecocokan yang memadai antara isi FED dan deskriptor rubrik. Bagian yang tidak ditemukan tetap berstatus belum terpetakan, bukan otomatis skor 0.</p></div>`;
      return;
    }
    const p=automaticPrediction();
    const cls=p.status==='Unggul'?'good':p.status==='Terakreditasi'?'info':p.status==='Tidak Terakreditasi'?'critical':'warn';
    root.innerHTML=`<div class="panel auto-prediction"><div class="panel-head"><div><p class="kicker">Tahap 2 • prediksi sebelum koreksi manual</p><h2>Prediksi Akreditasi Sementara</h2></div><span class="tag ${cls}">${autoEsc(p.status)}</span></div>
      <div class="kpis prediction-kpis"><div class="kpi"><b>${p.projection.toFixed(1)}</b><span>Proyeksi nilai / 400</span></div><div class="kpi"><b>${p.coverage.toFixed(0)}%</b><span>Cakupan bobot terpetakan</span></div><div class="kpi"><b>${p.lower.toFixed(0)}–${p.upper.toFixed(0)}</b><span>Rentang logis dari item belum terpetakan</span></div><div class="kpi"><b>${p.syaratMet}/5</b><span>Syarat Unggul terdeteksi skor 2</span></div><div class="kpi"><b>${p.syaratKnown}/5</b><span>Syarat Unggul berhasil dipetakan</span></div></div>
      <p><b>Interpretasi:</b> ${autoEsc(p.reason)} Cakupan pemetaan ${p.coverageLabel} (${p.coverage.toFixed(1)}% bobot maksimum).</p>
      <div class="prediction-warning"><b>Gunakan sebagai hipotesis penilaian awal.</b> Proyeksi dihitung hanya dari indikator yang memiliki kecocokan tekstual memadai; indikator yang belum terpetakan tidak diubah menjadi skor 0. Asesi/UPPS harus mengoreksi skor, bukti, dan narasi pada tahap manual.</div>
      <table class="report-table compact"><thead><tr><th>No</th><th>5 syarat perlu Unggul</th><th>Saran otomatis</th><th>Kecocokan</th><th>Interpretasi</th></tr></thead><tbody>${p.syarat.map(it=>`<tr><td>${it.no}</td><td>${autoEsc(it.indicator)}</td><td>${it.suggestion===null?'Belum terpetakan':it.suggestion}</td><td>${autoEsc(it.confidence)}</td><td>${it.suggestion===2?'<span class="tag good">Terindikasi memenuhi</span>':it.suggestion===null?'<span class="tag warn">Perlu bukti/manual</span>':'<span class="tag critical">Belum skor 2</span>'}</td></tr>`).join('')}</tbody></table>
      <div class="prediction-next"><button class="btn primary" type="button" id="predictionToManual">Koreksi / Lengkapi 73 Indikator</button><button class="btn" type="button" id="predictionDashboard">Lihat Dashboard Prediksi Manual</button></div>
    </div>`;
    document.querySelector('#predictionToManual')?.addEventListener('click',()=>switchView('assessment'));
    document.querySelector('#predictionDashboard')?.addEventListener('click',()=>switchView('dashboard'));
  }

  const oldRenderAnalysis=window.renderAnalysis;
  window.renderAnalysis=function(){
    oldRenderAnalysis();
    renderAutoPrediction();
    const root=document.querySelector('#analysisResults');
    if(analysisState.results?.length && root){
      const p=automaticPrediction();
      const current=root.querySelector('.kpis');
      if(current && !current.querySelector('[data-autozero]')){
        current.insertAdjacentHTML('beforeend',`<div class="kpi" data-autozero><b>${analysisState.results.filter(r=>r.suggestion===0).length}</b><span>Saran skor 0 (wajib verifikasi)</span></div>`);
      }
      const note=root.querySelector('p.muted');
      if(note) note.innerHTML='<b>Prinsip analisis:</b> aplikasi mencari kecocokan dengan deskriptor skor 2, 1, dan 0. Saran hanya muncul bila relevansi indikator, sinyal bukti, dan perbedaan antardeskriptor memadai. Ketidakadaan teks tetap tidak dianggap sebagai kegagalan.';
    }
  };

  runAnalysis=async function(file){
    if(!file)return;
    switchView('analysis');setProg(3,'Menyiapkan '+file.name);
    try{
      const ex=await extractFile(file);
      if(ex.text.trim().length<200)throw new Error('Teks terlalu sedikit. PDF scan perlu OCR sebelum dianalisis.');
      const results=[];
      for(let i=0;i<MATRIX.length;i++){
        results.push(assess(MATRIX[i],ex.blocks));
        if(i%8===0){setProg(35+Math.round(i/MATRIX.length*45),`Memetakan indikator ${i+1}/73`);await new Promise(r=>setTimeout(r,0))}
      }
      const tabs=assessTables(ex);
      analysisState={fileName:file.name,fileType:ex.type,analyzedAt:new Date().toISOString(),textLength:ex.text.length,results,tables:tabs};
      localStorage.setItem(AUTO_KEY,JSON.stringify(analysisState));
      setProg(100,'Selesai. Prediksi akreditasi sementara tersedia di bawah.');
      window.renderAnalysis();
      toast('Analisis otomatis dan prediksi sementara selesai');
    }catch(e){setProg(0,'Gagal.');alert(e.message)}
  };

  // Rebind upload/drop handlers so they use the upgraded runAnalysis function.
  const fedInput=document.querySelector('#fedInput');
  if(fedInput) fedInput.onchange=e=>{if(e.target.files[0])runAnalysis(e.target.files[0]);e.target.value=''};
  const dz=document.querySelector('#dropZone');
  if(dz){dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag');const f=e.dataTransfer.files[0];if(f)runAnalysis(f)}};
  document.querySelector('#goManual')?.addEventListener('click',()=>switchView('assessment'));

  // Rename manual prediction language to distinguish it from the first-stage automatic prediction.
  const oldDashboard=renderDashboard;
  renderDashboard=function(){oldDashboard(); const h=document.querySelector('#dashboard .status-panel h2'); if(h)h.textContent='Prediksi Setelah Koreksi Manual';};

  window.renderAnalysis();
})();
