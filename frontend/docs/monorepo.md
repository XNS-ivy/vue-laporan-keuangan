# Monorepo Architecture & Setup Guide (`monorepo.md`)

Proyek **MyFinanceFlow** terstruktur sebagai **Monorepo** yang memisahkan aplikasi utama pengguna (`frontend`) dengan paket-paket pendukung di masa mendatang (`packages/*`).

---

## 📁 Struktur Direktori Monorepo

```text
vue-laporan-keuangan/
├── package.json                 # Root Monorepo configuration & workspace scripts
├── ecosystem.config.cjs         # PM2 / Server process manager deployment config
├── frontend/                    # Vue 3 Single Page Application (SPA / PWA)
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   ├── composables/         # Reactive Finance & User Settings Engine
│   │   ├── views/               # Route Page Views (Dashboard, Utilities, Settings, etc.)
│   │   ├── router/              # Vue Router 4 Routing Configuration
│   │   └── types/               # TypeScript Models & Interfaces
│   ├── docs/                    # Technical & Feature Documentation
│   └── package.json             # Frontend package configuration
└── packages/                    # Reserved directory for shared micro-packages
```

---

## ⚡ Skrip Monorepo (Root Package Scripts)

Skrip utama dijalankan dari direktori akar proyek (*root directory*) menggunakan Bun / npm / pnpm:

| Command | Action / Target | Description |
| :--- | :--- | :--- |
| `bun run dev` | `bun --cwd frontend run dev` | Menjalankan Vite Dev Server untuk aplikasi frontend |
| `bun run build` | `bun --cwd frontend run build` | Menjalankan type-checking `vue-tsc` & memproduksi bundle produksi |
| `bun run preview` | `bun --cwd frontend run preview` | Menjalankan server preview lokal dari bundle dist hasil build |
| `bun run type-check` | `bun --cwd frontend run type-check` | Mengecek tipe TypeScript secara menyeluruh tanpa memproduksi file |

---

## 🛠️ Manajemen Dependensi Workspace

Aplikasi memanfaatkan fitur `workspaces` bawaan `package.json`:

```json
{
  "name": "vue-laporan-keuangan-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "packages/*"
  ]
}
```

Menambahkan dependensi ke workspace `frontend` dari root:
```bash
# Menambahkan package ke frontend
bun add <package-name> --cwd frontend
```

---

## 🚀 Konfigurasi PM2 Process Manager (`ecosystem.config.cjs`)

Konfigurasi `ecosystem.config.cjs` dikonfigurasi untuk mengeksekusi skrip dari **root `package.json`** (`cwd: "./"`):

```javascript
module.exports = {
  apps: [
    {
      name: "vue-laporan-keuangan",
      script: "bun",
      args: "run preview -- --host 0.0.0.0",
      cwd: "./",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M"
    }
  ]
};
```

