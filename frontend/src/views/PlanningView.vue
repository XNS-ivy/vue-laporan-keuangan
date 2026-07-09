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

const gridColor = computed(() => isDark.value ? '#334155' : '#e2e8f0')
const textColor = computed(() => isDark.value ? '#94a3b8' : '#64748b')
const tooltipBgColor = computed(() => isDark.value ? '#111827' : '#ffffff')
const tooltipBorderColor = computed(() => isDark.value ? '#334155' : '#e2e8f0')
const tooltipTextColor = computed(() => isDark.value ? '#f8fafc' : '#0f172a')

const simChartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: textColor.value,
        font: { family: 'Segoe UI, system-ui, sans-serif', size: 12 }
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
      ticks: { color: textColor.value, font: { family: 'Segoe UI, system-ui, sans-serif' } }
    },
    y: {
      grid: { color: gridColor.value, drawTicks: false },
      ticks: { color: textColor.value, font: { family: 'Segoe UI, system-ui, sans-serif' } }
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
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.3,
        }
      ]
    }
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Planning</p>
        <h1>Atur batas pengeluaran bulanan</h1>
        <p class="subtle">Budget sekarang dilengkapi alert otomatis dan konteks perbandingan bulan ke bulan.</p>
      </div>
      <input v-model="month" type="month" />
    </header>

    <section v-if="budgetAlerts.length" class="card alert-card">
      <h2>Alert Bulan Ini</h2>
      <div class="alert-list">
        <div v-for="item in budgetAlerts" :key="item.id" class="alert-item" :class="item.level">
          <strong>{{ item.category }}</strong>
          <span>{{ item.message }}</span>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <section class="card">
        <h2>Buat Anggaran</h2>
        <div class="form-grid">
          <label>
            Kategori
            <input v-model="form.category" list="expense-categories" placeholder="Contoh: Belanja" />
            <datalist id="expense-categories">
              <option v-for="item in expenseCategories" :key="item.id" :value="item.name"></option>
            </datalist>
          </label>
          <label>
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="500000" />
          </label>
          <label>
            Bulan
            <input v-model="form.month" type="month" />
          </label>
        </div>
        <button class="primary-btn" @click="submitBudget">Simpan Anggaran</button>
        <div class="chip-list">
          <span v-for="item in expenseCategories" :key="item.id" class="chip">{{ item.name }}</span>
        </div>
      </section>

      <section class="card">
        <h2>Ringkasan Anggaran</h2>
        <div v-for="item in budgetItems" :key="item.id" class="budget-item">
          <div>
            <strong>{{ item.category }}</strong>
            <p>Target {{ item.amount.toLocaleString('id-ID') }} • Terpakai {{ item.used.toLocaleString('id-ID') }}</p>
          </div>
          <div class="right">
            <span :class="item.remaining >= 0 ? 'good' : 'warn'">Sisa {{ item.remaining.toLocaleString('id-ID') }}</span>
            <div class="bar"><span :style="{ width: `${item.progress}%` }"></span></div>
            <button class="ghost-btn" @click="deleteBudget(item.id)">Hapus</button>
          </div>
        </div>
      </section>
    </div>

    <section class="card">
      <h2>Perbandingan Bulan Berjalan</h2>
      <div class="comparison-grid">
        <div class="comparison-item">
          <span>Pemasukan</span>
          <strong>{{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}</strong>
        </div>
        <div class="comparison-item">
          <span>Pengeluaran</span>
          <strong>{{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}</strong>
        </div>
        <div class="comparison-item">
          <span>Net</span>
          <strong>{{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}</strong>
        </div>
      </div>
      <p class="subtle">Budget aktif bulan ini: {{ currentMonthBudgetSummary.length }} kategori.</p>
    </section>

    <!-- Simulator Finansial -->
    <section class="card simulator-card">
      <h2>Simulasi Pertumbuhan Keuangan (Compound Interest)</h2>
      <p class="subtle">Rencanakan masa depan Anda dengan melihat proyeksi pertumbuhan tabungan atau investasi majemuk dari waktu ke waktu.</p>
      
      <div class="simulator-layout">
        <div class="simulator-form">
          <label>
            <span>Setoran Awal (Rp)</span>
            <input v-model.number="simInitial" type="number" min="0" placeholder="1000000" />
          </label>
          <label>
            <span>Setoran Bulanan (Rp)</span>
            <input v-model.number="simMonthly" type="number" min="0" placeholder="500000" />
          </label>
          <label>
            <span>Durasi Waktu (Tahun)</span>
            <input v-model.number="simYears" type="number" min="1" max="50" placeholder="10" />
          </label>
          <label>
            <span>Suku Bunga Tahunan (%)</span>
            <input v-model.number="simRate" type="number" min="0" max="100" placeholder="6" />
          </label>
          <button class="primary-btn" type="button" @click="calculateSimulation">Mulai Simulasi</button>
        </div>
        
        <div v-if="simResults" class="simulator-results">
          <div class="results-summary">
            <div class="result-tile">
              <span>Total Dana Pokok</span>
              <strong>Rp {{ simResults.totalPrincipal.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="result-tile">
              <span>Total Bunga Akumulasi</span>
              <strong class="good">Rp {{ simResults.totalInterest.toLocaleString('id-ID') }}</strong>
            </div>
            <div class="result-tile">
              <span>Hasil Akhir Estimasi</span>
              <strong class="primary-text">Rp {{ simResults.totalEndBalance.toLocaleString('id-ID') }}</strong>
            </div>
          </div>
          
          <div class="simulator-chart-wrapper">
            <FinanceChart type="line" title="Proyeksi Pertumbuhan Saldo" :data="simResults.chartData" :options="simChartOptions" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: var(--muted); }
.subtle { color: var(--muted); }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow); }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.8rem; }
label { display: flex; flex-direction: column; gap: 0.35rem; color: var(--text); }
.chip-list { display: flex; flex-wrap: wrap; gap: 0.55rem; margin-top: 0.8rem; }
.chip { border-radius: 999px; padding: 0.4rem 0.7rem; font-size: 0.85rem; }
.budget-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid var(--border); }
.right { display: flex; flex-direction: column; gap: 0.4rem; min-width: 140px; }
.bar { width: 100%; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success)); }
.good { color: var(--success); font-weight: 600; }
.warn { color: var(--danger); font-weight: 600; }
.alert-card { border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); }
.alert-list { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.alert-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.8rem 0.9rem; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.alert-item.warning { border-color: #f59e0b; }
.alert-item.danger { border-color: var(--danger); }
.comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; }
.comparison-item { border: 1px solid var(--border); border-radius: 14px; padding: 0.85rem; background: var(--surface-2); display: flex; flex-direction: column; gap: 0.35rem; }

/* Simulator styling */
.simulator-card { margin-top: 1rem; }
.simulator-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.5rem; margin-top: 1rem; align-items: start; }
.simulator-form { display: flex; flex-direction: column; gap: 0.85rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; }
.simulator-form label span { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.25rem; }
.simulator-results { display: flex; flex-direction: column; gap: 1.2rem; }
.results-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; }
.result-tile { border: 1px solid var(--border); border-radius: 14px; padding: 0.9rem; background: var(--surface-2); display: flex; flex-direction: column; gap: 0.35rem; }
.result-tile span { font-size: 0.85rem; color: var(--muted); }
.result-tile strong { font-size: 1.15rem; }
.primary-text { color: var(--primary); }
.simulator-chart-wrapper { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }

@media (max-width: 900px) { 
  .content-grid { grid-template-columns: 1fr; } 
  .page-header { flex-direction: column; align-items: flex-start; } 
  .form-grid { grid-template-columns: 1fr; } 
  .budget-item { flex-direction: column; align-items: flex-start; } 
  .simulator-layout { grid-template-columns: 1fr; }
}
</style>
