
/* v5.0 status accreditation simulation layer */
(function(){
  const STATUS_RULES={
    officialScaleMax:400,
    unggulHighMin:361,
    unggulTransitionalMin:321,
    accreditedMinExclusive:200,
    unggulItems:[
      {no:9,label:'Rata-rata IPK lulusan 3 tahun terakhir minimal 3,25'},
      {no:16,label:'Kesesuaian bidang kerja lulusan minimal 60% pada pekerjaan pertama'},
      {no:55,label:'Minimal 50% dosen memiliki publikasi ilmiah pada jurnal internasional bereputasi/relevan'},
      {no:56,label:'Minimal 50% dosen aktif sebagai anggota asosiasi program studi/profesi'},
      {no:60,label:'Laboratorium sesuai kompetensi inti tersedia dan didukung tata kelola/pemanfaatan yang jelas'}
    ]
  };
  const statusClass=s=>s==='Unggul'?'good':s==='Terakreditasi'?'info':s==='Tidak Terakreditasi'?'critical':'warn';
  const firstSection=()=>document.querySelector('#reportContent .report-section');
  const getCriterion=no=>({m:MATRIX.find(m=>m.no===no),x:state.criteria[no]||freshCriterion()});
  function accreditationStatus(){
    const s=scoreStats();
    const equivalent=Number(((s.weighted/META.weightedMax)*STATUS_RULES.officialScaleMax)||0);
    const complete=s.set===META.indicatorCount;
    const syarat=STATUS_RULES.unggulItems.map(it=>{
      const {m,x}=getCriterion(it.no); const score=x.score===null?null:Number(x.score); const met=score===2;
      return {no:it.no,label:it.label,indicator:m?.indicator||'',score,met,evidenceStatus:x.evidenceStatus||'Belum ada'};
    });
    const syaratMet=syarat.filter(x=>x.met).length;
    const unggulEligible=syaratMet===syarat.length;
    let status='Belum Lengkap';
    let note='Lengkapi seluruh indikator agar prediksi setelah koreksi manual semakin lengkap.';
    let basis=[];
    if(!s.set){
      status='Belum Dinilai';
      note='Belum ada indikator yang dinilai.';
    }else if(s.accredFail>0 || equivalent<=STATUS_RULES.accreditedMinExclusive){
      status='Tidak Terakreditasi';
      note=s.accredFail>0?'Terdapat butir syarat minimum terakreditasi yang masih pada skor 0.':'Nilai prediksi berada pada atau di bawah ambang minimum 200.';
      basis=[`Nilai prediksi ${equivalent.toFixed(2)} / ${STATUS_RULES.officialScaleMax}`,`Syarat perlu Unggul terpenuhi ${syaratMet}/${syarat.length}`];
    }else if(unggulEligible && equivalent>=STATUS_RULES.unggulHighMin){
      status='Unggul';
      note='Lima syarat perlu Unggul terpenuhi dan nilai prediksi berada pada rentang ≥ 361.';
      basis=[`Nilai prediksi ${equivalent.toFixed(2)} / ${STATUS_RULES.officialScaleMax} (rentang ≥ 361)`,`Syarat perlu Unggul terpenuhi ${syaratMet}/${syarat.length}`];
    }else if(unggulEligible && equivalent>=STATUS_RULES.unggulTransitionalMin){
      status='Unggul';
      note='Lima syarat perlu Unggul terpenuhi dan nilai prediksi berada pada rentang 321–360 (rentang transisi).';
      basis=[`Nilai prediksi ${equivalent.toFixed(2)} / ${STATUS_RULES.officialScaleMax} (rentang transisi 321–360)`,`Syarat perlu Unggul terpenuhi ${syaratMet}/${syarat.length}`];
    }else if(equivalent>STATUS_RULES.accreditedMinExclusive){
      status='Terakreditasi';
      const reason = unggulEligible ? 'Nilai prediksi belum mencapai ambang Unggul.' : `Syarat perlu Unggul baru terpenuhi ${syaratMet}/${syarat.length}.`;
      note=`Program studi melewati ambang minimum kelayakan, namun belum memenuhi kondisi Unggul. ${reason}`;
      basis=[`Nilai prediksi ${equivalent.toFixed(2)} / ${STATUS_RULES.officialScaleMax} (> 200)`,`Syarat perlu Unggul terpenuhi ${syaratMet}/${syarat.length}`];
    } else {
      status='Tidak Terakreditasi';
      note='Nilai prediksi belum melampaui ambang minimum kelayakan.';
      basis=[`Nilai prediksi ${equivalent.toFixed(2)} / ${STATUS_RULES.officialScaleMax}`];
    }
    if(!complete && status!=='Belum Dinilai') note = `Prediksi manual sementara: baru ${s.set}/${META.indicatorCount} indikator dinilai. ` + note;
    return {status,note,basis,equivalent,complete,syarat,syaratMet,syaratTotal:syarat.length,weighted:s.weighted,index:s.index,accredFail:s.accredFail};
  }
  window.accreditationStatus=accreditationStatus;

  const _renderHero=renderHero;
  renderHero=function(){
    const acc=accreditationStatus();
    _renderHero();
    const small=document.querySelector('#scoreRing small');
    if(small) small.textContent='Nilai prediksi / 400';
    const score=document.querySelector('#heroScore');
    if(score) score.textContent=acc.equivalent.toFixed(1);
    const ring=document.querySelector('#scoreRing');
    if(ring) ring.style.setProperty('--pct', Math.max(0,Math.min(100,acc.equivalent/4)));
    const hs=document.querySelector('#heroStatus');
    if(hs) hs.textContent=acc.status;
    if(hs){ hs.className=''; hs.classList.add('hero-status',statusClass(acc.status)); }
    const note=document.querySelector('#heroNote');
    if(note) note.textContent=acc.note;
  };

  const _renderDashboard=renderDashboard;
  renderDashboard=function(){
    _renderDashboard();
    const acc=accreditationStatus();
    const root=document.querySelector('#dashboard');
    if(!root) return;
    const statusHtml=`<div class="panel status-panel"><div class="panel-head"><div><p class="kicker">Prediksi setelah koreksi manual</p><h2>Prediksi Akreditasi Setelah Koreksi Manual</h2><p class="muted">Status dihitung dari skor berbobot yang dikonversi ke skala 400 dan pemeriksaan lima syarat perlu Unggul. Hasil ini membantu asesor melakukan evaluasi internal.</p></div><span class="tag ${statusClass(acc.status)}">${acc.status}</span></div><div class="kpis assessor-kpis"><div class="kpi"><b>${acc.equivalent.toFixed(2)}</b><span>Nilai prediksi / 400</span></div><div class="kpi"><b>${fmt(acc.weighted)}/${META.weightedMax}</b><span>Skor berbobot asli</span></div><div class="kpi"><b>${acc.syaratMet}/${acc.syaratTotal}</b><span>5 syarat perlu Unggul</span></div><div class="kpi"><b>${acc.accredFail}</b><span>Butir syarat minimum gagal</span></div></div><p><b>Interpretasi:</b> ${esc(acc.note)}</p><ul class="status-list">${acc.basis.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><table class="report-table compact"><thead><tr><th>No</th><th>Syarat perlu Unggul</th><th>Skor</th><th>Status</th></tr></thead><tbody>${acc.syarat.map(it=>`<tr><td>${it.no}</td><td>${esc(it.label)}</td><td>${it.score??'-'}</td><td><span class="tag ${it.met?'good':'warn'}">${it.met?'Memenuhi':'Belum'}</span></td></tr>`).join('')}</tbody></table></div>`;
    root.insertAdjacentHTML('afterbegin', statusHtml);
  };

  const _renderMethodology=renderMethodology;
  renderMethodology=function(){
    _renderMethodology();
    const root=document.querySelector('#methodology'); if(!root) return;
    root.insertAdjacentHTML('beforeend', `<div class="panel"><h3>Kriteria Prediksi Akreditasi Setelah Koreksi Manual</h3><p>Untuk mempermudah asesor, aplikasi menambahkan <b>nilai prediksi 0–400</b> dari skor berbobot dengan rumus <code>Nilai prediksi = Σ(skor × bobot) / ${META.weightedMax} × 400</code>. Rumus ini adalah <i>konversi internal</i> agar dapat dipetakan ke ambang hasil yang diminta pengguna.</p><ul class="warning-list"><li><b>Unggul</b>: lima syarat perlu Unggul terpenuhi dan nilai prediksi ≥ ${STATUS_RULES.unggulHighMin}, atau berada pada rentang ${STATUS_RULES.unggulTransitionalMin}–360 untuk interpretasi transisi.</li><li><b>Terakreditasi</b>: nilai prediksi > ${STATUS_RULES.accreditedMinExclusive} dan tidak masuk kondisi Unggul, serta tidak gagal pada butir syarat minimum terakreditasi.</li><li><b>Tidak Terakreditasi</b>: nilai prediksi ≤ ${STATUS_RULES.accreditedMinExclusive} atau terdapat butir syarat minimum terakreditasi pada skor 0.</li></ul><p>Lima syarat perlu Unggul yang dipantau eksplisit: ${STATUS_RULES.unggulItems.map(x=>`${x.no} (${x.label})`).join('; ')}.</p></div>`);
  };

  const _renderReport=renderReport;
  renderReport=function(){
    _renderReport();
    const acc=accreditationStatus();
    const first=firstSection();
    if(!first) return;
    const box=`<div class="report-section"><h3>Prediksi Akreditasi Setelah Koreksi Manual</h3><div class="kpis"><div class="kpi"><b>${acc.status}</b><span>Status prediksi</span></div><div class="kpi"><b>${acc.equivalent.toFixed(2)}</b><span>Nilai prediksi / 400</span></div><div class="kpi"><b>${fmt(acc.weighted)}/${META.weightedMax}</b><span>Skor berbobot asli</span></div><div class="kpi"><b>${acc.syaratMet}/${acc.syaratTotal}</b><span>5 syarat perlu Unggul</span></div></div><p><b>Catatan hasil:</b> ${esc(acc.note)}</p><ul>${acc.basis.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><table class="report-table"><thead><tr><th>No</th><th>Syarat perlu Unggul</th><th>Dasar indikator</th><th>Skor</th><th>Status</th><th>Status bukti</th></tr></thead><tbody>${acc.syarat.map(it=>`<tr><td>${it.no}</td><td>${esc(it.label)}</td><td>${esc(it.indicator)}</td><td>${it.score??'-'}</td><td>${it.met?'Memenuhi':'Belum memenuhi'}</td><td>${esc(it.evidenceStatus)}</td></tr>`).join('')}</tbody></table></div>`;
    first.insertAdjacentHTML('afterend', box);
    const section=first.querySelector('p b');
    const kpis=first.querySelector('.kpis');
    if(kpis && !kpis.querySelector('.kpi .status-sim')){
      kpis.insertAdjacentHTML('afterbegin', `<div class="kpi"><b class="status-sim">${acc.status}</b><span>Status prediksi</span></div><div class="kpi"><b>${acc.equivalent.toFixed(2)}</b><span>Nilai prediksi / 400</span></div>`);
    }
    const batasan=[...document.querySelectorAll('#reportContent .report-section')].find(sec=>sec.querySelector('h3')?.textContent.trim()==='Batasan');
    if(batasan){
      const p=document.createElement('p');
      p.innerHTML='<b>Penting:</b> status di atas adalah prediksi berbasis skor berbobot dan lima syarat perlu Unggul pada aplikasi. Penetapan akhir tetap memerlukan verifikasi terhadap instrumen dan hasil asesmen LAMSPAK.';
      batasan.prepend(p);
    }
  };

  exportPDFv4=function(){
    renderReport();
    const J=window.jspdf?.jsPDF; if(!J){switchView('report');setTimeout(()=>window.print(),200);return}
    const doc=new J({orientation:'landscape',unit:'mm',format:'a4'}), s=scoreStats(), a=assessorStats(), acc=accreditationStatus();
    doc.setFontSize(14); doc.text('Laporan Evaluasi Diri Internal — LAMSPAK Sarjana',10,10);
    doc.setFontSize(7.5); doc.text(`${state.identity.programStudi||'Program Studi'} | ${state.identity.perguruanTinggi||'Perguruan Tinggi'} | ${state.identity.tahunEvaluasi||'-'}`,10,16);
    doc.text(`Status prediksi: ${acc.status} | Nilai prediksi: ${acc.equivalent.toFixed(2)}/400 | Skor berbobot: ${fmt(s.weighted)}/${META.weightedMax}`,10,21);
    doc.text(`Dinilai ${s.set}/73 | Bukti ${s.evidencePct.toFixed(0)}% | Siap ${a.ready} | Review selesai ${a.done} | Syarat unggul ${acc.syaratMet}/${acc.syaratTotal}`,10,25);
    doc.setFontSize(6.8); doc.text('Catatan: hasil di atas adalah prediksi kerja untuk membantu review; penetapan akhir mengikuti asesmen LAMSPAK.',10,29);
    let startY=33;
    if(typeof doc.autoTable==='function'){
      doc.autoTable({startY, head:[['No','Syarat perlu Unggul','Skor','Status','Bukti']], body:acc.syarat.map(it=>[it.no,it.label,it.score??'-',it.met?'Memenuhi':'Belum',it.evidenceStatus]), styles:{fontSize:6,cellPadding:1}, headStyles:{fillColor:[33,96,112]}, columnStyles:{0:{cellWidth:10},1:{cellWidth:130},2:{cellWidth:15},3:{cellWidth:24},4:{cellWidth:30}}, margin:{left:8,right:8}});
      startY=doc.lastAutoTable.finalY+4;
      doc.autoTable({startY,head:[['No','Indikator','Skor','Bukti & gate','Temuan / narasi','Rekomendasi / review']],body:MATRIX.map(m=>{const x=state.criteria[m.no],g=assessorGate(m,x),r=measurementResult(m,x),fs=validationFindings(m,x);return[m.no,`${m.indicator}\n${m.standard.replace(/^\d+\.\s*/,'')}${m.syaratUnggul?'\n[SYARAT PERLU UNGGUL]':''}`,`${x.score??'-'} / bobot ${m.weight}\nSumber: ${x.scoreSource||'manual'}${r?'\nHitung: '+r.summary:''}`,`${x.evidenceStatus}; ${x.evidenceMeta?.sourceType||'-'}; periode ${x.evidenceMeta?.period||'-'}\n${x.evidence||'Bukti belum dicatat'}\nGate ${g.status} ${g.pct}%`,`${narrativeFor(m,x)}\n${fs.length?'TEMUAN: '+fs.map(z=>z.text).join(' | '):''}`,`${recommendationFor(m,x)}\nKeputusan: ${x.review?.decision||'Belum direview'}; Reviewer: ${x.review?.reviewer||'-'}\n${x.review?.clarification||''}`]}),styles:{fontSize:4.8,cellPadding:1,overflow:'linebreak',valign:'top'},headStyles:{fillColor:[15,76,92]},columnStyles:{0:{cellWidth:8},1:{cellWidth:53},2:{cellWidth:39},3:{cellWidth:53},4:{cellWidth:86},5:{cellWidth:76}},margin:{left:4,right:4,top:7,bottom:8},didDrawPage:()=>{doc.setFontSize(6); doc.text('Trademark @ramakertamukti',10,204)}});
    }
    doc.save(`Laporan_Asesor_Muhasabbah_LAMSPAK_S1_v5_${todayISO()}.pdf`);
  };

  exportWordv4=async function(){
    renderReport();
    const acc=accreditationStatus(), s=scoreStats(), a=assessorStats();
    if(!window.docx){
      const html=`<!doctype html><html><head><meta charset="utf-8"><title>Laporan Evaluasi Diri Internal LAMSPAK</title><style>body{font-family:Arial,sans-serif;font-size:10pt;line-height:1.35;color:#111}table{border-collapse:collapse;width:100%;margin:8px 0 14px}th,td{border:1px solid #777;padding:4px;vertical-align:top}th{background:#eef6f8}h2,h3,h4{page-break-after:avoid}.detail-item{page-break-inside:avoid;margin-bottom:12px}.detail-grid{display:grid;grid-template-columns:150px 1fr;gap:4px 8px}.detail-grid b{font-weight:700}.kpis{display:block}.kpi{display:inline-block;border:1px solid #aaa;padding:6px;margin:2px;vertical-align:top}.report-section{margin-bottom:18px}</style></head><body>${document.querySelector('#reportContent').innerHTML}</body></html>`;
      download(new Blob(['\ufeff'+html],{type:'application/msword'}),`Laporan_Asesor_Muhasabbah_LAMSPAK_S1_v5_${todayISO()}.doc`); toast('docx.js tidak termuat; laporan diekspor sebagai Word .doc.'); return;
    }
    const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,HeadingLevel,WidthType,PageOrientation}=window.docx;
    const para=t=>new Paragraph({children:[new TextRun(String(t??''))]});
    const cell=t=>new TableCell({children:[para(t)]});
    const row=(a,b)=>new TableRow({children:[cell(a),cell(b)]});
    const children=[
      new Paragraph({text:'Laporan Evaluasi Diri Internal — LAMSPAK Sarjana',heading:HeadingLevel.TITLE}),
      para(`Program Studi: ${state.identity.programStudi||'-'}`), para(`UPPS: ${state.identity.upps||'-'}`), para(`Perguruan Tinggi: ${state.identity.perguruanTinggi||'-'}`), para(`Tahun evaluasi: ${state.identity.tahunEvaluasi||'-'}`),
      para(`Status prediksi: ${acc.status}`), para(`Nilai prediksi: ${acc.equivalent.toFixed(2)}/400`), para(`Skor berbobot asli: ${fmt(s.weighted)}/${META.weightedMax}`), para(`Indikator dinilai: ${s.set}/73 | Kematangan bukti: ${s.evidencePct.toFixed(0)}% | Siap ditelaah: ${a.ready} | Selesai review: ${a.done}`),
      para(`Catatan hasil: ${acc.note}`), para('Penting: status di atas adalah prediksi kerja berbasis skor berbobot dan lima syarat perlu Unggul; penetapan akhir mengikuti verifikasi instrumen dan hasil asesmen LAMSPAK.'),
      new Paragraph({text:'Lima Syarat Perlu Unggul',heading:HeadingLevel.HEADING_1})
    ];
    const syRows=[new TableRow({children:['No','Syarat perlu Unggul','Skor','Status','Bukti'].map(cell)})];
    acc.syarat.forEach(it=>syRows.push(new TableRow({children:[it.no,it.label,it.score??'-',it.met?'Memenuhi':'Belum memenuhi',it.evidenceStatus].map(cell)})));
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:syRows}), new Paragraph({text:'Rincian 73 Indikator',heading:HeadingLevel.HEADING_1}));
    MATRIX.forEach(m=>{const x=state.criteria[m.no],r=measurementResult(m,x),g=assessorGate(m,x),fs=validationFindings(m,x),special=[m.syaratUnggul?'SYARAT PERLU UNGGUL':'',m.syaratAkreditasi?'syarat minimum terakreditasi':'',m.scoreFloor===1?'skor minimum rubrik 1':''].filter(Boolean).join('; ')||'-'; const rt=[
      row('Standar',m.standard), row('Skor / bobot',`${x.score??'-'} / ${m.weight}; kontribusi ${x.score===null?'-':fmt(Number(x.score)*m.weight)}; sumber skor ${x.scoreSource||'manual'}`), row('Status khusus',special), row('Hasil pengukuran',r?`${r.summary}${r.warning?' — '+r.warning:''}`:'Tidak menggunakan kalkulator terstruktur atau data belum lengkap.'), row('Gate verifikasi',`${g.status} (${g.pct}%); checklist bukti ${evidenceCheckCount(x)}/5`), row('Temuan validasi',fs.length?fs.map(z=>`${z.sev}: ${z.text}`).join(' | '):'Tidak ada gap prosedural yang terdeteksi aplikasi.'), row('Narasi hasil',narrativeFor(m,x)), row('Narasi FED',x.narrative||'Belum diisi'), row('Bukti',`${x.evidence||'Belum dicatat'} | Status: ${x.evidenceStatus} | Jenis: ${x.evidenceMeta?.sourceType||'-'} | Periode: ${x.evidenceMeta?.period||'-'} | ID: ${x.evidenceMeta?.documentId||'-'} | Pemilik: ${x.evidenceOwner||'-'} | Verifikasi: ${x.verifiedDate||'-'}`), row('Rekomendasi',recommendationFor(m,x)), row('Rencana tindak lanjut',`${x.plan.recommendation||'-'} | PIC: ${x.plan.pic||'-'} | Tenggat: ${x.plan.dueDate||'-'} | Target: ${x.plan.target||'-'} | Status: ${x.plan.status||'-'}`), row('Keputusan review',`${x.review?.decision||'Belum direview'} | Reviewer: ${x.review?.reviewer||'-'} | Tanggal: ${x.review?.reviewDate||'-'} | Rekonsiliasi: ${x.review?.reconciled?'Ya':'Belum/tidak relevan'}`), row('Klarifikasi / alasan',x.review?.clarification||'-'), row('Catatan asesor',x.assessorNote||'-')
    ]; children.push(new Paragraph({text:`${m.no}. ${m.indicator}`,heading:HeadingLevel.HEADING_2}), new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rt}));});
    children.push(new Paragraph({text:'Trademark @ramakertamukti'}));
    const doc=new Document({sections:[{properties:{page:{size:{orientation:PageOrientation?.LANDSCAPE||'landscape'}}},children}]});
    const blob=await Packer.toBlob(doc); download(blob,`Laporan_Asesor_Muhasabbah_LAMSPAK_S1_v5_${todayISO()}.docx`);
  };

  // button hooks
  document.querySelector('#btnPdf').onclick=exportPDFv4;
  document.querySelector('#btnWord').onclick=exportWordv4;
  document.querySelector('#btnPrint').onclick=()=>{renderReport();setTimeout(()=>window.print(),150)};

  // Tiny styles for hero status and status list, injected client-side to avoid touching CSS files too much.
  const st=document.createElement('style');
  st.textContent=`.hero-status.good{color:#116b2e}.hero-status.info{color:#0f4c5c}.hero-status.critical{color:#8f1d1d}.hero-status.warn{color:#7a5c00}.status-list{margin:.4rem 0 0 1.25rem}.report-table.compact td,.report-table.compact th{font-size:.92rem}.status-panel .report-table{margin-top:.8rem}`;
  document.head.appendChild(st);

  renderAll();
})();
