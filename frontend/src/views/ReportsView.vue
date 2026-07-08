<script setup lang="ts">
import { computed } from 'vue'
import { useFinance } from '../composables/useFinance'

const { automatedInsights, budgetAlerts, downloadCsvReport, exportSummaryText, monthlyComparison, transactions } = useFinance()

const canExport = computed(() => transactions.value.length > 0)
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Reports</p>
        <h1>Export laporan dan baca insight cepat</h1>
        <p>Halaman ini menyiapkan ringkasan yang bisa diexport ke CSV dan mempermudah membaca insight tanpa harus membuka semua halaman.</p>
      </div>
    </header>

    <section class="grid">
      <article class="card">
        <h2>Export</h2>
        <p class="subtle">Gunakan CSV untuk dibuka di Excel, Google Sheets, atau tools analisis lainnya.</p>
        <button class="primary-btn" type="button" :disabled="!canExport" @click="downloadCsvReport">Download CSV</button>
      </article>

      <article class="card">
        <h2>Snapshot Bulanan</h2>
        <ul>
          <li>Pemasukan berubah {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}</li>
          <li>Pengeluaran berubah {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}</li>
          <li>Net berubah {{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}</li>
        </ul>
      </article>
    </section>

    <section class="grid">
      <article class="card">
        <h2>Insight Otomatis</h2>
        <ul>
          <li v-for="item in automatedInsights" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="card">
        <h2>Alert Anggaran</h2>
        <div v-if="budgetAlerts.length" class="alert-list">
          <div v-for="item in budgetAlerts" :key="item.id" class="alert-item" :class="item.level">
            <strong>{{ item.category }}</strong>
            <span>{{ item.message }}</span>
          </div>
        </div>
        <p v-else class="subtle">Belum ada alert. Semua anggaran masih aman.</p>
      </article>
    </section>

    <section class="card">
      <h2>Ringkasan Teks</h2>
      <pre class="summary">{{ exportSummaryText }}</pre>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), var(--hero-accent)); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; opacity: 0.8; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.subtle { color: var(--muted); }
.alert-list { display: flex; flex-direction: column; gap: 0.7rem; }
.alert-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.8rem 0.9rem; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.alert-item.warning { border-color: #f59e0b; }
.alert-item.danger { border-color: var(--danger); }
.summary { white-space: pre-wrap; font: inherit; background: var(--surface-2); border: 1px solid var(--border); border-radius: 14px; padding: 1rem; color: var(--text); }
</style>
