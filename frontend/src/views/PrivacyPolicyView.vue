<template>
  <div class="max-w-3xl mx-auto py-8 px-4 leading-relaxed text-text">
    <header class="border-b border-border pb-4 mb-6">
      <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Informasi Hukum</p>
      <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Kebijakan Privasi</h1>
      <p class="text-xs text-muted font-semibold mt-1">Terakhir diperbarui: 10 Juli 2026</p>
    </header>

    <div class="flex flex-col gap-6 text-sm font-medium">
      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <svg class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          1. Keamanan Data Lokal Pertama
        </h2>
        <p class="text-muted leading-relaxed">
          <strong>MyFinanceFlow</strong> dibangun dengan prinsip privasi mutlak. Seluruh data keuangan, transaksi, aset, dan konfigurasi PIN Anda disimpan secara lokal di dalam peramban web (browser) Anda menggunakan <strong>localStorage</strong>. Kami tidak mengumpulkan, mengirim, atau memproses data keuangan Anda ke server mana pun di luar perangkat Anda.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <svg class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          2. Proteksi Kode PIN Keamanan
        </h2>
        <p class="text-muted leading-relaxed">
          Aplikasi ini menyediakan pengunci PIN 4-digit opsional untuk melindungi privasi tampilan data Anda pada perangkat Anda. PIN ini di-hash dan disimpan secara lokal pada peramban Anda. Status unlock Anda hanya disimpan secara sementara di <code>sessionStorage</code> yang akan otomatis kedaluwarsa setelah tab peramban ditutup.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <svg class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          3. Penggunaan Cookies & Data Pihak Ketiga
        </h2>
        <p class="text-muted leading-relaxed">
          Kami tidak menggunakan cookies pelacak atau analitik pihak ketiga yang invasif. Seluruh grafik visualisasi data diproses secara client-side menggunakan library open-source <strong>Chart.js</strong>.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <svg class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          4. Hak Pengguna & Penghapusan Data
        </h2>
        <p class="text-muted leading-relaxed">
          Anda memiliki kontrol penuh atas data Anda setiap saat. Anda dapat melakukan ekspor cadangan data keuangan Anda ke format file JSON atau mengunduh laporan berformat CSV/Excel. Jika Anda ingin menghapus seluruh data, Anda dapat melakukannya melalui menu pengaturan di dalam aplikasi, atau dengan cara menghapus data situs (clear cache/data site) pada peramban Anda.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <svg class="w-5 h-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
          5. Hubungi Pengembang
        </h2>
        <p class="text-muted leading-relaxed">
          Apabila Anda memiliki pertanyaan, saran, atau kontribusi kode terkait kebijakan privasi ini, Anda dapat menghubungi pengembang utama melalui profil resmi GitHub kami di:
          <a href="https://github.com/XNS-ivy" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-bold ml-1">XNS-ivy</a>.
        </p>
      </section>
    </div>

    <div class="mt-8 text-center">
      <RouterLink to="/" class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary bg-primary-soft hover:bg-primary-muted transition-colors inline-block decoration-none">
        Kembali ke Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
