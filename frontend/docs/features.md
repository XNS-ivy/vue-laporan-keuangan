# Fitur & Modul Utama (features.md)

Dokumen ini menjelaskan fungsionalitas dan detail teknis dari setiap fitur utama di **Finance Flow**.

---

## 📊 1. Dashboard & Analisis Wawasan (Automated Insights)
Halaman depan (`DashboardView.vue`) merangkum seluruh kondisi finansial pengguna:
* **Statistik Cepat**: Kartu ringkasan untuk Saldo Aktual, Total Pemasukan, Total Pengeluaran, Total Aset, Utang Aktif, dan Piutang Aktif.
* **Wawasan Keuangan Otomatis (Insights Engine)**:
  * Memantau kenaikan pengeluaran bulanan.
  * Mendeteksi jika pengeluaran untuk kategori tertentu melampaui batas anggaran (di atas 80% atau 100%).
  * Memberikan pengingat transaksi berulang yang mendekati tanggal jatuh tempo.
  * Memberikan apresiasi atas peningkatan rasio tabungan.
* **Grafik Interaktif**: Menggunakan Chart.js untuk menampilkan grafik Donat (distribusi kategori), grafik batang perbandingan bulanan, dan grafik tren pengeluaran bulanan.

---

## 💸 2. Transaksi & Ekspor Excel (Transactions)
Modul untuk melakukan pencatatan transaksi kas keluar masuk secara mendetail:
* **Pencatatan Transaksi**: Menyimpan tanggal, tipe (Pemasukan/Pengeluaran), jumlah nominal, kategori utama, sub-kategori opsional, dan catatan deskriptif.
* **Penyaringan Lanjutan**: Pengguna dapat mencari transaksi berdasarkan teks catatan, kategori, dan rentang tanggal global.
* **Ekspor Data**: Terintegrasi dengan library `xlsx` untuk mengonversi seluruh data riwayat transaksi menjadi lembar sebar (spreadsheet Excel `.xlsx`) yang dapat diunduh langsung ke komputer pengguna.

---

## 📝 3. Penyusunan Anggaran & Transaksi Berulang (Planning)
Membantu perencanaan keuangan jangka pendek di halaman `PlanningView.vue`:
* **Anggaran Kategori (Monthly Budgeting)**: Menentukan pagu/batasan pengeluaran per kategori untuk bulan berjalan. Jika transaksi riil ditambahkan pada kategori tersebut, sistem akan menghitung persentase pemakaian anggaran secara reaktif.
* **Transaksi Berulang (Recurring Transactions)**:
  * Mengotomatiskan transaksi yang terjadi setiap bulan (seperti gaji, sewa, internet, asuransi).
  * Pengguna menentukan "Hari dalam Bulan" (misalnya tanggal 25 untuk gajian) dan nominalnya.
  * Pada setiap awal bulan atau saat aplikasi dimuat, sistem akan memeriksa apakah transaksi berulang untuk bulan saat ini sudah diterapkan; jika belum, transaksi ditambahkan otomatis ke riwayat transaksi dengan log pemicu otomatis.

---

## 🎯 4. Target Tabungan & Dana Darurat (Savings Goals)
Membantu mewujudkan tujuan keuangan jangka panjang di halaman `SavingsGoalView.vue`:
* **Target Finansial**: Membuat beberapa target tabungan (misal: "Dana Darurat", "Beli Laptop Baru", "Liburan").
* **Kalkulator Estimasi Waktu**: Berdasarkan nominal target, jumlah tabungan saat ini, dan kontribusi bulanan, sistem secara otomatis menghitung berapa bulan lagi target tersebut akan tercapai beserta persentase progres visual dalam bentuk progress-bar yang dinamis.

---

## 🏦 5. Manajemen Aset & Net Worth (Assets)
Pencatatan portofolio kekayaan pengguna di halaman `AssetsView.vue` dengan UX interaktif:
* **Klasifikasi Aset**: Aset dikelompokkan ke dalam kategori Kas (Cash), Saldo Bank, dan Investasi (seperti reksa dana, saham, atau emas).
* **Pencarian & Penyaringan**: Ditambahkan filter berbasis input teks untuk mempermudah pencarian nama aset dan select-box penyaringan tipe aset secara dinamis.
* **Modal Edit & Koreksi Nilai**: Pengguna dapat mengeklik item aset untuk membuka modal detail:
  * **Ubah Detail**: Mengoreksi nama aset, tipe, nominal awal, dan tanggal perolehan.
  * **Apresiasi & Penyusutan Nilai (Depreciation/Appreciation)**: Mencatat kenaikan (apresiasi 📈) atau penurunan nilai aset (penyusutan 📉) secara historis. Dilengkapi opsi otomatis mencatat penyesuaian sebagai transaksi Pemasukan/Pengeluaran pada arus kas utama.
  * **Riwayat Penyesuaian**: Daftar lengkap catatan kronologi perubahan nilai aset beserta nominal perubahan dan tombol pembatalan.

---

## 🤝 6. Utang & Piutang (Debts & Receivables)
Modul pencatatan kewajiban finansial di halaman `DebtsView.vue` yang lebih fleksibel:
* **Klasifikasi Utang/Piutang**:
  * **Utang (Debt)**: Uang milik orang lain yang wajib kita kembalikan.
  * **Piutang (Receivable)**: Uang kita yang sedang dipinjam orang lain dan harus kita tagih.
* **Pencarian & Filter Terperinci**: Pengguna dapat mencari catatan utang/piutang berdasarkan judul catatan atau nama pihak lawan (counterpart), serta menyaring data berdasarkan jenis utang/piutang maupun status pelunasannya.
* **Modal Koreksi Rincian**: Mengeklik catatan akan memicu modal edit untuk mengubah judul, counterpart, nominal pinjaman, tanggal jatuh tempo, jenis kewajiban, dan status lunas secara komprehensif.

---

## 📈 7. Laporan Lanjutan & Candlestick Chart (Reports)
Halaman `ReportsView.vue` menyediakan analisis mendalam bagi pengguna yang menyukai analisis data visual:
* **Balance Candlestick Chart**: Grafik khusus yang memvisualisasikan rentang saldo terendah, tertinggi, pembukaan, dan penutupan saldo harian/mingguan dalam bulan tersebut.
* **Distribusi & Aliran Kas**: Grafik visual komprehensif yang membandingkan total pemasukan terhadap pengeluaran harian sepanjang rentang waktu yang dipilih.

---

## ⚙️ 8. Pengaturan & Kustomisasi Tema (Settings)
Pusat kontrol aplikasi di halaman `SettingsView.vue`:
* **Pengaturan PIN**: Mengaktifkan, mengganti, atau menonaktifkan kode pengunci 4-digit.
* **Manajemen Kategori Kustom**: Pengguna bebas membuat kategori pemasukan/pengeluaran baru, memilih warna representatif melalui palet warna, dan menyematkan ikon emoji unik.
* **Dynamic Theme Engine**:
  * Didukung oleh Composable `useTheme.ts` dan Tailwind CSS v4.
  * Menyediakan 6 preset tema bawaan: **Ocean Light**, **Forest Light**, **Sunset Light**, **Midnight Blue**, **Graphite Dark**, dan **Ruby Dark**.
  * Pengguna juga dapat memilih tingkat opasitas warna primer dan mode permukaan (Light/Dark) untuk menyesuaikan nuansa visual aplikasi sesuai selera.
  * Tema langsung diaplikasikan ke elemen DOM `<html>` dengan memperbarui variabel CSS custom (`--color-primary`, dll.) secara real-time.

---

## ⚡ 9. Utilitas Cepat & Tombol Melayang (Floating Apps & Utilities)
Menyediakan akses cepat ke beberapa fitur penting melalui tombol melayang di pojok kanan bawah:
* **Tombol Petir `⚡` (Floating Apps)**: 
  * Membuka menu popover pintasan cepat.
  * **Tambah Transaksi Pintas**: Membuka formulir modal cepat untuk merekam pengeluaran/pemasukan baru secara langsung tanpa keluar dari halaman aktif.
  * **Ganti Tema Cepat**: Pintasan kilat untuk mengganti tema (siklus Light -> Dark -> Midnight) langsung dalam satu ketukan.
  * **Ekspor Backup**: Memicu proses pembentukan berkas cadangan data keuangan JSON dan mengunduhnya ke perangkat lokal.
* **Tombol Scroll to Top**:
  * Otomatis mendeteksi aktivitas scroll kontainer utama. Muncul tepat di atas tombol utilitas melayang ketika kontainer digulir melebihi `200px`.
  * Memungkinkan pengguna untuk kembali ke atas halaman secara instan dengan efek gulir yang mulus.

