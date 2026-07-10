<template>
  <div class="max-w-3xl mx-auto py-8 px-4 leading-relaxed text-text">
    <header class="border-b border-border pb-4 mb-6">
      <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Informasi Hukum</p>
      <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Ketentuan Layanan</h1>
      <p class="text-xs text-muted font-semibold mt-1">Terakhir diperbarui: 10 Juli 2026</p>
    </header>

    <div class="flex flex-col gap-6 text-sm font-medium">
      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>⚖️</span> 1. Penerimaan Ketentuan
        </h2>
        <p class="text-muted leading-relaxed">
          Dengan mengakses atau menggunakan aplikasi web <strong>MyFinanceFlow</strong>, Anda setuju untuk terikat oleh Ketentuan Layanan ini. Aplikasi ini disediakan untuk pengelolaan keuangan pribadi secara sukarela dan mandiri.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>⚙️</span> 2. Batasan Tanggung Jawab (Disclaimer)
        </h2>
        <p class="text-muted leading-relaxed">
          Aplikasi ini disediakan "sebagaimana adanya" (AS IS) tanpa jaminan apa pun. Karena seluruh data disimpan secara eksklusif di dalam peramban web lokal Anda:
        </p>
        <ul class="list-disc pl-5 text-muted leading-relaxed flex flex-col gap-1.5">
          <li>Pengembang tidak bertanggung jawab atas kehilangan data akibat pembersihan cache peramban, kerusakan perangkat, atau hilangnya kode PIN Anda.</li>
          <li>Kami sangat menyarankan Anda melakukan ekspor cadangan data (backup) secara berkala menggunakan fitur "Ekspor JSON" yang tersedia di halaman Pengaturan.</li>
          <li>Aplikasi ini bukan alat penasihat investasi resmi atau perbankan berlisensi; segala keputusan finansial didasarkan sepenuhnya pada pertimbangan mandiri Anda.</li>
        </ul>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>💻</span> 3. Lisensi & Kode Sumber
        </h2>
        <p class="text-muted leading-relaxed">
          MyFinanceFlow adalah perangkat lunak open-source yang dilisensikan di bawah lisensi MIT. Anda dipersilakan untuk meninjau, memodifikasi, dan mendistribusikan kembali kode sumber aplikasi ini untuk keperluan non-komersial maupun komersial dengan tetap mencantumkan hak cipta pengembang asli: 
          <a href="https://github.com/XNS-ivy" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-bold ml-1">XNS-ivy</a>.
        </p>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-3">
        <h2 class="text-base font-bold text-text flex items-center gap-2">
          <span>🔧</span> 4. Perubahan Layanan
        </h2>
        <p class="text-muted leading-relaxed">
          Kami dapat memperbarui fitur, tampilan, atau tata letak aplikasi ini sewaktu-waktu guna meningkatkan pengalaman pengguna (UX) tanpa pemberitahuan tertulis sebelumnya.
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
