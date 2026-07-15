# Finance Flow - Project Context & Documentation

Selamat datang di dokumentasi proyek **Finance Flow** (Laporan Keuangan). Dokumen ini memberikan gambaran umum tentang struktur proyek, alur (flow) frontend, dan cara menjalankan aplikasi ini.

---

## 📋 Daftar Isi Dokumen

1. **[Konteks Utama (context.md)](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/docs/context.md)**: Gambaran umum proyek, struktur folder, dan petunjuk setup.
2. **[Manajemen State (state-management.md)](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/docs/state-management.md)**: Dokumentasi pemisahan state reaktif global (`useFinanceState.ts`), model tipe data (`finance.ts`), serta Composable API (`useFinance.ts`).
3. **[Alur Keamanan PIN (security-flow.md)](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/docs/security-flow.md)**: Dokumentasi alur penguncian aplikasi dengan kode PIN.
4. **[Navigasi & Routing (routing-navigation.md)](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/docs/routing-navigation.md)**: Penjelasan mengenai navigasi, router, dan layout aplikasi.
5. **[Fitur & Modul Utama (features.md)](file:///home/m-riski/Programming/vue-laporan-keuangan/frontend/docs/features.md)**: Penjelasan detail fitur-fitur seperti Transaksi, Anggaran, Aset (dengan penyesuaian nilai), Utang Piutang (dengan pencarian & edit), dan Laporan.

---

## 🚀 Gambaran Umum Proyek

**Finance Flow** adalah aplikasi pengelolaan keuangan pribadi berbasis web yang dibangun dengan **Vue 3 (Composition API)**, **TypeScript**, dan **Vite**. Aplikasi ini dirancang agar aman, ringan, dan berjalan sepenuhnya di sisi klien (client-side) dengan penyimpanan data terenkripsi/terlokalisasi di `localStorage` peramban.

### Tech Stack Utama:
* **Framework**: Vue 3 (Composition API, `<script setup>`)
* **Build Tool & Bundler**: Vite
* **Bahasa**: TypeScript
* **Styling**: CSS (TailwindCSS v4)
* **Routing**: Vue Router
* **Visualisasi Data**: Chart.js / Vue-Chartjs (grafik keuangan, tren, dan candlestick saldo)
* **Utilitas**: XLSX (untuk fitur ekspor data transaksi ke Excel)
* **Ikonografi**: Inline SVG (Feather/Lucide-style icons) — tanpa dependensi library icon eksternal

---

## 📂 Struktur Direktori Proyek

Berikut adalah gambaran umum dari struktur folder frontend terbaru setelah refaktorisasi modular:

```text
frontend/
├── .vscode/               # Konfigurasi editor VS Code (file nesting, dll.)
├── docs/                  # Dokumentasi teknis sistem (folder saat ini)
│   ├── context.md
│   ├── state-management.md
│   ├── security-flow.md
│   ├── routing-navigation.md
│   └── features.md
├── public/                # Aset statis public
│   ├── sw.js              # Service Worker (Offline caching & PWA)
│   └── manifest.webmanifest # Manifest PWA untuk instalasi aplikasi
├── src/
│   ├── assets/            # Aset CSS global, logo, dsb.
│   ├── types/             # Layer Type Definition
│   │   └── finance.ts     # Struktur model & interface TypeScript
│   ├── components/        # Komponen UI reusable (Charts, Form, Shell, dll.)
│   │   ├── BalanceCandlestickChart.vue
│   │   ├── FinanceChart.vue
│   │   ├── LayoutShell.vue
│   │   ├── SecurityLock.vue
│   │   ├── StatCard.vue
│   │   └── TransactionForm.vue
│   ├── composables/       # Logika bisnis global (State, Theme, UI)
│   │   ├── useFinance.ts  # Layer Presentation & CRUD API Keuangan
│   │   ├── useFinanceState.ts # Layer Core State (refs) & LocalStorage
│   │   ├── useNotifications.ts # Reminder & notifikasi toast
│   │   ├── usePwaInstall.ts # PWA install prompt & banner management
│   │   ├── useTheme.ts    # Manajemen tema (Light, Dark, Midnight)
│   │   └── useUi.ts       # State global UI (filter tanggal, toast)
│   ├── router/            # Konfigurasi rute halaman (index.ts)
│   ├── views/             # Halaman-halaman utama (Views)
│   │   ├── AssetsView.vue
│   │   ├── DashboardView.vue
│   │   ├── DebtsView.vue
│   │   ├── PlanningView.vue
│   │   ├── ReportsView.vue
│   │   ├── PrivacyPolicyView.vue
│   │   ├── SavingsGoalView.vue
│   │   ├── SettingsView.vue
│   │   ├── TermsOfServiceView.vue
│   │   ├── TransactionsView.vue
│   │   └── WelcomeView.vue
│   ├── App.vue            # Komponen root (pintu masuk aplikasi & PIN lock)
│   └── main.ts            # Entrypoint TypeScript
├── bun.lock
├── package.json           # Dependensi npm & skrip build
├── tsconfig.json          # Konfigurasi TypeScript
└── vite.config.ts         # Konfigurasi Vite
```

### 🌐 Service Worker & Akses Offline
Aplikasi dirancang dengan arsitektur **Offline-First**. Berkas `public/sw.js` bertindak sebagai Service Worker yang meng-cache aset statis aplikasi (HTML, JS, CSS, gambar) menggunakan strategi *Stale-While-Revalidate*. Hal ini memastikan:
1. Aplikasi dapat diakses sepenuhnya meskipun perangkat sedang luring (tanpa koneksi internet).
2. Performa pemuatan halaman sangat cepat karena aset diambil langsung dari cache lokal browser.
3. Notifikasi pengingat lokal dapat dikirimkan secara terjadwal melalui registrasi Service Worker (`registration.showNotification`).
4. Aplikasi dapat diinstal langsung di perangkat mobile/desktop sebagai Progressive Web App (PWA) berkat integrasi dengan `manifest.webmanifest`.
5. Aset kritis (`/`, `/index.html`, `/manifest.webmanifest`) di-pre-cache saat install untuk menjamin ketersediaan offline sejak pertama kali Service Worker aktif.

---

## ⚙️ Petunjuk Menjalankan Aplikasi

Aplikasi ini dikonfigurasi untuk dijalankan menggunakan **Bun** atau **Node.js/NPM**.

### 1. Instalasi Dependensi
Jalankan perintah berikut di folder `frontend` untuk mengunduh semua library yang diperlukan:
```bash
# Menggunakan Bun
bun install

# Atau menggunakan NPM
npm install
```

### 2. Mode Pengembangan (Development)
Untuk menjalankan server lokal dengan fitur hot-reload:
```bash
# Menggunakan Bun
bun dev

# Atau menggunakan NPM
npm run dev
```
Setelah berjalan, buka alamat yang tertera di terminal (biasanya `http://localhost:5173`).

### 3. Build Produksi (Production Build)
Untuk melakukan compile dan optimasi berkas ke folder `dist` siap hosting:
```bash
# Menggunakan Bun
bun run build

# Atau menggunakan NPM
npm run build
```
