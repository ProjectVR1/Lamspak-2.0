# Metodologi LAMSPAK Prediction V2.0

## 1. Pemetaan otomatis FED

Teks FED dipecah menjadi blok. Setiap blok dibandingkan dengan istilah penting pada indikator serta deskriptor skor 2, 1 dan 0. Saran skor hanya muncul jika:

- relevansi terhadap indikator memadai;
- terdapat sinyal bukti (misalnya dokumen, tabel, tahun, persentase, monitoring, audit, tracer, realisasi);
- satu deskriptor lebih kuat dibanding deskriptor pesaing;
- skor 0 melewati ambang yang lebih ketat untuk mengurangi false positive.

Ketidakadaan teks tidak diperlakukan sebagai ketidakpatuhan.

## 2. Prediksi otomatis sementara

Hanya indikator dengan saran skor yang masuk ke proyeksi titik:

`proyeksi = skor berbobot indikator terpetakan / skor maksimum indikator terpetakan × 400`

Aplikasi juga menampilkan cakupan bobot terpetakan dan rentang logis minimum–maksimum untuk item yang belum terpetakan. Dengan demikian satu angka prediksi tidak disajikan tanpa konteks keterisian dokumen.

## 3. Prediksi setelah koreksi manual

Setelah asesi/UPPS mengisi atau memperbaiki 73 indikator:

`nilai prediksi = Σ(skor × bobot) / 282 × 400`

Status kerja dipetakan menjadi Unggul, Terakreditasi, atau Tidak Terakreditasi menurut parameter prediksi aplikasi dan pemeriksaan lima syarat perlu Unggul.

## 4. Pemisahan fungsi

- **Analisis otomatis** = pemetaan awal dokumen.
- **Prediksi sementara** = proyeksi berbasis bagian yang berhasil dipetakan.
- **Penilaian manual** = judgement asesi/UPPS terhadap rubrik dan bukti.
- **Review asesor** = verifikasi keterlacakan, konsistensi, klarifikasi dan keputusan internal.

Aplikasi tidak memverifikasi keaslian dokumen dan tidak menggantikan asesmen resmi.
