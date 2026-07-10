<script setup lang="ts">
import { computed } from 'vue'
import { useFinance } from '../composables/useFinance'

const { automatedInsights, budgetAlerts, downloadCsvReport, downloadExcelReport, downloadPdfReport, exportSummaryText, filteredTransactions, monthlyComparison } = useFinance()
const canExport = computed(() => filteredTransactions.value.length > 0)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="bg-linear-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="z-10 grow max-w-2xl">
        <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">Reports</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Unduh Laporan & Analisis Uangmu</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">Unduh laporanmu dalam format CSV, Excel, atau PDF. Data yang diunduh otomatis mengikuti rentang tanggal filter aktif.</p>
      </div>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Ekspor Berkas</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">CSV/Excel sangat ideal untuk pemrosesan spreadsheet lanjutan. PDF cocok untuk dibagikan secara rapi.</p>
        <div class="flex flex-wrap gap-3">
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-primary/20 border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadCsvReport">
            Download CSV
          </button>
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-emerald-600/20 border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadExcelReport">
            Download Excel
          </button>
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadPdfReport">
            Download PDF
          </button>
        </div>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Snapshot Bulanan</h2>
        <ul class="flex flex-col gap-3 pr-1 text-sm font-semibold">
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>Pemasukan:</span>
            <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'">
              {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>Pengeluaran:</span>
            <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'">
              {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>Net:</span>
            <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'">
              {{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted">
            <span>Transaksi Terfilter:</span>
            <strong class="text-text">{{ filteredTransactions.length }}</strong>
          </li>
        </ul>
      </article>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Insight Otomatis</h2>
        <ul class="flex flex-col gap-2.5 text-xs text-muted font-semibold list-disc pl-4">
          <li v-for="item in automatedInsights" :key="item" class="leading-relaxed">{{ item }}</li>
        </ul>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Alert Anggaran</h2>
        <div v-if="budgetAlerts.length" class="flex flex-col gap-2.5">
          <div v-for="item in budgetAlerts" :key="item.id" class="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl bg-surface-2 border text-xs" :class="item.level === 'danger' ? 'border-danger/30 text-danger-text' : 'border-amber-500/30 text-amber-600'">
            <strong class="font-bold uppercase tracking-wider">{{ item.category }}</strong>
            <span class="font-medium opacity-90">{{ item.message }}</span>
          </div>
        </div>
        <p v-else class="text-center py-6 text-xs text-muted font-semibold">Semua anggaran aman. Belum ada peringatan batas limit.</p>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Ringkasan Teks</h2>
      <pre class="font-mono text-xs whitespace-pre-wrap leading-relaxed text-text bg-surface-2 border border-border rounded-xl p-4 overflow-x-auto">{{ exportSummaryText }}</pre>
    </section>
  </div>
</template>

