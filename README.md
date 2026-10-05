# LAMSPAK Prediction V2.0

Aplikasi statis untuk membantu asesi/UPPS dan asesor internal melakukan alur kerja: **analisis otomatis FED → prediksi akreditasi sementara → koreksi manual 73 indikator → verifikasi asesor → laporan**.

## Alur utama

1. **Analisis Otomatis FED** menjadi tahap pertama. Pengguna mengunggah DOCX/PDF berbasis teks/TXT/HTML/MD. Aplikasi mencari kecocokan antara teks dan deskriptor skor 2, 1, dan 0 tanpa menganggap teks yang tidak ditemukan sebagai skor 0.
2. **Prediksi sementara** dihitung dari indikator yang berhasil dipetakan. Aplikasi menampilkan proyeksi skala 400, cakupan bobot yang benar-benar terpetakan, rentang logis akibat item yang belum terpetakan, dan status lima syarat perlu Unggul.
3. **Koreksi manual 73 indikator** dilakukan oleh asesi/UPPS. Saran otomatis dapat dipakai sebagai draft pada butir kosong, tetapi skor, bukti, narasi dan alasan tetap dapat diperbaiki.
4. **Review asesor** memeriksa keterlacakan bukti, ketidaksesuaian skor-kalkulator, klarifikasi dan keputusan review.
5. **Laporan** dapat dicetak/Save as PDF atau diekspor ke Word.

## Kriteria prediksi yang digunakan aplikasi

- **Unggul:** nilai prediksi >= 361 dan 5 syarat perlu Unggul terpenuhi. Rentang 321–360 ditampilkan sebagai rentang transisi apabila kelima syarat terpenuhi.
- **Terakreditasi:** nilai prediksi > 200 tetapi kombinasi nilai dan/atau 5 syarat belum memenuhi kondisi Unggul.
- **Tidak Terakreditasi:** nilai prediksi <= 200 atau terdapat kondisi syarat minimum terakreditasi yang dinilai tidak terpenuhi.

Nilai 0–400 adalah konversi transparan dari skor berbobot matriks aplikasi (maksimum 282): `nilai = skor berbobot / 282 × 400`.

## Lima syarat perlu Unggul S1 yang dipantau

1. Rata-rata IPK lulusan tiga tahun terakhir minimal 3,25.
2. Kesesuaian bidang kerja lulusan minimal 60%.
3. Publikasi ilmiah dosen minimal 50% sesuai indikator instrumen.
4. Keanggotaan asosiasi program studi/profesi minimal 50%.
5. Ketersediaan laboratorium sesuai kompetensi inti dan dukungan tata kelola/pemanfaatannya.

## Prinsip ilmiah / no-fake

- Tidak ditemukannya teks pada FED **tidak** otomatis diubah menjadi skor 0.
- Skor otomatis hanya disarankan jika relevansi indikator, kecocokan deskriptor dan sinyal bukti memenuhi ambang konservatif.
- Prediksi otomatis menampilkan **cakupan pemetaan**, sehingga asesor mengetahui berapa bagian matriks yang benar-benar menopang proyeksi.
- Butir skor 0 membutuhkan ambang kecocokan lebih kuat dan tetap diberi peringatan untuk verifikasi manual.
- Analisis otomatis tidak menghapus atau menimpa penilaian manual yang sudah ada.
- Keputusan akhir memerlukan verifikasi terhadap instrumen LAMSPAK yang berlaku dan bukti sahih.

## GitHub Pages

Unggah seluruh isi folder ke root repository, lalu aktifkan **Settings → Pages → Deploy from a branch → main → /(root)**.

Tidak memerlukan backend atau database. Data kerja disimpan pada browser melalui localStorage.

**Trademark @ramakertamukti**
