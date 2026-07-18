<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StatCard from '../components/StatCard.vue'
import FinanceChart from '../components/FinanceChart.vue'
import BalanceCandlestickChart from '../components/BalanceCandlestickChart.vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'
import { getThemeSettings } from '../composables/useTheme'
import { useUi } from '../composables/useUi'
import { appMode, t, formatMoney } from '../composables/useUserSettings'

const {
  filteredTransactions: transactions,
  categories,
  incomeTotal,
  expenseTotal,
  balance,
  totalAssets,
  expenseByCategory,
  incomeByCategory,
  categoryAnalytics,
  monthlyTrend,
  monthlyComparison,
  transactionCount,
  averageIncome,
  averageExpense,
  savingsGoalProgress,
  savingsGoalTarget,
  monthsToGoal,
  budgetAlerts,
  currentMonthBudgetSummary,
  nextMonthForecast,
  categoryForecasts,
  automatedInsights,
  totalDebt,
  totalReceivable,
  addTransaction,
  addCategory,
} = useFinance()

const { globalDateFilter, hasDateFilter, resetGlobalDateFilter, setGlobalDateFilter } = useUi()

const isDark = ref(false)

const updateThemeStatus = () => {
  const settings = getThemeSettings()
  isDark.value = settings.mode === 'dark' || settings.mode === 'midnight'
}

onMounted(() => {
  updateThemeStatus()
  window.addEventListener('theme-preference-changed', updateThemeStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('theme-preference-changed', updateThemeStatus)
})

const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.06)' : '#e2e8f0')
const textColor = computed(() => isDark.value ? '#94a3b8' : '#64748b')
const tooltipBgColor = computed(() => isDark.value ? '#111827' : '#ffffff')
const tooltipBorderColor = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : '#e2e8f0')
const tooltipTextColor = computed(() => isDark.value ? '#f8fafc' : '#0f172a')

const scaledChartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: textColor.value,
        font: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' }
      }
    },
    tooltip: {
      padding: 12,
      backgroundColor: tooltipBgColor.value,
      titleColor: tooltipTextColor.value,
      bodyColor: textColor.value,
      borderColor: tooltipBorderColor.value,
      borderWidth: 1,
      cornerRadius: 12,
      boxPadding: 6,
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: textColor.value, font: { family: 'Inter, system-ui, sans-serif', size: 10 } }
    },
    y: {
      grid: { color: gridColor.value, drawTicks: false, borderDash: [4, 4], lineWidth: 1 },
      ticks: { color: textColor.value, font: { family: 'Inter, system-ui, sans-serif', size: 10 } }
    }
  }
}))

const selectedDrilldownCategory = ref<string | null>(null)

const doughnutChartOptions = computed(() => ({
  responsive: true,
  cutout: '76%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: textColor.value,
        font: { family: 'Inter, system-ui, sans-serif', size: 11, weight: 'bold' }
      }
    },
    tooltip: {
      padding: 12,
      backgroundColor: tooltipBgColor.value,
      titleColor: tooltipTextColor.value,
      bodyColor: textColor.value,
      borderColor: tooltipBorderColor.value,
      borderWidth: 1,
      cornerRadius: 12,
      boxPadding: 6,
    }
  },
  onClick: (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index
      const entry = expenseByCategory.value[elementIndex]
      if (entry) {
        selectedDrilldownCategory.value = entry[0]
      }
    } else {
      selectedDrilldownCategory.value = null
    }
  }
}))

const drilldownTransactions = computed(() => {
  if (!selectedDrilldownCategory.value) return []
  return transactions.value.filter(
    (t) =>
      t.category.toLowerCase() === selectedDrilldownCategory.value!.toLowerCase() &&
      t.type === 'expense'
  )
})

const palette = computed(() => isDark.value
  ? ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#c084fc', '#2dd4bf', '#818cf8']
  : ['#0284c7', '#e11d48', '#16a34a', '#d97706', '#7c3aed', '#0d9488', '#4f46e5']
)

const expenseChartData = computed(() => ({
  labels: expenseByCategory.value.map(([category]) => category),
  datasets: [{ data: expenseByCategory.value.map(([, amount]) => amount), backgroundColor: palette.value }],
}))

const monthlyChartData = computed(() => ({
  labels: monthlyTrend.value.map(([month]) => month),
  datasets: [
    { label: 'Pemasukan', data: monthlyTrend.value.map(([, values]) => values.income), backgroundColor: isDark.value ? '#4ade80' : '#16a34a' },
    { label: 'Pengeluaran', data: monthlyTrend.value.map(([, values]) => values.expense), backgroundColor: isDark.value ? '#f87171' : '#dc2626' },
  ],
}))

const cashflowChartData = computed(() => ({
  labels: monthlyTrend.value.map(([month]) => month),
  datasets: [
    {
      label: 'Arus Kas Bersih',
      data: monthlyTrend.value.map(([, values]) => values.net),
      borderColor: isDark.value ? '#38bdf8' : '#0284c7',
      backgroundColor: isDark.value ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.12)',
      fill: true,
      tension: 0.32,
    },
  ],
}))

const categoryActivityChartData = computed(() => ({
  labels: categoryAnalytics.value.slice(0, 6).map((item) => item.name),
  datasets: [
    {
      label: 'Frekuensi Transaksi',
      data: categoryAnalytics.value.slice(0, 6).map((item) => item.count),
      backgroundColor: categoryAnalytics.value.slice(0, 6).map((_, index) => palette.value[index % palette.value.length]),
    },
  ],
}))

const budgetVsExpenseChartData = computed(() => {
  const activeBudgets = currentMonthBudgetSummary.value.filter((b) => b.amount > 0)
  const labels = activeBudgets.map((item) => item.category)
  const budgetAmounts = activeBudgets.map((item) => item.amount)
  const usedAmounts = activeBudgets.map((item) => item.used)

  return {
    labels,
    datasets: [
      {
        label: 'Anggaran',
        data: budgetAmounts,
        backgroundColor: isDark.value ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.75)',
      },
      {
        label: 'Realisasi',
        data: usedAmounts,
        backgroundColor: isDark.value ? 'rgba(248, 113, 113, 0.65)' : 'rgba(220, 38, 38, 0.75)',
      },
    ],
  }
})

const balanceCandlesticks = computed(() => {
  const sorted = [...transactions.value].sort((a, b) => a.date.localeCompare(b.date))
  const monthsMap = new Map<string, typeof transactions.value>()
  
  sorted.forEach(t => {
    const m = t.date.slice(0, 7)
    if (!monthsMap.has(m)) monthsMap.set(m, [])
    monthsMap.get(m)!.push(t)
  })
  
  const sortedMonths = Array.from(monthsMap.keys()).sort()
  let runningBalance = 0
  const candlesticks: Array<{ month: string; open: number; close: number; high: number; low: number }> = []
  
  sortedMonths.forEach(m => {
    const monthTx = monthsMap.get(m)!
    const open = runningBalance
    let high = runningBalance
    let low = runningBalance
    
    monthTx.forEach(t => {
      if (t.type === 'income') {
        runningBalance += t.amount
      } else {
        runningBalance -= t.amount
      }
      if (runningBalance > high) high = runningBalance
      if (runningBalance < low) low = runningBalance
    })
    
    const close = runningBalance
    candlesticks.push({
      month: m,
      open,
      close,
      high,
      low
    })
  })
  
  return candlesticks.slice(-6)
})

const latestTransactions = computed(() => [...transactions.value].slice(0, 6))
const biggestExpense = computed(() => expenseByCategory.value[0])
const topIncome = computed(() => incomeByCategory.value[0])
const savingsRate = computed(() => (incomeTotal.value ? Math.round((balance.value / incomeTotal.value) * 100) : 0))
const healthiestCategory = computed(() => categoryAnalytics.value[0])
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="bg-linear-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="z-10 grow max-w-2xl">
        <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">{{ t({ id: 'Dashboard', en: 'Dashboard', ja: 'ダッシュボード', es: 'Tablero' }) }}</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{{ t({ id: 'Yuk, Lacak & Atur Keuanganmu!', en: "Let's Track & Manage Your Finances!", ja: 'お金を追跡して管理しましょう！', es: '¡Hagamos un seguimiento de sus finanzas!' }) }}</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">
          {{ appMode === 'simple' 
              ? t({ id: 'Pantau pemasukan dan pengeluaran harianmu dengan mudah.', en: 'Easily monitor your daily income and expenses.', ja: '毎日の収入と支出を簡単に監視します。', es: 'Monitoree fácilmente sus ingresos y gastos diarios.' })
              : t({ id: 'Pantau perbandingan bulanan, wawasan otomatis, batas anggaran, target tabungan, dan status utang-piutang biar keputusan finansialmu makin matang.', en: 'Monitor monthly comparisons, automated insights, budget limits, savings goals, and debt status to make wiser financial decisions.', ja: '月次の比較、自動の洞察、予算制限、貯蓄目標、および債務状況を監視して、より賢明な財務上の決定を下します。', es: 'Monitoree las comparaciones mensuales, los conocimientos automáticos, los límites de presupuesto, las metas de ahorro y el estado de la deuda para tomar decisiones financieras más sabias.' })
          }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2.5 shrink-0 z-10">
        <div class="flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5">
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
        <RouterLink v-if="appMode === 'advance'" to="/reports" class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-center">
          {{ t({ id: 'Export Laporan', en: 'Export Report', ja: 'レポートをエクスポート', es: 'Exportar Informe' }) }}
        </RouterLink>
        <RouterLink v-if="appMode === 'advance'" to="/savings-goal" class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-sidebar-bg bg-white hover:bg-white/90 active:scale-95 transition-all text-center shadow-md">
          {{ t({ id: 'Kelola Goal', en: 'Manage Goal', ja: '目標の管理', es: 'Gestionar Meta' }) }}
        </RouterLink>
      </div>
    </header>

    <section :class="appMode === 'simple' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'" class="grid gap-4">
      <StatCard :label="t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' })" :value="formatMoney(incomeTotal)" tone="positive" />
      <StatCard :label="t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' })" :value="formatMoney(expenseTotal)" tone="negative" />
      <StatCard :label="t({ id: 'Saldo', en: 'Balance', ja: '残高', es: 'Saldo' })" :value="formatMoney(balance)" :tone="balance >= 0 ? 'positive' : 'negative'" />
      <StatCard v-if="appMode === 'advance'" :label="t({ id: 'Aset', en: 'Assets', ja: '資産', es: 'Activos' })" :value="formatMoney(totalAssets)" tone="neutral" />
    </section>

    <section :class="appMode === 'simple' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]'" class="grid gap-6">
      <TransactionForm
        :categories="categories"
        @submit="addTransaction"
        @add-category="({ name, type }) => addCategory(name, type)"
      />

      <div v-if="appMode === 'advance'" class="flex flex-col gap-6">
        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-text tracking-tight">{{ t({ id: 'Insight Utama', en: 'Key Insights', ja: '主なインサイト', es: 'Perspectivas Clave' }) }}</h3>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-primary-soft uppercase tracking-wider">
              {{ t({ id: 'Transaksi', en: 'Transactions', ja: '取引数', es: 'Transacciones' }) }}: {{ transactionCount }}
            </span>
          </div>
          <ul class="flex flex-col gap-3 pr-1 text-sm">
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Rasio Tabungan', en: 'Savings Ratio', ja: '貯蓄率', es: 'Tasa de Ahorro' }) }}:</span>
              <strong class="text-text font-bold">{{ savingsRate }}%</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Avg Uang Masuk/Tx', en: 'Avg Income/Tx', ja: '平均収入/取引', es: 'Ingreso Promedio/Tx' }) }}:</span>
              <strong class="text-text font-bold">{{ formatMoney(averageIncome) }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Avg Uang Keluar/Tx', en: 'Avg Expense/Tx', ja: '平均支出/取引', es: 'Gasto Promedio/Tx' }) }}:</span>
              <strong class="text-text font-bold">{{ formatMoney(averageExpense) }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Pengeluaran Terbesar', en: 'Biggest Expense', ja: '最大の支出', es: 'Mayor Gasto' }) }}:</span>
              <strong class="font-bold text-danger">{{ biggestExpense ? biggestExpense[0] : t({ id: 'Belum ada', en: 'None yet', ja: 'まだありません', es: 'Ninguno aún' }) }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium">
              <span>{{ t({ id: 'Pemasukan Terbesar', en: 'Biggest Income', ja: '最大の収入', es: 'Mayor Ingreso' }) }}:</span>
              <strong class="font-bold text-success">{{ topIncome ? topIncome[0] : t({ id: 'Belum ada', en: 'None yet', ja: 'まだありません', es: 'Ninguno aún' }) }}</strong>
            </li>
          </ul>
        </section>

        <!-- Smart Forecast Card -->
        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-text tracking-tight flex items-center gap-1.5">
              <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
              <span>{{ t({ id: 'Smart Forecast', en: 'Smart Forecast', ja: 'スマート予測', es: 'Pronóstico Inteligente' }) }}</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-primary-soft text-primary uppercase tracking-wider">
              {{ t({ id: 'Prediksi AI', en: 'AI Prediction', ja: 'AI予測', es: 'Predicción de IA' }) }}
            </span>
          </div>

          <div v-if="!nextMonthForecast.hasEnoughData" class="text-xs text-muted leading-relaxed py-4 font-semibold text-center flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            {{ t({ id: 'Butuh minimal 2 bulan histori transaksi untuk melakukan estimasi prediksi pengeluaran bulan depan.', en: 'Needs at least 2 months of transaction history to estimate next month\'s expenses.', ja: '来月の支出を予測するには、少なくとも2か月間の取引履歴が必要です。', es: 'Se necesitan al menos 2 meses de historial de transacciones para estimar los gastos del próximo mes.' }) }}
          </div>

          <div v-else class="flex flex-col gap-3.5">
            <!-- Prediksi Total -->
            <div>
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider">{{ t({ id: 'Prakiraan Pengeluaran Bulan Depan', en: 'Forecasted Expenses Next Month', ja: '来月の予測支出', es: 'Gastos Previstos para el Próximo Mes' }) }}</p>
              <div class="flex items-baseline gap-2 mt-1">
                <strong class="text-xl font-extrabold text-text">
                  {{ formatMoney(nextMonthForecast.predictedExpense) }}
                </strong>
                <span 
                  class="text-xs font-bold flex items-center" 
                  :class="nextMonthForecast.percentageChange > 0 ? 'text-danger' : nextMonthForecast.percentageChange < 0 ? 'text-success' : 'text-muted'"
                >
                  {{ nextMonthForecast.percentageChange > 0 ? '▲ +' : nextMonthForecast.percentageChange < 0 ? '▼ ' : '' }}{{ nextMonthForecast.percentageChange }}%
                </span>
              </div>
              <p class="text-[11px] text-muted font-semibold mt-1">
                {{ nextMonthForecast.trendDirection === 'up' 
                  ? t({ id: 'Tren pengeluaran Anda cenderung naik. Disarankan untuk memangkas beberapa biaya non-esensial.', en: 'Your expense trend is up. It is recommended to cut some non-essential costs.', ja: '支出傾向は上昇しています。不要不急のコストを削減することをお勧めします。', es: 'Su tendencia de gastos es alcista. Se recomienda recortar algunos costos no esenciales.' })
                  : nextMonthForecast.trendDirection === 'down'
                  ? t({ id: 'Kabar baik! Tren pengeluaran bulanan Anda menunjukkan penurunan.', en: 'Good news! Your monthly expense trend shows a decrease.', ja: '良いニュースです！月次の支出傾向は減少を示しています。', es: '¡Buenas noticias! Su tendencia de gastos mensuales muestra una disminución.' })
                  : t({ id: 'Tren pengeluaran Anda terpantau stabil.', en: 'Your expense trend remains stable.', ja: '支出傾向は安定しています。', es: 'Su tendencia de gastos se mantiene estable.' }) }}
              </p>
            </div>

            <!-- Breakdown Kategori Teratas -->
            <div v-if="categoryForecasts.length > 0" class="border-t border-border/40 pt-3 flex flex-col gap-2">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">{{ t({ id: 'Prediksi Pengeluaran per Kategori', en: 'Expense Forecast by Category', ja: 'カテゴリー別の予測支出', es: 'Predicción de Gastos por Categoría' }) }}</p>
              <div class="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                <div v-for="cf in categoryForecasts.slice(0, 3)" :key="cf.category" class="flex justify-between items-center text-xs font-semibold">
                  <span class="text-muted">{{ cf.category }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-text">{{ formatMoney(cf.predictedAmount) }}</span>
                    <span 
                      class="text-[10px] font-bold"
                      :class="cf.percentageChange > 0 ? 'text-danger' : cf.percentageChange < 0 ? 'text-success' : 'text-muted'"
                    >
                      ({{ cf.percentageChange > 0 ? '+' : '' }}{{ cf.percentageChange }}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
 
        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-text tracking-tight">{{ t({ id: 'Status Goal Tabungan', en: 'Savings Goal Status', ja: '貯蓄目標ステータス', es: 'Estado de la Meta de Ahorro' }) }}</h3>
            <span class="text-sm font-bold text-success">{{ savingsGoalProgress }}%</span>
          </div>
          <div class="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div class="h-full bg-linear-to-r from-primary to-success transition-all duration-500" :style="{ width: `${savingsGoalProgress}%` }"></div>
          </div>
          <p class="text-xs text-muted leading-relaxed font-medium">
            {{ t({ id: 'Total target', en: 'Total target', ja: '合計目標', es: 'Meta total' }) }} <strong class="text-text font-semibold">{{ formatMoney(savingsGoalTarget) }}</strong>
            {{ t({ id: 'dengan estimasi tercapai dalam', en: 'estimated to be reached in', ja: '達成見込み期間', es: 'estimado a alcanzarse en' }) }}
            <strong class="text-text font-semibold">{{ monthsToGoal === null ? t({ id: 'belum bisa dihitung', en: 'not calculable yet', ja: '計算不可', es: 'no calculable aún' }) : t({ id: `${monthsToGoal} bulan`, en: `${monthsToGoal} months`, ja: `${monthsToGoal}ヶ月`, es: `${monthsToGoal} meses` }) }}</strong>.
          </p>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Perbandingan Bulanan', en: 'Monthly Comparison', ja: '月次比較', es: 'Comparación Mensual' }) }}</h3>
          <ul class="flex flex-col gap-3 pr-1 text-sm">
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}:</span>
              <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
                {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.incomeChange) }}
              </strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}:</span>
              <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'" class="font-bold">
                {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.expenseChange) }}
              </strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium">
              <span>{{ t({ id: 'Arus Kas Bersih', en: 'Net Cashflow', ja: '純キャッシュフロー', es: 'Flujo de Caja Neto' }) }}:</span>
              <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
                {{ monthlyComparison.netChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.netChange) }}
              </strong>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <section v-if="budgetAlerts.length" class="bg-surface border-l-4 border-l-danger border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-3">
      <h2 class="text-base font-bold text-text tracking-tight">Budget Alert</h2>
      <div class="flex flex-wrap gap-2.5">
        <div v-for="item in budgetAlerts" :key="item.id" class="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl bg-surface-2 border text-xs" :class="item.level === 'danger' ? 'border-danger/30 text-danger-text' : 'border-amber-500/30 text-amber-600'">
          <strong class="font-bold uppercase tracking-wider">{{ item.category }}</strong>
          <span class="font-medium opacity-90">{{ item.message }}</span>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BalanceCandlestickChart v-if="appMode === 'advance'" :data="balanceCandlesticks" :title="t({ id: 'Volatilitas & Pergerakan Saldo (Candlestick)', en: 'Volatility & Balance Movement (Candlestick)', ja: 'ボラティリティと残高推移 (キャンドルスティック)', es: 'Volatilidad y Movimiento de Saldo (Velas)' })" class="md:col-span-2" />
      <FinanceChart type="doughnut" :title="t({ id: 'Pengeluaran per Kategori', en: 'Expense by Category', ja: 'カテゴリー別の支出', es: 'Gasto por Categoría' })" :data="expenseChartData" :options="doughnutChartOptions" />
      <FinanceChart v-if="appMode === 'advance' && currentMonthBudgetSummary.some(b => b.amount > 0)" type="bar" :title="t({ id: 'Anggaran vs Pengeluaran Aktual', en: 'Budget vs Actual Expenses', ja: '予算と実際の支出', es: 'Presupuesto vs Gastos Reales' })" :data="budgetVsExpenseChartData" :options="scaledChartOptions" />
      <FinanceChart type="bar" :title="t({ id: 'Tren 6 Bulan', en: '6-Month Trend', ja: '6ヶ月間のトレンド', es: 'Tendencia de 6 Meses' })" :data="monthlyChartData" :options="scaledChartOptions" />
      <FinanceChart v-if="appMode === 'advance'" type="line" :title="t({ id: 'Arus Kas Bersih per Bulan', en: 'Net Cashflow per Month', ja: '月間純キャッシュフロー', es: 'Flujo de Caja Neto por Mes' })" :data="cashflowChartData" :options="scaledChartOptions" />
      <FinanceChart v-if="appMode === 'advance'" type="bar" :title="t({ id: 'Kategori Paling Aktif', en: 'Most Active Categories', ja: '最もアクティブなカテゴリー', es: 'Categorías Más Activas' })" :data="categoryActivityChartData" :options="scaledChartOptions" />
    </section>

    <section v-if="selectedDrilldownCategory" class="bg-surface border border-primary rounded-2xl p-5 shadow-xl transition-all">
      <div class="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 class="text-base font-bold text-text tracking-tight">
          {{ t({ id: 'Detail Pengeluaran', en: 'Expense Details', ja: '支出の詳細', es: 'Detalles de Gastos' }) }}: <span class="text-primary font-extrabold">{{ selectedDrilldownCategory }}</span>
        </h3>
        <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="selectedDrilldownCategory = null">
          {{ t({ id: 'Tutup', en: 'Close', ja: '閉じる', es: 'Cerrar' }) }}
        </button>
      </div>
      <ul class="flex flex-col gap-3 pr-1">
        <li v-for="item in drilldownTransactions" :key="item.id" class="flex justify-between items-center gap-4 pb-3 border-b border-border last:border-0 last:pb-0">
          <div>
            <strong class="text-sm font-semibold text-text">{{ item.category }}</strong>
            <p class="text-xs text-muted font-medium mt-0.5">{{ item.note || t({ id: 'Tanpa catatan', en: 'No note', ja: 'メモなし', es: 'Sin nota' }) }} • {{ item.date }}</p>
          </div>
          <span class="text-sm font-bold text-danger">- {{ formatMoney(item.amount) }}</span>
        </li>
        <li v-if="!drilldownTransactions.length" class="text-center py-6 text-xs text-muted font-semibold">
          {{ t({ id: 'Tidak ada transaksi pengeluaran untuk kategori ini.', en: 'No expense transactions for this category.', ja: 'このカテゴリーの支出取引はありません。', es: 'No hay transacciones de gastos para esta categoría.' }) }}
        </li>
      </ul>
    </section>

    <section v-if="appMode === 'advance'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Analisis Perilaku User', en: 'User Behavior Analysis', ja: 'ユーザー行動分析', es: 'Análisis de Comportamiento del Usuario' }) }}</h3>
        <ul class="flex flex-col gap-2.5 text-xs text-muted font-medium list-disc pl-4">
          <li v-for="item in automatedInsights" :key="item" class="leading-relaxed">{{ item }}</li>
        </ul>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Analisis Kategori & Kewajiban', en: 'Category & Obligation Analysis', ja: 'カテゴリーと義務の分析', es: 'Análisis de Categorías y Obligaciones' }) }}</h3>
        <p v-if="healthiestCategory" class="text-sm text-muted leading-relaxed font-medium">
          {{ t({ id: 'Kategori paling dominan saat ini adalah', en: 'The most dominant category currently is', ja: '現在最も支配的なカテゴリーは', es: 'La categoría más dominante actualmente es' }) }} <strong class="text-text font-bold">{{ healthiestCategory.name }}</strong>
          {{ t({ id: 'dengan total akumulasi', en: 'with total accumulation of', ja: 'の累積合計は', es: 'con una acumulación total de' }) }} <strong class="text-text font-bold">{{ formatMoney(healthiestCategory.total) }}</strong>
          {{ t({ id: 'dari', en: 'from', ja: 'から', es: 'de' }) }} <strong class="text-text font-bold">{{ healthiestCategory.count }} {{ t({ id: 'transaksi', en: 'transactions', ja: '件の取引', es: 'transacciones' }) }}</strong>.
        </p>
        <div class="grid grid-cols-2 gap-4 mt-1 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wider text-muted">
          <div class="flex flex-col gap-1">
            <span>{{ t({ id: 'Utang Aktif', en: 'Active Debt', ja: 'アクティブな債務', es: 'Deuda Activa' }) }}</span>
            <strong class="text-sm font-bold text-danger mt-0.5">{{ formatMoney(totalDebt) }}</strong>
          </div>
          <div class="flex flex-col gap-1">
            <span>{{ t({ id: 'Piutang Aktif', en: 'Active Receivables', ja: 'アクティブな債権', es: 'Cuentas por Cobrar Activas' }) }}</span>
            <strong class="text-sm font-bold text-success mt-0.5">{{ formatMoney(totalReceivable) }}</strong>
          </div>
        </div>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h2 class="text-base font-bold text-text tracking-tight">{{ t({ id: 'Transaksi Terbaru', en: 'Recent Transactions', ja: '最近の取引', es: 'Transacciones Recientes' }) }}</h2>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold text-success bg-emerald-600/10 uppercase tracking-wider border border-emerald-600/10">
          {{ t({ id: 'Kategori Aktif', en: 'Active Categories', ja: '有効なカテゴリー', es: 'Categorías Activas' }) }}: {{ categories.length }}
        </span>
      </div>
      <ul class="flex flex-col gap-3 pr-1">
        <li v-for="item in latestTransactions" :key="item.id" class="flex justify-between items-center gap-4 pb-3 border-b border-border last:border-0 last:pb-0 hover:bg-surface-2/20 transition-all px-1 rounded-lg">
          <div>
            <strong class="text-sm font-bold text-text">{{ item.category }}</strong>
            <p class="text-xs text-muted font-semibold mt-0.5">{{ item.note || t({ id: 'Tanpa catatan', en: 'No note', ja: 'メモなし', es: 'Sin nota' }) }} • {{ item.date }}</p>
          </div>
          <span :class="item.type === 'income' ? 'text-success' : 'text-danger'" class="text-sm font-bold">
            {{ item.type === 'income' ? '+' : '-' }} {{ formatMoney(item.amount) }}
          </span>
        </li>
        <li v-if="!latestTransactions.length" class="text-center py-8 text-xs text-muted font-semibold">
          {{ t({ id: 'Belum ada transaksi terdaftar.', en: 'No transactions registered yet.', ja: '登録された取引はまだありません。', es: 'Aún no hay transacciones registradas.' }) }}
        </li>
      </ul>
    </section>
  </div>
</template>
