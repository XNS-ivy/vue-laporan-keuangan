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
* **Manajemen Kategori Kustom**: Pengguna bebas membuat kategori pemasukan/pengeluaran baru, memilih warna representatif melalui palet warna, dan memilih ikon menggunakan **Sistem SVG Bebas Emoji** dengan grid box interaktif. Dilengkapi juga dengan grup contoh ikon (seperti Transport: kereta, pesawat, kapal).
* **Preferensi Pengguna**: Mengatur Mata Uang Utama, Bahasa Preferensi (multi-bahasa reaktif), Mode Tampilan (Sederhana vs. Lengkap), serta **Ukuran Konten (Teks & Tombol)** secara langsung.
* **Skala Konten Global (Accessibility)**: Menyediakan pilihan skala ukuran konten (*Normal, Besar, Ekstra Besar*) yang memanipulasi font-size root elemen `<html>`. Karena layout menggunakan satuan `rem`, seluruh ukuran card, tombol, teks, margin, dan padding akan membesar secara harmonis demi kemudahan membaca dan menekan elemen di perangkat mobile (sangat ramah lansia).
* **Penyederhanaan Layout Mode Sederhana**: Saat Mode Sederhana diaktifkan:
  * **Planning**: Menyembunyikan simulator bunga majemuk, rekomendasi alokasi 50/30/20, dan menyajikan input pagu belanja bulanan yang berjarak renggang.
  * **Savings Goal**: Menyembunyikan baris rincian "Setoran Bulanan Total" dan "Estimasi Bulan Tercapai".
  * **Assets**: Menyembunyikan bar pencarian dan select-box tipe filter, serta menyembunyikan form penyesuaian apresiasi/depresiasi beserta log riwayat di modal detail aset.
  * **Debts**: Menyembunyikan baris filter/pencarian utang piutang.
* **Dynamic Theme Engine**:
  * Didukung oleh Composable `useTheme.ts` dan Tailwind CSS v4.
  * Menyediakan 6 preset tema bawaan: **Ocean Light**, **Forest Light**, **Sunset Light**, **Midnight Blue**, **Graphite Dark**, dan **Ruby Dark**.
  * Pengguna juga dapat memilih tingkat opasitas warna primer dan mode permukaan (Light/Dark) untuk menyesuaikan nuansa visual aplikasi sesuai selera.
  * Tema langsung diaplikasikan ke elemen DOM `<html>` dengan memperbarui variabel CSS custom (`--color-primary`, dll.) secara real-time.

---

## ⚡ 9. Utilitas Cepat & Tombol Melayang (Floating Apps & Utilities)
Menyediakan akses cepat ke beberapa fitur penting melalui tombol melayang di pojok kanan bawah. Seluruh ikon pada UI chrome menggunakan **inline SVG** (style Feather/Lucide icons) untuk konsistensi visual.
* **Tombol Petir (Floating Apps)**: 
  * Membuka menu popover pintasan cepat.
  * **Tambah Transaksi Pintas**: Membuka formulir modal cepat untuk merekam pengeluaran/pemasukan baru secara langsung tanpa keluar dari halaman aktif.
  * **Ganti Tema Cepat**: Pintasan kilat untuk mengganti tema (siklus Light -> Dark -> Midnight) langsung dalam satu ketukan.
  * **Ekspor Backup**: Memicu proses pembentukan berkas cadangan data keuangan JSON dan mengunduhnya ke perangkat lokal.
  * **Instal Aplikasi**: Opsi untuk memasang aplikasi ke perangkat (muncul jika browser mendukung PWA install).
* **Tombol Scroll to Top**:
  * Otomatis mendeteksi aktivitas scroll kontainer utama. Muncul tepat di atas tombol utilitas melayang ketika kontainer digulir melebihi `200px`.
  * Memungkinkan pengguna untuk kembali ke atas halaman secara instan dengan efek gulir yang mulus.

---

## 🌐 10. Service Worker & Akses Offline (Offline-First)
Untuk mendukung konsep *offline-first* dan meningkatkan performa pemuatan aplikasi, **MyFinanceFlow** mengintegrasikan Service Worker:
* **Service Worker (`sw.js`)**: Terdaftar di berkas `index.html` dan berlokasi di direktori `public/sw.js`.
* **Pre-Caching Aset Kritis**: Pada event `install`, Service Worker melakukan pre-cache aset kritis (`/`, `/index.html`, `/manifest.webmanifest`) untuk menjamin ketersediaan offline sejak pertama kali aktif.
* **Strategi Caching (Stale-While-Revalidate)**:
  * Ketika aplikasi meminta berkas statis (seperti berkas HTML, JavaScript, CSS, gambar), Service Worker akan langsung menyajikan versi cache yang tersedia (jika ada) untuk performa instan.
  * Di latar belakang, Service Worker akan melakukan fetch ke jaringan untuk mengambil berkas terbaru dan memperbarui cache secara senyap.
  * Menyediakan fallback halaman navigasi (`/index.html`) jika pengguna bernavigasi saat offline penuh.
* **Versi Cache**: Saat ini menggunakan `finance-flow-cache-v2`. Cache lama otomatis dihapus saat Service Worker baru diaktifkan.
* **Notifikasi Lokal & PWA Interaktif**: 
  * Digunakan oleh Composable `useNotifications.ts` untuk menampilkan push notification pengingat harian/mingguan/bulanan jika izin diberikan.
  * Service Worker mendengarkan event `notificationclick`. Saat pengguna mengetuk notifikasi, banner notifikasi akan segera ditutup, dan Service Worker memfokuskan tab aplikasi yang sudah terbuka (atau membuka tab baru jika belum terbuka) serta mengarahkannya kembali ke halaman utama aplikasi secara otomatis.
* **Dukungan Progressive Web App (PWA)**: Bekerja bersama `manifest.webmanifest` untuk memungkinkan instalasi aplikasi langsung di homescreen perangkat Android/iOS atau desktop.

---

## 📲 11. PWA Install Prompt & Banner
Aplikasi menyediakan **UI prompt instalasi** yang terintegrasi agar pengguna dapat memasang aplikasi dengan mudah:
* **Composable `usePwaInstall.ts`**: Menangkap event `beforeinstallprompt` dari browser dan menyimpan deferred prompt untuk digunakan nanti. State reaktif singleton (`canInstall`, `isInstalled`, `dismissed`) dibagikan ke seluruh komponen.
* **Install Banner (Sidebar)**: Banner muncul di bagian bawah sidebar navigasi ketika browser mendukung instalasi PWA. Dilengkapi tombol "Pasang Sekarang" dan tombol dismiss. Banner tidak muncul kembali jika sudah di-dismiss di sesi tersebut (`sessionStorage`).
* **Floating Apps Menu**: Opsi "Instal Aplikasi" juga tersedia di menu utilitas cepat (floating apps) bagi pengguna yang melewatkan banner sidebar.
* **Auto-Detection**: Sistem otomatis mendeteksi apakah aplikasi sudah berjalan dalam mode standalone (sudah terinstal) dan menyembunyikan prompt jika demikian.

---

## 🚀 12. Onboarding Wizard & Welcome Page Setup (WelcomeView)
Halaman penyambutan (`WelcomeView.vue`) menyajikan setup langkah demi langkah (onboarding) saat pengguna pertama kali membuka aplikasi:
* **Pengaturan Awal Preferensi**: Pengguna memilih bahasa (Bahasa Indonesia, English, 日本語, Español) dan mata uang yang langsung diterapkan secara real-time.
* **Personalisasi Tema**: Pilihan tema dasar (Terang, Gelap, Midnight) dapat dicoba secara instan sebelum disimpan.
* **Proteksi PIN Keamanan**: Opsi untuk menetapkan 4-digit PIN keamanan guna melindungi privasi data.
* **Saldo Awal & Progress Smooth**: Input saldo awal dengan dukungan stepper dinamis dan bar progress langkah yang bersih dan profesional.

---

## 🔢 13. Logika Kelipatan Nominal Dinamis (Dynamic Nominal Stepping)
Fitur kenyamanan input nominal yang terintegrasi pada seluruh kolom nominal numerik di aplikasi:
* **Deteksi Orde Nilai**: Secara otomatis mendeteksi orde magnitude dari nominal yang sedang dimasukkan (misalnya ratusan, ribuan, jutaan).
* **Langkah Dinamis (Arrow Keys & Stepper)**: Menekan tombol ArrowUp / ArrowDown pada keyboard atau tombol spinner input akan menaikkan atau menurunkan nilai sebesar satu digit di belakang angka depan terbesarnya (contoh: `1.000` naik menjadi `1.100`, `1.000.000` naik menjadi `1.100.000`).
