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
          <span>🛡️</span> 1. Keamanan Data Lokal Pertama
        </h2>
        <p class="text-muted leading-relaxed">
          <strong>MyFinanceFlow</strong> dibangun dengan prinsip privasi mutlak. Seluruh data keuangan, transaksi, aset, dan konfigurasi PIN Anda disimpan secara lokal di dalam peramban web (browser) Anda menggunakan <strong>localStorage</strong>. Kami tidak mengumpulkan, mengirim, atau memproses data keuangan Anda ke server mana pun di luar perangkat Anda.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>🔑</span> 2. Proteksi Kode PIN Keamanan
        </h2>
        <p class="text-muted leading-relaxed">
          Aplikasi ini menyediakan pengunci PIN 4-digit opsional untuk melindungi privasi tampilan data Anda pada perangkat Anda. PIN ini di-hash dan disimpan secara lokal pada peramban Anda. Status unlock Anda hanya disimpan secara sementara di <code>sessionStorage</code> yang akan otomatis kedaluwarsa setelah tab peramban ditutup.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>📊</span> 3. Penggunaan Cookies & Data Pihak Ketiga
        </h2>
        <p class="text-muted leading-relaxed">
          Kami tidak menggunakan cookies pelacak atau analitik pihak ketiga yang invasif. Seluruh grafik visualisasi data diproses secara client-side menggunakan library open-source <strong>Chart.js</strong>.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>🧹</span> 4. Hak Pengguna & Penghapusan Data
        </h2>
        <p class="text-muted leading-relaxed">
          Anda memiliki kontrol penuh atas data Anda setiap saat. Anda dapat melakukan ekspor cadangan data keuangan Anda ke format file JSON atau mengunduh laporan berformat CSV/Excel. Jika Anda ingin menghapus seluruh data, Anda dapat melakukannya melalui menu pengaturan di dalam aplikasi, atau dengan cara menghapus data situs (clear cache/data site) pada peramban Anda.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>✉️</span> 5. Hubungi Pengembang
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
