<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StatCard from '../components/StatCard.vue'
import FinanceChart from '../components/FinanceChart.vue'
import BalanceCandlestickChart from '../components/BalanceCandlestickChart.vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'
import { getThemeSettings } from '../composables/useTheme'

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
        <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">Dashboard</p>
        <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Analisis keuangan yang cerdas & terarah</h1>
        <p class="text-sm text-white/80 leading-relaxed mt-2">Ringkasan dilengkapi perbandingan bulanan, insight otomatis, budget alert, goal tabungan, dan status utang/piutang untuk mendukung keputusan finansial Anda.</p>
      </div>
      <div class="flex flex-wrap gap-2.5 shrink-0 z-10">
        <RouterLink to="/reports" class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-center">
          Export Laporan
        </RouterLink>
        <RouterLink to="/savings-goal" class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-sidebar-bg bg-white hover:bg-white/90 active:scale-95 transition-all text-center shadow-md">
          Kelola Goal
        </RouterLink>
      </div>
    </header>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Pemasukan" :value="`Rp ${incomeTotal.toLocaleString('id-ID')}`" tone="positive" />
      <StatCard label="Pengeluaran" :value="`Rp ${expenseTotal.toLocaleString('id-ID')}`" tone="negative" />
      <StatCard label="Saldo" :value="`Rp ${balance.toLocaleString('id-ID')}`" :tone="balance >= 0 ? 'positive' : 'negative'" />
      <StatCard label="Aset" :value="`Rp ${totalAssets.toLocaleString('id-ID')}`" tone="neutral" />
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <TransactionForm
        :categories="categories"
        @submit="addTransaction"
        @add-category="({ name, type }) => addCategory(name, type)"
      />

      <div class="flex flex-col gap-6">
        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-text tracking-tight">Insight Utama</h3>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-primary-soft uppercase tracking-wider">
              Transaksi: {{ transactionCount }}
            </span>
          </div>
          <ul class="flex flex-col gap-3 pr-1 text-sm">
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Rasio Tabungan:</span>
              <strong class="text-text font-bold">{{ savingsRate }}%</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Avg Uang Masuk/Tx:</span>
              <strong class="text-text font-bold">Rp {{ averageIncome.toLocaleString('id-ID') }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Avg Uang Keluar/Tx:</span>
              <strong class="text-text font-bold">Rp {{ averageExpense.toLocaleString('id-ID') }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Pengeluaran Terbesar:</span>
              <strong class="font-bold text-danger">{{ biggestExpense ? biggestExpense[0] : 'Belum ada' }}</strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium">
              <span>Pemasukan Terbesar:</span>
              <strong class="font-bold text-success">{{ topIncome ? topIncome[0] : 'Belum ada' }}</strong>
            </li>
          </ul>
        </section>

        <!-- Smart Forecast Card -->
        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-base font-bold text-text tracking-tight flex items-center gap-1.5">
              <span>🔮 Smart Forecast</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md text-[9px] font-bold bg-primary-soft text-primary uppercase tracking-wider">
              Prediksi AI
            </span>
          </div>

          <div v-if="!nextMonthForecast.hasEnoughData" class="text-xs text-muted leading-relaxed py-4 font-semibold text-center">
            ⚠️ Butuh minimal 2 bulan histori transaksi untuk melakukan estimasi prediksi pengeluaran bulan depan.
          </div>

          <div v-else class="flex flex-col gap-3.5">
            <!-- Prediksi Total -->
            <div>
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider">Prakiraan Pengeluaran Bulan Depan</p>
              <div class="flex items-baseline gap-2 mt-1">
                <strong class="text-xl font-extrabold text-text">
                  Rp {{ nextMonthForecast.predictedExpense.toLocaleString('id-ID') }}
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
                  ? 'Tren pengeluaran Anda cenderung naik. Disarankan untuk memangkas beberapa biaya non-esensial.' 
                  : nextMonthForecast.trendDirection === 'down'
                  ? 'Kabar baik! Tren pengeluaran bulanan Anda menunjukkan penurunan.'
                  : 'Tren pengeluaran Anda terpantau stabil.' }}
              </p>
            </div>

            <!-- Breakdown Kategori Teratas -->
            <div v-if="categoryForecasts.length > 0" class="border-t border-border/40 pt-3 flex flex-col gap-2">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Prediksi Pengeluaran per Kategori</p>
              <div class="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                <div v-for="cf in categoryForecasts.slice(0, 3)" :key="cf.category" class="flex justify-between items-center text-xs font-semibold">
                  <span class="text-muted">{{ cf.category }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-text">Rp {{ cf.predictedAmount.toLocaleString('id-ID') }}</span>
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
            <h3 class="text-base font-bold text-text tracking-tight">Status Goal Tabungan</h3>
            <span class="text-sm font-bold text-success">{{ savingsGoalProgress }}%</span>
          </div>
          <div class="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
            <div class="h-full bg-linear-to-r from-primary to-success transition-all duration-500" :style="{ width: `${savingsGoalProgress}%` }"></div>
          </div>
          <p class="text-xs text-muted leading-relaxed font-medium">
            Total target <strong class="text-text font-semibold">Rp {{ savingsGoalTarget.toLocaleString('id-ID') }}</strong>
            dengan estimasi tercapai dalam
            <strong class="text-text font-semibold">{{ monthsToGoal === null ? 'belum bisa dihitung' : `${monthsToGoal} bulan` }}</strong>.
          </p>
        </section>

        <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
          <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Perbandingan Bulanan</h3>
          <ul class="flex flex-col gap-3 pr-1 text-sm">
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Pemasukan:</span>
              <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
                {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}
              </strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium pb-2 border-b border-border/40">
              <span>Pengeluaran:</span>
              <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'" class="font-bold">
                {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}
              </strong>
            </li>
            <li class="flex justify-between items-center text-muted font-medium">
              <span>Arus Kas Bersih:</span>
              <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'" class="font-bold">
                {{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}
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
      <BalanceCandlestickChart :data="balanceCandlesticks" title="Volatilitas & Pergerakan Saldo (Candlestick)" class="md:col-span-2" />
      <FinanceChart type="doughnut" title="Pengeluaran per Kategori" :data="expenseChartData" :options="doughnutChartOptions" />
      <FinanceChart v-if="currentMonthBudgetSummary.some(b => b.amount > 0)" type="bar" title="Anggaran vs Pengeluaran Aktual" :data="budgetVsExpenseChartData" :options="scaledChartOptions" />
      <FinanceChart type="bar" title="Tren 6 Bulan" :data="monthlyChartData" :options="scaledChartOptions" />
      <FinanceChart type="line" title="Arus Kas Bersih per Bulan" :data="cashflowChartData" :options="scaledChartOptions" />
      <FinanceChart type="bar" title="Kategori Paling Aktif" :data="categoryActivityChartData" :options="scaledChartOptions" />
    </section>

    <section v-if="selectedDrilldownCategory" class="bg-surface border border-primary rounded-2xl p-5 shadow-xl transition-all">
      <div class="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 class="text-base font-bold text-text tracking-tight">
          Detail Pengeluaran: <span class="text-primary font-extrabold">{{ selectedDrilldownCategory }}</span>
        </h3>
        <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="selectedDrilldownCategory = null">
          Tutup
        </button>
      </div>
      <ul class="flex flex-col gap-3 pr-1">
        <li v-for="item in drilldownTransactions" :key="item.id" class="flex justify-between items-center gap-4 pb-3 border-b border-border last:border-0 last:pb-0">
          <div>
            <strong class="text-sm font-semibold text-text">{{ item.category }}</strong>
            <p class="text-xs text-muted font-medium mt-0.5">{{ item.note || 'Tanpa catatan' }} • {{ item.date }}</p>
          </div>
          <span class="text-sm font-bold text-danger">- Rp {{ item.amount.toLocaleString('id-ID') }}</span>
        </li>
        <li v-if="!drilldownTransactions.length" class="text-center py-6 text-xs text-muted font-semibold">
          Tidak ada transaksi pengeluaran untuk kategori ini.
        </li>
      </ul>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Analisis Perilaku User</h3>
        <ul class="flex flex-col gap-2.5 text-xs text-muted font-medium list-disc pl-4">
          <li v-for="item in automatedInsights" :key="item" class="leading-relaxed">{{ item }}</li>
        </ul>
      </article>

      <article class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h3 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Analisis Kategori & Kewajiban</h3>
        <p v-if="healthiestCategory" class="text-sm text-muted leading-relaxed font-medium">
          Kategori paling dominan saat ini adalah <strong class="text-text font-bold">{{ healthiestCategory.name }}</strong>
          dengan total akumulasi <strong class="text-text font-bold">Rp {{ healthiestCategory.total.toLocaleString('id-ID') }}</strong>
          dari <strong class="text-text font-bold">{{ healthiestCategory.count }} transaksi</strong>.
        </p>
        <div class="grid grid-cols-2 gap-4 mt-1 border-t border-border pt-4 text-xs font-semibold uppercase tracking-wider text-muted">
          <div class="flex flex-col gap-1">
            <span>Utang Aktif</span>
            <strong class="text-sm font-bold text-danger mt-0.5">Rp {{ totalDebt.toLocaleString('id-ID') }}</strong>
          </div>
          <div class="flex flex-col gap-1">
            <span>Piutang Aktif</span>
            <strong class="text-sm font-bold text-success mt-0.5">Rp {{ totalReceivable.toLocaleString('id-ID') }}</strong>
          </div>
        </div>
      </article>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h2 class="text-base font-bold text-text tracking-tight">Transaksi Terbaru</h2>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold text-success bg-emerald-600/10 uppercase tracking-wider border border-emerald-600/10">
          Kategori Aktif: {{ categories.length }}
        </span>
      </div>
      <ul class="flex flex-col gap-3 pr-1">
        <li v-for="item in latestTransactions" :key="item.id" class="flex justify-between items-center gap-4 pb-3 border-b border-border last:border-0 last:pb-0 hover:bg-surface-2/20 transition-all px-1 rounded-lg">
          <div>
            <strong class="text-sm font-bold text-text">{{ item.category }}</strong>
            <p class="text-xs text-muted font-semibold mt-0.5">{{ item.note || 'Tanpa catatan' }} • {{ item.date }}</p>
          </div>
          <span :class="item.type === 'income' ? 'text-success' : 'text-danger'" class="text-sm font-bold">
            {{ item.type === 'income' ? '+' : '-' }} Rp {{ item.amount.toLocaleString('id-ID') }}
          </span>
        </li>
        <li v-if="!latestTransactions.length" class="text-center py-8 text-xs text-muted font-semibold">
          Belum ada transaksi terdaftar.
        </li>
      </ul>
    </section>
  </div>
</template>
