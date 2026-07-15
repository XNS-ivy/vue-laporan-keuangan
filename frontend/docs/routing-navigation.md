# Navigasi & Routing (routing-navigation.md)

Bagian ini mendokumentasikan bagaimana rute halaman diatur di dalam **Finance Flow** dan bagaimana tata letak (layout) shell navigasi bekerja.

---

## 🧭 Konfigurasi Rute (`src/router/index.ts`)

Aplikasi ini menggunakan **Vue Router (HTML5 History Mode)** untuk navigasi antar halaman tanpa memuat ulang peramban.

Semua rute didaftarkan di dalam berkas [router/index.ts](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/src/router/index.ts):

| Path | Nama Rute | Komponen Halaman (View) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/` | `dashboard` | `DashboardView.vue` | Ikhtisar keuangan, bagan ringkasan, pencapaian target, dan wawasan otomatis. |
| `/welcome` | `welcome` | `WelcomeView.vue` | Halaman onboarding / perkenalan interaktif santai bagi pengguna baru. |
| `/transactions` | `transactions` | `TransactionsView.vue` | Daftar riwayat transaksi lengkap dengan pencarian, filter, dan ekspor Excel. |
| `/planning` | `planning` | `PlanningView.vue` | Modul penyusunan anggaran bulanan dan daftar transaksi berulang. |
| `/savings-goal` | `savings-goal` | `SavingsGoalView.vue` | Target tabungan masa depan dan kalkulator waktu pencapaian target. |
| `/assets` | `assets` | `AssetsView.vue` | Pencatatan aset likuid, tabungan bank, dan portofolio investasi. |
| `/debts` | `debts` | `DebtsView.vue` | Pencatatan utang ke pihak lain dan piutang yang harus ditagih. |
| `/reports` | `reports` | `ReportsView.vue` | Laporan komprehensif, distribusi pengeluaran, dan grafik candlestick arus kas. |
| `/settings` | `settings` | `SettingsView.vue` | Pengaturan PIN keamanan, manajemen kategori transaksi, dan preferensi tema. |
| `/privacy` | `privacy` | `PrivacyPolicyView.vue` | Halaman Kebijakan Privasi terkait keamanan penyimpanan data lokal peramban. |
| `/terms` | `terms` | `TermsOfServiceView.vue` | Halaman Ketentuan Layanan penggunaan aplikasi MyFinanceFlow secara mandiri. |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView.vue` | Halaman kesalahan 404 jika alamat rute yang dimasukkan tidak terdaftar. |

---

## 🏗️ Struktur Tata Letak (`src/components/LayoutShell.vue`)

Layout utama aplikasi diatur oleh `LayoutShell.vue`. Komponen ini bertindak sebagai kerangka visual (shell) yang membungkus navigasi sidebar di sebelah kiri dan area konten dinamis di sebelah kanan.

### Fitur Utama LayoutShell:

1. **Sidebar Responsif**:
   * **Tampilan Desktop (Lebar layar > 900px)**: Sidebar menetap secara permanen di sebelah kiri dengan lebar tetap `280px`.
   * **Tampilan Mobile (Lebar layar <= 900px)**: Sidebar disembunyikan secara default. Pengguna dapat membukanya melalui tombol menu hamburger di pojok kiri atas. Ketika terbuka, ia muncul sebagai overlay melayang dengan latar belakang buram (*backdrop blur*).
   * Sistem mendeteksi ukuran layar secara dinamis menggunakan event listener `resize` pada window:
     ```typescript
     const syncViewport = () => {
       isDesktop.value = window.innerWidth > 900
       if (isDesktop.value) sidebarOpen.value = true
     }
     ```

2. **Filter Tanggal Global (Global Date Filter)**:
   * Filter tanggal global tidak lagi berada di sidebar. Sebaliknya, filter ini ditampilkan **inline di dalam halaman-halaman yang relevan**:
     * **DashboardView**: Terintegrasi pada header hero section.
     * **TransactionsView**: Terintegrasi dalam panel filter bersama pencarian dan filter nominal.
     * **ReportsView**: Terintegrasi pada header halaman laporan.
   * Filter ini tetap disimpan secara terpusat di `useUi.ts` dan digunakan oleh composable `useFinance.ts` untuk memfilter data transaksi secara instan.
   * Halaman **Planning** tidak menggunakan filter tanggal global karena sudah memiliki filter `month` sendiri yang tepat untuk konteks anggaran bulanan.

3. **Sistem Notifikasi Toast**:
   * Menyediakan wadah (*toast container*) di sudut kanan bawah layar untuk menampilkan pesan umpan balik sukses, peringatan, atau galat dari sistem secara elegan dengan animasi transisi.

4. **Konten Utama Dinamis (`RouterView`)**:
   * Konten halaman di sebelah kanan dibungkus di dalam elemen gulir (`overflow-y-auto h-screen`) untuk memastikan scrollbar halaman terisolasi dan tidak merusak layout sidebar.

5. **Mekanisme Reset Scroll Otomatis (Page Transition Reset)**:
   * Karena kontainer utama `<main>` menggunakan `overflow-y-auto`, transisi halaman Vue Router standar tidak mengembalikan scrollbar peramban ke atas.
   * Untuk mengatasi ini, terdapat pengamat rute (`watch`) yang mereset scroll kontainer utama ke paling atas (`scrollTop = 0`) seketika saat rute berganti:
     ```typescript
     watch(() => route.path, () => {
       if (mainElement.value) mainElement.value.scrollTop = 0
     })
     ```

6. **Deteksi Scroll & Tombol Scroll ke Atas**:
   * Komponen mendengarkan event scroll pada kontainer utama. Bila nilai `scrollTop` melebihi `200px`, tombol melayang "Scroll to Top" akan muncul secara otomatis.
   * Klik tombol memicu pengguliran halus (*smooth scroll*) ke atas melalui API browser `.scrollTo({ top: 0, behavior: 'smooth' })`.
