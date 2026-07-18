<script setup lang="ts">
import { computed } from 'vue'
import { useFinance } from '../composables/useFinance'
import { useUi } from '../composables/useUi'
import { t, formatMoney } from '../composables/useUserSettings'

const { automatedInsights, budgetAlerts, downloadCsvReport, downloadExcelReport, downloadPdfReport, exportSummaryText, filteredTransactions, monthlyComparison } = useFinance()
const canExport = computed(() => filteredTransactions.value.length > 0)
const { globalDateFilter, hasDateFilter, resetGlobalDateFilter, setGlobalDateFilter } = useUi()
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="bg-linear-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="z-10 grow max-w-2xl">
        <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">{{ t({ id: 'Reports', en: 'Reports', ja: 'レポート', es: 'Informes' }) }}</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{{ t({ id: 'Unduh Laporan & Analisis Uangmu', en: 'Download Reports & Analyze Money', ja: 'レポートのダウンロードとお金の分析', es: 'Descargar Informes y Analizar su Dinero' }) }}</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">{{ t({ id: 'Unduh laporanmu dalam format CSV, Excel, atau PDF. Data yang diunduh otomatis mengikuti rentang tanggal filter aktif.', en: 'Download reports in CSV, Excel, or PDF format. The downloaded data automatically follows the active date filter range.', ja: 'CSV、Excel、またはPDF形式でレポートをダウンロードします。ダウンロードされたデータは自動的にアクティブな日付フィルター範囲に従います。', es: 'Descargue informes en formato CSV, Excel o PDF. Los datos descargados siguen automáticamente el rango de filtro de fecha activo.' }) }}</p>
      </div>
      <div class="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 shrink-0 z-10">
        <svg class="w-3.5 h-3.5 text-white/70 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        <input
          :value="globalDateFilter.start"
          type="date"
          class="bg-transparent text-white text-xs font-semibold border-none focus:outline-none w-28"
          @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })"
        />
        <span class="text-white/40 text-xs">–</span>
        <input
          :value="globalDateFilter.end"
          type="date"
          class="bg-transparent text-white text-xs font-semibold border-none focus:outline-none w-28"
          @input="setGlobalDateFilter({ end: ($event.target as HTMLInputElement).value })"
        />
        <button
          v-if="hasDateFilter"
          class="text-white/60 hover:text-white border-none bg-transparent cursor-pointer p-0.5 transition-colors"
          type="button"
          @click="resetGlobalDateFilter"
          aria-label="Reset filter"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </header>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Ekspor Berkas', en: 'Export Files', ja: 'ファイルのエクスポート', es: 'Exportar Archivos' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'CSV/Excel sangat ideal untuk pemrosesan spreadsheet lanjutan. PDF cocok untuk dibagikan secara rapi.', en: 'CSV/Excel is ideal for advanced spreadsheet processing. PDF is suitable for clean sharing.', ja: 'CSV/Excelは高度なスプレッドシート処理に最適です。PDFはきれいに共有するのに適しています。', es: 'CSV/Excel es ideal para el procesamiento avanzado de hojas de cálculo. PDF es adecuado para compartir de forma limpia.' }) }}</p>
        <div class="flex flex-wrap gap-3">
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-primary/20 border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadCsvReport">
            {{ t({ id: 'Download CSV', en: 'Download CSV', ja: 'CSVダウンロード', es: 'Descargar CSV' }) }}
          </button>
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-emerald-600/20 border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadExcelReport">
            {{ t({ id: 'Download Excel', en: 'Download Excel', ja: 'Excelダウンロード', es: 'Descargar Excel' }) }}
          </button>
          <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!canExport" @click="downloadPdfReport">
            {{ t({ id: 'Download PDF', en: 'Download PDF', ja: 'PDFダウンロード', es: 'Descargar PDF' }) }}
          </button>
        </div>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Snapshot Bulanan', en: 'Monthly Snapshot', ja: '月次スナップショット', es: 'Instantánea Mensual' }) }}</h2>
        <ul class="flex flex-col gap-3 pr-1 text-sm font-semibold">
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}:</span>
            <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'">
              {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.incomeChange) }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}:</span>
            <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'">
              {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.expenseChange) }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted pb-2 border-b border-border/40">
            <span>{{ t({ id: 'Net', en: 'Net', ja: '純額', es: 'Neto' }) }}:</span>
            <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'">
              {{ monthlyComparison.netChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.netChange) }}
            </strong>
          </li>
          <li class="flex justify-between items-center text-muted">
            <span>{{ t({ id: 'Transaksi Terfilter', en: 'Filtered Transactions', ja: 'フィルターされた取引', es: 'Transacciones Filtradas' }) }}:</span>
            <strong class="text-text">{{ filteredTransactions.length }}</strong>
          </li>
        </ul>
      </article>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Insight Otomatis', en: 'Automated Insights', ja: '自動インサイト', es: 'Perspectivas Automáticas' }) }}</h2>
        <ul class="flex flex-col gap-2.5 text-xs text-muted font-semibold list-disc pl-4">
          <li v-for="item in automatedInsights" :key="item" class="leading-relaxed">{{ item }}</li>
        </ul>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Alert Anggaran', en: 'Budget Alerts', ja: '予算アラート', es: 'Alertas de Presupuesto' }) }}</h2>
        <div v-if="budgetAlerts.length" class="flex flex-col gap-2.5">
          <div v-for="item in budgetAlerts" :key="item.id" class="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl bg-surface-2 border text-xs" :class="item.level === 'danger' ? 'border-danger/30 text-danger-text' : 'border-amber-500/30 text-amber-600'">
            <strong class="font-bold uppercase tracking-wider">{{ item.category }}</strong>
            <span class="font-medium opacity-90">{{ item.message }}</span>
          </div>
        </div>
        <p v-else class="text-center py-6 text-xs text-muted font-semibold">{{ t({ id: 'Semua anggaran aman. Belum ada peringatan batas limit.', en: 'All budgets are safe. No limit alerts yet.', ja: 'すべての予算は安全です。制限アラートはまだありません。', es: 'Todos los presupuestos están seguros. Aún no hay alertas de límite.' }) }}</p>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Ringkasan Teks', en: 'Text Summary', ja: 'テキストの概要', es: 'Resumen de Texto' }) }}</h2>
      <pre class="font-mono text-xs whitespace-pre-wrap leading-relaxed text-text bg-surface-2 border border-border rounded-xl p-4 overflow-x-auto">{{ exportSummaryText }}</pre>
    </section>
  </div>
</template>
