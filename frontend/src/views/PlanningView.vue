<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useFinance } from '../composables/useFinance'
import { getThemeSettings } from '../composables/useTheme'
import FinanceChart from '../components/FinanceChart.vue'

const {
  addBudget,
  budgetAlerts,
  categories,
  currentMonthBudgetSummary,
  deleteBudget,
  getBudgetSummary,
  monthlyComparison,
} = useFinance()

const month = ref(new Date().toISOString().slice(0, 7))
const budgetItems = computed(() => getBudgetSummary(month.value))
const expenseCategories = computed(() => categories.value.filter((item) => item.type === 'expense'))
const form = ref({ category: '', amount: '', month: month.value })

const submitBudget = () => {
  addBudget({ category: form.value.category, amount: Number(form.value.amount), month: form.value.month })
  form.value = { category: '', amount: '', month: month.value }
}

// Financial Simulator State
const simInitial = ref<number | ''>('')
const simMonthly = ref<number | ''>('')
const simYears = ref<number | ''>('')
const simRate = ref<number | ''>('')

const simResults = ref<{
  totalPrincipal: number
  totalInterest: number
  totalEndBalance: number
  chartData: any
} | null>(null)

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

const simChartOptions = computed(() => ({
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
      grid: { color: gridColor.value, drawTicks: false },
      ticks: { color: textColor.value, font: { family: 'Inter, system-ui, sans-serif', size: 10 } }
    },
    y: {
      grid: { color: gridColor.value, drawTicks: false },
      ticks: { color: textColor.value, font: { family: 'Inter, system-ui, sans-serif', size: 10 } }
    }
  }
}))

const calculateSimulation = () => {
  const initial = Number(simInitial.value) || 0
  const monthly = Number(simMonthly.value) || 0
  const years = Number(simYears.value) || 0
  const annualRate = (Number(simRate.value) || 0) / 100

  if (years <= 0) return

  const months = years * 12
  const monthlyRate = annualRate / 12

  let balance = initial
  let totalDeposited = initial

  const yearlyBalances: number[] = [initial]
  const yearlyLabels: string[] = ['Tahun 0']

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthly
    totalDeposited += monthly

    if (m % 12 === 0) {
      const y = m / 12
      yearlyBalances.push(Math.round(balance))
      yearlyLabels.push(`Tahun ${y}`)
    }
  }

  const totalEndBalance = Math.round(balance)
  const totalInterest = Math.max(0, totalEndBalance - totalDeposited)

  simResults.value = {
    totalPrincipal: totalDeposited,
    totalInterest,
    totalEndBalance,
    chartData: {
      labels: yearlyLabels,
      datasets: [
        {
          label: 'Proyeksi Saldo (Rp)',
          data: yearlyBalances,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.3,
        }
      ]
    }
  }
}

// 50/30/20 Smart Budgeting State
const smartIncome = ref<number | ''>('')
const smartNeeds = computed(() => smartIncome.value ? Math.round(Number(smartIncome.value) * 0.5) : 0)
const smartWants = computed(() => smartIncome.value ? Math.round(Number(smartIncome.value) * 0.3) : 0)
const smartSavings = computed(() => smartIncome.value ? Math.round(Number(smartIncome.value) * 0.2) : 0)

const applySmartBudget = () => {
  if (!smartIncome.value || smartIncome.value <= 0) return
  addBudget({ category: 'Kebutuhan (50%)', amount: smartNeeds.value, month: month.value })
  addBudget({ category: 'Keinginan (30%)', amount: smartWants.value, month: month.value })
  addBudget({ category: 'Tabungan (20%)', amount: smartSavings.value, month: month.value })
  smartIncome.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Planning</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Atur Batas Belanja & Anggaran Bulananmu</h1>
        <p class="text-xs text-muted leading-relaxed font-semibold">Anggaran belanja dilengkapi dengan peringatan otomatis dan perbandingan dari bulan ke bulan.</p>
      </div>
      <input v-model="month" type="month" class="border border-border rounded-xl px-4 py-2 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all w-full sm:w-auto" />
    </header>

    <section v-if="budgetAlerts.length" class="bg-surface border-l-4 border-l-danger border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-3">
      <h2 class="text-base font-bold text-text tracking-tight">Alert Bulan Ini</h2>
      <div class="flex flex-wrap gap-2.5">
        <div v-for="item in budgetAlerts" :key="item.id" class="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl bg-surface-2 border text-xs" :class="item.level === 'danger' ? 'border-danger/30 text-danger-text' : 'border-amber-500/30 text-amber-600'">
          <strong class="font-bold uppercase tracking-wider">{{ item.category }}</strong>
          <span class="font-medium opacity-90">{{ item.message }}</span>
        </div>
      </div>
    </section>

    <!-- Alokasi Anggaran Cerdas (50/30/20) -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Alokasi Anggaran Cerdas (50/30/20)</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Masukkan estimasi pemasukan bulanan untuk melihat pembagian alokasi anggaran cerdas otomatis.</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 mt-1">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-3 text-xs">
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            Estimasi Pemasukan (Rp)
            <input v-model.number="smartIncome" type="number" min="0" placeholder="5000000" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="applySmartBudget">
            Terapkan Anggaran
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-primary">
            <span>50% Kebutuhan (Needs)</span>
            <strong class="text-sm font-bold text-text mt-0.5">Rp {{ smartNeeds.toLocaleString('id-ID') }}</strong>
            <span class="text-[10px] text-muted font-normal mt-1 leading-tight">Makanan, tagihan, transportasi wajib, dll.</span>
          </div>
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-amber-500">
            <span>30% Keinginan (Wants)</span>
            <strong class="text-sm font-bold text-text mt-0.5">Rp {{ smartWants.toLocaleString('id-ID') }}</strong>
            <span class="text-[10px] text-muted font-normal mt-1 leading-tight">Hiburan, belanja barang hobi, langganan, dll.</span>
          </div>
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-success">
            <span>20% Tabungan (Savings)</span>
            <strong class="text-sm font-bold text-text mt-0.5">Rp {{ smartSavings.toLocaleString('id-ID') }}</strong>
            <span class="text-[10px] text-muted font-normal mt-1 leading-tight">Tabungan darurat, investasi, pelunasan utang, dll.</span>
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Buat Anggaran</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Kategori
            <input v-model="form.category" list="expense-categories" placeholder="Contoh: Belanja" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
            <datalist id="expense-categories">
              <option v-for="item in expenseCategories" :key="item.id" :value="item.name"></option>
            </datalist>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal Limit (Rp)
            <input v-model="form.amount" type="number" min="0" placeholder="500000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Bulan Target
            <input v-model="form.month" type="month" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" @click="submitBudget">
          Simpan Anggaran
        </button>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span v-for="item in expenseCategories" :key="item.id" class="px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-soft">
            {{ item.name }}
          </span>
        </div>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Ringkasan Anggaran</h2>
        <div class="flex flex-col gap-4 pr-1">
          <div v-for="item in budgetItems" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.category }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">Target Rp {{ item.amount.toLocaleString('id-ID') }} • Terpakai Rp {{ item.used.toLocaleString('id-ID') }}</p>
            </div>
            <div class="flex flex-col gap-2 min-w-37.5 shrink-0 items-end">
              <div class="flex items-center gap-2">
                <span :class="item.remaining >= 0 ? 'text-success' : 'text-danger'" class="text-xs font-bold">
                  Sisa Rp {{ item.remaining.toLocaleString('id-ID') }}
                </span>
                <button class="text-xs text-danger-text hover:text-danger hover:scale-105 active:scale-95 transition-all cursor-pointer border-none bg-transparent" @click="deleteBudget(item.id)">Hapus</button>
              </div>
              <div class="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div class="h-full bg-linear-to-r from-primary to-success transition-all duration-300" :style="{ width: `${item.progress}%` }"></div>
              </div>
            </div>
          </div>
          <p v-if="!budgetItems.length" class="text-center py-8 text-xs text-muted font-semibold">Belum ada anggaran bulanan.</p>
        </div>
      </section>
    </div>

    <!-- Perbandingan Bulan Berjalan -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Perbandingan Bulan Berjalan</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold uppercase tracking-wider text-muted">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>Pemasukan</span>
          <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'" class="text-base font-bold mt-1">
            {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}
          </strong>
        </div>
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>Pengeluaran</span>
          <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'" class="text-base font-bold mt-1">
            {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}
          </strong>
        </div>
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>Net</span>
          <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'" class="text-base font-bold mt-1">
            {{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}
          </strong>
        </div>
      </div>
      <p class="text-xs text-muted font-medium mt-1">Budget aktif bulan ini: <strong class="text-text font-bold">{{ currentMonthBudgetSummary.length }} kategori</strong>.</p>
    </section>

    <!-- Simulator Finansial -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Compound Interest Simulator</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Simulasikan pertumbuhan tabungan atau investasi majemuk dari waktu ke waktu berdasarkan tingkat bunga majemuk.</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-1">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-3.5 text-xs">
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            Setoran Awal (Rp)
            <input v-model.number="simInitial" type="number" min="0" placeholder="1000000" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            Setoran Bulanan (Rp)
            <input v-model.number="simMonthly" type="number" min="0" placeholder="500000" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            Durasi Waktu (Tahun)
            <input v-model.number="simYears" type="number" min="1" max="50" placeholder="10" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            Suku Bunga Tahunan (%)
            <input v-model.number="simRate" type="number" min="0" max="100" placeholder="6" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm mt-1" type="button" @click="calculateSimulation">
            Mulai Simulasi
          </button>
        </div>
        
        <div v-if="simResults" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>Total Dana Pokok</span>
              <strong class="text-sm font-bold text-text mt-0.5">Rp {{ simResults.totalPrincipal.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>Bunga Akumulasi</span>
              <strong class="text-sm font-bold text-success mt-0.5">Rp {{ simResults.totalInterest.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>Estimasi Akhir</span>
              <strong class="text-sm font-bold text-primary mt-0.5">Rp {{ simResults.totalEndBalance.toLocaleString('id-ID') }}</strong>
            </div>
          </div>
          
          <div class="border border-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <FinanceChart type="line" title="Proyeksi Pertumbuhan Saldo" :data="simResults.chartData" :options="simChartOptions" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
