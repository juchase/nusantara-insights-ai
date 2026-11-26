# Frontend demo integration patch

Patch ini menghubungkan halaman Forecast Next.js ke Forecasting V2 FastAPI tanpa mengubah endpoint forecasting legacy.

## File yang diganti / ditambahkan

1. `app/api/forecast/v2/[productId]/route.ts` — endpoint Next.js yang memvalidasi sesi dan kepemilikan produk sebelum meneruskan request ke FastAPI `/forecast/v2/{product_id}?frequency=D|W`.
2. `app/dashboard/forecast/page.tsx` — halaman Forecast menggunakan endpoint V2, menyediakan pilihan Daily/Weekly, menampilkan strategi/model/fallback, dan membaca prediksi tersimpan sesuai frequency.
3. `app/api/predictions/[productId]/route.ts` — menambahkan filter opsional `?freq=D|W`. Request lama tanpa parameter tetap mengembalikan perilaku sebelumnya.\n4. `app/dashboard/page.tsx` — dashboard utama mengambil Daily saja agar data Daily dan Weekly tidak tercampur dalam satu grafik.

## Penerapan

Ekstrak isi ZIP ini ke root repository Next.js dan izinkan file dengan path yang sama ditimpa. Tidak ada perubahan Prisma schema.

Pastikan environment server Next.js memiliki:
- `AI_SERVICE_URL=http://localhost:8000` (direkomendasikan, server-side)
- atau gunakan `NEXT_PUBLIC_API_BASE_URL` yang sudah ada di proyek.

Restart Next.js setelah mengubah environment.

## Validasi manual

1. Login dengan akun demo.
2. Buka `/dashboard/forecast`.
3. Pilih produk `06edb72f1e0c64b14c5b79353f7abea3`.
4. Pilih Daily, klik Generate Daily. Model yang diharapkan untuk produk uji: `sma`.
5. Pilih Weekly, klik Generate Weekly. Model yang diharapkan untuk produk uji: `tsb`.
6. Periksa kedua frequency masih tersimpan di tabel `Prediction`.

## Batasan yang diketahui

- Forecast V2 menyimpan `predictedSales` sebagai integer sesuai Prisma schema saat ini. Nilai desimal model dibulatkan pada penyimpanan.
- Grafik Weekly mengagregasikan histori sales ke label akhir minggu Senin agar sesuai dengan `resample("W-MON")` di FastAPI.
- Halaman dashboard utama masih menggunakan data Insight/KeywordSummary yang terpisah. Dataset import hanya mengisi Product, Sales, dan Review; sentiment pada review belum otomatis dianalisis oleh patch ini. Jalur analisis sentiment/insight perlu dijalankan sebagai langkah terpisah.
- ZIP frontend yang diberikan tidak menyertakan `package.json` maupun konfigurasi lockfile, sehingga build/lint tidak dapat dijalankan dari arsip ini. Jalankan build pada working copy proyek lokal.
