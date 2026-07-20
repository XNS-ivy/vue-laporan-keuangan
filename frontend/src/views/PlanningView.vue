<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useFinance } from '../composables/useFinance'
import { getThemeSettings } from '../composables/useTheme'
import FinanceChart from '../components/FinanceChart.vue'
import { getDynamicStep, handleNominalKeydown, t, formatMoney, appMode } from '../composables/useUserSettings'

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
  const yearlyLabels: string[] = [t({ id: 'Tahun 0', en: 'Year 0', ja: '0年目', es: 'Año 0' })]

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthly
    totalDeposited += monthly

    if (m % 12 === 0) {
      const y = m / 12
      yearlyBalances.push(Math.round(balance))
      yearlyLabels.push(t({ id: `Tahun ${y}`, en: `Year ${y}`, ja: `${y}年目`, es: `Año ${y}` }))
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
          label: t({ id: 'Proyeksi Saldo', en: 'Balance Projection', ja: '残高予測', es: 'Proyección de Saldo' }),
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
  addBudget({ category: t({ id: 'Kebutuhan (50%)', en: 'Needs (50%)', ja: '必要経費 (50%)', es: 'Necesidades (50%)' }), amount: smartNeeds.value, month: month.value })
  addBudget({ category: t({ id: 'Keinginan (30%)', en: 'Wants (30%)', ja: '娯楽費 (30%)', es: 'Deseos (30%)' }), amount: smartWants.value, month: month.value })
  addBudget({ category: t({ id: 'Tabungan (20%)', en: 'Savings (20%)', ja: '貯蓄 (20%)', es: 'Ahorros (20%)' }), amount: smartSavings.value, month: month.value })
  smartIncome.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-xs text-muted font-bold">{{ t({ id: 'Planning', en: 'Planning', ja: 'プランニング', es: 'Planificación' }) }}</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">{{ t({ id: 'Atur Batas Belanja & Anggaran Bulananmu', en: 'Set Spending Limits & Monthly Budget', ja: '支出制限と月間予算を設定しましょう', es: 'Establezca límites de gasto y presupuesto mensual' }) }}</h1>
        <p class="text-xs text-muted leading-relaxed font-semibold">{{ t({ id: 'Anggaran belanja dilengkapi dengan peringatan otomatis dan perbandingan dari bulan ke bulan.', en: 'Shopping budgets are equipped with automatic alerts and month-to-month comparisons.', ja: '買い物予算には、自動アラートと前月比の比較機能が搭載されています。', es: 'Los presupuestos de compras están equipados con alertas automáticas y comparaciones mes a mes.' }) }}</p>
      </div>
      <input v-model="month" type="month" class="border border-border rounded-xl px-4 py-2 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all w-full sm:w-auto" />
    </header>

    <section v-if="budgetAlerts.length" class="bg-surface border-l-4 border-l-danger border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-3">
      <h2 class="text-base font-bold text-text tracking-tight">{{ t({ id: 'Alert Bulan Ini', en: 'Alerts This Month', ja: '今月のアラート', es: 'Alertas de Este Mes' }) }}</h2>
      <div class="flex flex-wrap gap-2.5">
        <div v-for="item in budgetAlerts" :key="item.id" class="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl bg-surface-2 border text-xs" :class="item.level === 'danger' ? 'border-danger/30 text-danger-text' : 'border-amber-500/30 text-amber-600'">
          <strong class="font-bold uppercase tracking-wider">{{ item.category }}</strong>
          <span class="font-medium opacity-90">{{ item.message }}</span>
        </div>
      </div>
    </section>

    <!-- Alokasi Anggaran Cerdas (50/30/20) -->
    <section v-if="appMode === 'advance'" class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Alokasi Anggaran Cerdas (50/30/20)', en: 'Smart Budget Allocation (50/30/20)', ja: 'スマート予算配分 (50/30/20)', es: 'Asignación Inteligente de Presupuesto (50/30/20)' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Masukkan estimasi pemasukan bulanan untuk melihat pembagian alokasi anggaran cerdas otomatis.', en: 'Enter estimated monthly income to see automatic smart budget allocations.', ja: '見積もり月収を入力すると、自動のスマート予算配分が表示されます。', es: 'Ingrese los ingresos mensuales estimados para ver las asignaciones de presupuesto inteligente automático.' }) }}</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-6 mt-1">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-3 text-xs">
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Estimasi Pemasukan', en: 'Estimated Income', ja: '見積もり収入', es: 'Ingreso Estimado' }) }}
            <input 
              v-model.number="smartIncome" 
              type="number" 
              min="0" 
              :step="getDynamicStep(smartIncome)"
              @keydown="handleNominalKeydown"
              placeholder="5000000" 
              class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" 
            />
          </label>
          <button class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="applySmartBudget">
            {{ t({ id: 'Terapkan Anggaran', en: 'Apply Budget', ja: '予算を適用', es: 'Aplicar Presupuesto' }) }}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-primary">
            <span>{{ t({ id: '50% Kebutuhan (Needs)', en: '50% Needs', ja: '50% 必要経費 (ニーズ)', es: '50% Necesidades' }) }}</span>
            <strong class="text-sm font-bold text-text mt-0.5">{{ formatMoney(smartNeeds) }}</strong>
            <span class="text-xs text-muted font-normal mt-1 leading-tight">{{ t({ id: 'Makanan, tagihan, transportasi wajib, dll.', en: 'Food, bills, mandatory transport, etc.', ja: '食費、光熱費、必須の交通費など。', es: 'Comida, facturas, transporte obligatorio, etc.' }) }}</span>
          </div>
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-amber-500">
            <span>{{ t({ id: '30% Keinginan (Wants)', en: '30% Wants', ja: '30% 娯楽費 (ウォンツ)', es: '30% Deseos' }) }}</span>
            <strong class="text-sm font-bold text-text mt-0.5">{{ formatMoney(smartWants) }}</strong>
            <span class="text-xs text-muted font-normal mt-1 leading-tight">{{ t({ id: 'Hiburan, belanja barang hobi, langganan, dll.', en: 'Entertainment, hobbies, subscriptions, etc.', ja: 'エンターテイメント、趣味、サブスクリプションなど。', es: 'Entretenimiento, pasatiempos, suscripciones, etc.' }) }}</span>
          </div>
          <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs border-l-4 border-l-success">
            <span>{{ t({ id: '20% Tabungan (Savings)', en: '20% Savings', ja: '20% 貯蓄 (セービング)', es: '20% Ahorros' }) }}</span>
            <strong class="text-sm font-bold text-text mt-0.5">{{ formatMoney(smartSavings) }}</strong>
            <span class="text-xs text-muted font-normal mt-1 leading-tight">{{ t({ id: 'Tabungan darurat, investasi, pelunasan utang, dll.', en: 'Emergency savings, investment, debt payoff, etc.', ja: '緊急時の貯蓄、投資、債務の返済など。', es: 'Ahorros de emergencia, inversión, pago de deudas, etc.' }) }}</span>
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Buat Anggaran', en: 'Create Budget', ja: '予算の作成', es: 'Crear Presupuesto' }) }}</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Kategori', en: 'Category', ja: 'カテゴリー', es: 'Categoría' }) }}
            <input v-model="form.category" list="expense-categories" :placeholder="t({ id: 'Contoh: Belanja', en: 'e.g., Shopping', ja: '例: ショッピング', es: 'ej. Compras' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
            <datalist id="expense-categories">
              <option v-for="item in expenseCategories" :key="item.id" :value="item.name"></option>
            </datalist>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nominal Limit', en: 'Limit Amount', ja: '制限金額', es: 'Monto Límite' }) }}
            <input 
              v-model="form.amount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(form.amount)"
              @keydown="handleNominalKeydown"
              placeholder="500000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Bulan Target', en: 'Target Month', ja: '対象月', es: 'Mes Objetivo' }) }}
            <input v-model="form.month" type="month" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" @click="submitBudget">
          {{ t({ id: 'Simpan Anggaran', en: 'Save Budget', ja: '予算を保存', es: 'Guardar Presupuesto' }) }}
        </button>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span v-for="item in expenseCategories" :key="item.id" class="px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-soft">
            {{ item.name }}
          </span>
        </div>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Ringkasan Anggaran', en: 'Budget Summary', ja: '予算の概要', es: 'Resumen del Presupuesto' }) }}</h2>
        <div class="flex flex-col gap-4 pr-1">
          <div v-for="item in budgetItems" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.category }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ t({ id: 'Target', en: 'Target', ja: '目標', es: 'Meta' }) }} {{ formatMoney(item.amount) }} • {{ t({ id: 'Terpakai', en: 'Used', ja: '使用済み', es: 'Usado' }) }} {{ formatMoney(item.used) }}</p>
            </div>
            <div class="flex flex-col gap-2 min-w-37.5 shrink-0 items-end">
              <div class="flex items-center gap-2">
                <span :class="item.remaining >= 0 ? 'text-success' : 'text-danger'" class="text-xs font-bold">
                  {{ t({ id: 'Sisa', en: 'Remaining', ja: '残り', es: 'Restante' }) }} {{ formatMoney(item.remaining) }}
                </span>
                <button class="text-xs text-danger-text hover:text-danger hover:scale-105 active:scale-95 transition-all cursor-pointer border-none bg-transparent" @click="deleteBudget(item.id)">{{ t({ id: 'Hapus', en: 'Delete', ja: '削除', es: 'Eliminar' }) }}</button>
              </div>
              <div class="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div class="h-full bg-linear-to-r from-primary to-success transition-all duration-300" :style="{ width: `${item.progress}%` }"></div>
              </div>
            </div>
          </div>
          <p v-if="!budgetItems.length" class="text-center py-8 text-xs text-muted font-semibold">{{ t({ id: 'Belum ada anggaran bulanan.', en: 'No monthly budgets yet.', ja: '月間予算はまだありません。', es: 'Aún no hay presupuestos mensuales.' }) }}</p>
        </div>
      </section>
    </div>

    <!-- Perbandingan Bulan Berjalan -->
    <section v-if="appMode === 'advance'" class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Perbandingan Bulan Berjalan', en: 'Current Month Comparison', ja: '当月比較', es: 'Comparación del Mes Actual' }) }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold uppercase tracking-wider text-muted">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}</span>
          <strong :class="monthlyComparison.incomeChange >= 0 ? 'text-success' : 'text-danger'" class="text-base font-bold mt-1">
            {{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.incomeChange) }}
          </strong>
        </div>
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}</span>
          <strong :class="monthlyComparison.expenseChange >= 0 ? 'text-danger' : 'text-success'" class="text-base font-bold mt-1">
            {{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.expenseChange) }}
          </strong>
        </div>
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
          <span>{{ t({ id: 'Net', en: 'Net', ja: '純額', es: 'Neto' }) }}</span>
          <strong :class="monthlyComparison.netChange >= 0 ? 'text-success' : 'text-danger'" class="text-base font-bold mt-1">
            {{ monthlyComparison.netChange >= 0 ? '+' : '' }}{{ formatMoney(monthlyComparison.netChange) }}
          </strong>
        </div>
      </div>
      <p class="text-xs text-muted font-medium mt-1">{{ t({ id: 'Budget aktif bulan ini', en: 'Active budget this month', ja: '今月のアクティブ予算', es: 'Presupuesto activo este mes' }) }}: <strong class="text-text font-bold">{{ currentMonthBudgetSummary.length }} {{ t({ id: 'kategori', en: 'categories', ja: 'カテゴリー', es: 'categorías' }) }}</strong>.</p>
    </section>

    <!-- Simulator Finansial -->
    <section v-if="appMode === 'advance'" class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Simulator Bunga Majemuk', en: 'Compound Interest Simulator', ja: '複利シミュレーター', es: 'Simulador de Interés Compuesto' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Simulasikan pertumbuhan tabungan atau investasi majemuk dari waktu ke waktu berdasarkan tingkat bunga majemuk.', en: 'Simulate the growth of compound savings or investments over time based on the compound interest rate.', ja: '複利利率に基づいて、時間の経過とともに複利貯蓄または投資の成長をシミュレートします。', es: 'Simule el crecimiento de los ahorros o inversiones compuestos a lo largo del tiempo en función de la tasa de interés compuesta.' }) }}</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[17.5rem_1fr] gap-6 mt-1">
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-3.5 text-xs">
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Setoran Awal', en: 'Initial Deposit', ja: '初期積立', es: 'Depósito Inicial' }) }}
            <input 
              v-model.number="simInitial" 
              type="number" 
              min="0" 
              :step="getDynamicStep(simInitial)"
              @keydown="handleNominalKeydown"
              placeholder="1000000" 
              class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" 
            />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Setoran Bulanan', en: 'Monthly Deposit', ja: '毎月の積立', es: 'Depósito Mensual' }) }}
            <input 
              v-model.number="simMonthly" 
              type="number" 
              min="0" 
              :step="getDynamicStep(simMonthly)"
              @keydown="handleNominalKeydown"
              placeholder="500000" 
              class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" 
            />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Durasi Waktu (Tahun)', en: 'Duration (Years)', ja: '期間 (年)', es: 'Duración (Años)' }) }}
            <input v-model.number="simYears" type="number" min="1" max="50" placeholder="10" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Suku Bunga Tahunan (%)', en: 'Annual Interest Rate (%)', ja: '年利率 (%)', es: 'Tasa de Interés Anual (%)' }) }}
            <input v-model.number="simRate" type="number" min="0" max="100" placeholder="6" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
          </label>
          <button class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm mt-1" type="button" @click="calculateSimulation">
            {{ t({ id: 'Mulai Simulasi', en: 'Start Simulation', ja: 'シミュレーション開始', es: 'Iniciar Simulación' }) }}
          </button>
        </div>
        
        <div v-if="simResults" class="flex flex-col gap-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>{{ t({ id: 'Total Dana Pokok', en: 'Total Principal', ja: '元金合計', es: 'Principal Total' }) }}</span>
              <strong class="text-sm font-bold text-text mt-0.5">{{ formatMoney(simResults.totalPrincipal) }}</strong>
            </div>
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>{{ t({ id: 'Bunga Akumulasi', en: 'Accumulated Interest', ja: '累積金利', es: 'Interés Acumulado' }) }}</span>
              <strong class="text-sm font-bold text-success mt-0.5">{{ formatMoney(simResults.totalInterest) }}</strong>
            </div>
            <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-1 shadow-xs">
              <span>{{ t({ id: 'Estimasi Akhir', en: 'Estimated End Balance', ja: '最終推定残高', es: 'Saldo Final Estimado' }) }}</span>
              <strong class="text-sm font-bold text-primary mt-0.5">{{ formatMoney(simResults.totalEndBalance) }}</strong>
            </div>
          </div>
          
          <div class="border border-border rounded-2xl overflow-hidden bg-surface shadow-xs">
            <FinanceChart type="line" :title="t({ id: 'Proyeksi Pertumbuhan Saldo', en: 'Balance Growth Projection', ja: '残高成長予測', es: 'Proyección de Crecimiento de Saldo' })" :data="simResults.chartData" :options="simChartOptions" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
