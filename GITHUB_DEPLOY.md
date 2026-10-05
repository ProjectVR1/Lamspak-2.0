# Deploy ke GitHub Pages

1. Buat repository GitHub.
2. Unggah seluruh isi folder `LAMSPAK_Prediction_V2_GitHub` ke root repository.
3. Pastikan `index.html`, `lamspak-data.js`, `app.js`, `analysis.js`, `assessor-v4.js`, `lamspak-status-v5.js`, `prediction-v2.js`, dan seluruh CSS berada pada level yang sama.
4. Buka **Settings → Pages**.
5. Pilih **Deploy from a branch → main → /(root)**.
6. Save.

Aplikasi berjalan client-side. Library pembaca DOCX/PDF dan ekspor dokumen dimuat dari CDN; fungsi inti penilaian tetap berada pada file JavaScript aplikasi.
