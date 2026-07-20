<script setup lang="ts">
import { ref, computed } from 'vue'
import { t, formatMoney, getDynamicStep, handleNominalKeydown } from '../composables/useUserSettings'
import { useFinance } from '../composables/useFinance'

const { balance, expenseTotal } = useFinance()

// Active Tool Tab
const activeTab = ref<'calc' | 'zakat' | 'tax' | 'emergency' | 'compound' | 'split' | 'dti'>('calc')

// 1. SMART EXPRESSION CALCULATOR
const calcDisplay = ref('0')
const calcHistory = ref<string[]>([])

const appendCalc = (val: string) => {
  if (calcDisplay.value === '0' && val !== '.') {
    calcDisplay.value = val
  } else {
    calcDisplay.value += val
  }
}
const clearCalc = () => {
  calcDisplay.value = '0'
}
const backspaceCalc = () => {
  if (calcDisplay.value.length <= 1) {
    calcDisplay.value = '0'
  } else {
    calcDisplay.value = calcDisplay.value.slice(0, -1)
  }
}
const evaluateCalc = () => {
  try {
    const sanitized = calcDisplay.value.replace(/×/g, '*').replace(/÷/g, '/')
    const res = Function(`"use strict"; return (${sanitized})`)()
    const entry = `${calcDisplay.value} = ${Number(res).toLocaleString('id-ID')}`
    calcHistory.value.unshift(entry)
    if (calcHistory.value.length > 5) calcHistory.value.pop()
    calcDisplay.value = String(res)
  } catch (e) {
    calcDisplay.value = 'Error'
  }
}
const addQuickAmount = (amount: number) => {
  const current = parseFloat(calcDisplay.value) || 0
  calcDisplay.value = String(current + amount)
}

// 2. ZAKAT CALCULATOR
const goldPricePerGram = ref<number | ''>('')
const totalAssetsForZakat = ref<number | ''>('')
const monthlyIncomeForZakat = ref<number | ''>('')

const nisabGoldGrams = 85
const nisabGoldValue = computed(() => (Number(goldPricePerGram.value) || 0) * nisabGoldGrams)
const isZakatMaalWajib = computed(() => (Number(totalAssetsForZakat.value) || 0) >= nisabGoldValue.value && nisabGoldValue.value > 0)
const zakatMaalAmount = computed(() => isZakatMaalWajib.value ? (Number(totalAssetsForZakat.value) || 0) * 0.025 : 0)

const nisabMonthlyIncome = computed(() => nisabGoldValue.value / 12)
const isZakatProfesiWajib = computed(() => (Number(monthlyIncomeForZakat.value) || 0) >= nisabMonthlyIncome.value && nisabMonthlyIncome.value > 0)
const zakatProfesiAmount = computed(() => isZakatProfesiWajib.value ? (Number(monthlyIncomeForZakat.value) || 0) * 0.025 : 0)

// 3. PPH 21 TAX ESTIMATOR
const monthlyGrossSalary = ref<number | ''>('')
const maritalStatus = ref<'TK/0' | 'K/0' | 'K/1' | 'K/2' | 'K/3'>('TK/0')

const ptkpValues: Record<string, number> = {
  'TK/0': 54000000,
  'K/0': 58500000,
  'K/1': 63000000,
  'K/2': 67500000,
  'K/3': 72000000,
}

const annualGrossSalary = computed(() => (Number(monthlyGrossSalary.value) || 0) * 12)
const occupationCost = computed(() => Math.min(annualGrossSalary.value * 0.05, 6000000))
const netAnnualIncome = computed(() => Math.max(0, annualGrossSalary.value - occupationCost.value))
const taxableIncome = computed(() => Math.max(0, netAnnualIncome.value - (ptkpValues[maritalStatus.value] || 54000000)))

const estimatedAnnualTax = computed(() => {
  let pkp = taxableIncome.value
  if (pkp <= 0) return 0

  let tax = 0
  if (pkp > 0) {
    const tier1 = Math.min(pkp, 60000000)
    tax += tier1 * 0.05
    pkp -= tier1
  }
  if (pkp > 0) {
    const tier2 = Math.min(pkp, 190000000)
    tax += tier2 * 0.15
    pkp -= tier2
  }
  if (pkp > 0) {
    const tier3 = Math.min(pkp, 250000000)
    tax += tier3 * 0.25
    pkp -= tier3
  }
  if (pkp > 0) {
    tax += pkp * 0.30
  }
  return tax
})
const estimatedMonthlyTax = computed(() => estimatedAnnualTax.value / 12)

// 4. EMERGENCY FUND CALCULATOR
const manualLivingCost = ref<number | ''>('')
const familyStatus = ref<'single' | 'married' | 'family'>('single')

const emergencyMultiplier = computed(() => {
  if (familyStatus.value === 'single') return 3
  if (familyStatus.value === 'married') return 6
  return 12
})
const targetEmergencyFund = computed(() => (Number(manualLivingCost.value) || 0) * emergencyMultiplier.value)

// 5. COMPOUND INTEREST & INVESTMENT GROWTH
const initialInvestment = ref<number | ''>('')
const monthlyContribution = ref<number | ''>('')
const investmentYears = ref<number | ''>('')
const expectedReturnRate = ref<number | ''>('')

const compoundResults = computed(() => {
  const init = Number(initialInvestment.value) || 0
  const monthly = Number(monthlyContribution.value) || 0
  const years = Number(investmentYears.value) || 0
  const returnRate = Number(expectedReturnRate.value) || 0

  if (years <= 0) return { totalBalance: init, totalDeposited: init, interestEarned: 0 }

  const r = returnRate / 100 / 12
  const n = years * 12
  
  let totalBalance = init
  let totalDeposited = init

  for (let i = 1; i <= n; i++) {
    totalBalance = (totalBalance + monthly) * (1 + r)
    totalDeposited += monthly
  }

  const interestEarned = Math.max(0, totalBalance - totalDeposited)
  return {
    totalBalance,
    totalDeposited,
    interestEarned
  }
})

// 6. BILL SPLITTER & TIP CALCULATOR
const billAmount = ref<number | ''>('')
const numberOfPeople = ref<number | ''>('')
const tipPercentage = ref<number | ''>('')
const taxPercentage = ref<number | ''>('')

const totalBillWithTaxTip = computed(() => {
  const bill = Number(billAmount.value) || 0
  const tax = bill * ((Number(taxPercentage.value) || 0) / 100)
  const tip = bill * ((Number(tipPercentage.value) || 0) / 100)
  return bill + tax + tip
})
const perPersonAmount = computed(() => {
  const ppl = Number(numberOfPeople.value) || 0
  if (ppl <= 0) return 0
  return totalBillWithTaxTip.value / ppl
})

// 7. DEBT-TO-INCOME (DTI) RATIO CHECKER
const dtiIncome = ref<number | ''>('')
const dtiDebts = ref<number | ''>('')

const dtiRatio = computed(() => {
  const inc = Number(dtiIncome.value) || 0
  const dbt = Number(dtiDebts.value) || 0
  if (inc <= 0) return 0
  return (dbt / inc) * 100
})
const dtiStatus = computed(() => {
  const ratio = dtiRatio.value
  if (ratio <= 20) return { label: 'Sangat Sehat', color: 'text-success', bg: 'bg-emerald-600/10' }
  if (ratio <= 35) return { label: 'Sehat / Wajar', color: 'text-primary', bg: 'bg-primary-soft' }
  if (ratio <= 50) return { label: 'Waspada (Beban Tinggi)', color: 'text-amber-500', bg: 'bg-amber-500/10' }
  return { label: 'Bahaya (Risiko Gagal Bayar)', color: 'text-danger', bg: 'bg-danger-soft' }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-xs text-muted font-bold">{{ t({ id: 'Utility Hub', en: 'Utility Hub', ja: 'ユーティリティハブ', es: 'Centro de Utilidades' }) }}</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">{{ t({ id: 'Kalkulator & Alat Bantu Keuangan', en: 'Financial Calculators & Tools', ja: '電卓と財務ツール', es: 'Calculadoras y Herramientas Financieras' }) }}</h1>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-1">
          {{ t({ id: 'Kumpulan alat bantu hitung pintar untuk zakat, pajak, investasi, dana darurat, dan pembagian tagihan.', en: 'Smart calculation tools for zakat, tax, investments, emergency funds, and bill splitting.', ja: 'ザカート、税金、投資、緊急資金、請求書の分割のためのスマート計算ツール。', es: 'Herramientas inteligentes para zakat, impuestos, inversiones, fondos de emergencia y división de facturas.' }) }}
        </p>
      </div>
    </header>

    <!-- Navigation Tabs for Utilities -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        type="button"
        @click="activeTab = 'calc'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'calc' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="18" x2="12" y2="18"/><line x1="8" y1="18" x2="8" y2="18"/></svg>
        <span>{{ t({ id: 'Kalkulator Express', en: 'Express Calc', ja: '電卓', es: 'Calculadora' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'zakat'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'zakat' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span>{{ t({ id: 'Zakat Maal & Profesi', en: 'Zakat Calculator', ja: 'ザカート', es: 'Calculadora Zakat' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'tax'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'tax' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span>{{ t({ id: 'Pajak PPh 21', en: 'Income Tax (PPh 21)', ja: '所得税 (PPh 21)', es: 'Impuesto PPh 21' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'emergency'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'emergency' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>{{ t({ id: 'Dana Darurat', en: 'Emergency Fund', ja: '緊急資金', es: 'Fondo de Emergencia' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'compound'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'compound' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        <span>{{ t({ id: 'Investasi (Bunga Bergulung)', en: 'Compound Growth', ja: '複利運用', es: 'Interés Compuesto' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'split'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'split' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>{{ t({ id: 'Bagi Patungan & Tip', en: 'Bill Splitter', ja: '勘定分割', es: 'Dividir Cuenta' }) }}</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'dti'"
        class="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border"
        :class="activeTab === 'dti' ? 'bg-primary text-primary-contrast border-primary shadow-sm' : 'bg-surface border-border text-text hover:bg-surface-2'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <span>{{ t({ id: 'Rasio Utang (DTI)', en: 'DTI Ratio', ja: '負債比率 (DTI)', es: 'Ratio DTI' }) }}</span>
      </button>
    </div>

    <!-- TAB 1: EXPRESS CALCULATOR -->
    <section v-if="activeTab === 'calc'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>
          {{ t({ id: 'Kalkulator Hitung Ekspres', en: 'Express Calculator', ja: 'エクスプレス計算機', es: 'Calculadora Expresa' }) }}
        </h2>

        <!-- Display -->
        <div class="bg-surface-2 border border-border rounded-2xl p-3 flex flex-col items-end justify-center min-h-16">
          <span class="text-xs font-semibold text-muted tracking-wider overflow-x-auto max-w-full">
            {{ calcDisplay }}
          </span>
          <span class="text-xl lg:text-2xl font-extrabold text-text mt-0.5 overflow-x-auto max-w-full">
            {{ calcDisplay }}
          </span>
        </div>

        <!-- Quick Addition Presets -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <span class="text-xs font-bold text-muted uppercase tracking-wider shrink-0">+Tambah Cepat:</span>
          <button type="button" @click="addQuickAmount(10000)" class="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-xs font-semibold hover:bg-border transition-all">+10rb</button>
          <button type="button" @click="addQuickAmount(50000)" class="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-xs font-semibold hover:bg-border transition-all">+50rb</button>
          <button type="button" @click="addQuickAmount(100000)" class="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-xs font-semibold hover:bg-border transition-all">+100rb</button>
          <button type="button" @click="addQuickAmount(1000000)" class="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-xs font-semibold hover:bg-border transition-all">+1jt</button>
        </div>

        <!-- Keypad Grid -->
        <div class="grid grid-cols-4 gap-2">
          <button type="button" @click="clearCalc" class="py-2.5 px-3 rounded-xl font-bold bg-danger-soft text-danger-text hover:opacity-90 transition-all">C</button>
          <button type="button" @click="backspaceCalc" class="py-2.5 px-3 rounded-xl font-bold bg-surface-2 border border-border hover:bg-border transition-all">⌫</button>
          <button type="button" @click="appendCalc('/')" class="py-2.5 px-3 rounded-xl font-bold bg-primary-soft text-primary hover:bg-primary-muted transition-all">÷</button>
          <button type="button" @click="appendCalc('*')" class="py-2.5 px-3 rounded-xl font-bold bg-primary-soft text-primary hover:bg-primary-muted transition-all">×</button>

          <button type="button" @click="appendCalc('7')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">7</button>
          <button type="button" @click="appendCalc('8')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">8</button>
          <button type="button" @click="appendCalc('9')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">9</button>
          <button type="button" @click="appendCalc('-')" class="py-2.5 px-3 rounded-xl font-bold bg-primary-soft text-primary hover:bg-primary-muted transition-all">-</button>

          <button type="button" @click="appendCalc('4')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">4</button>
          <button type="button" @click="appendCalc('5')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">5</button>
          <button type="button" @click="appendCalc('6')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">6</button>
          <button type="button" @click="appendCalc('+')" class="py-2.5 px-3 rounded-xl font-bold bg-primary-soft text-primary hover:bg-primary-muted transition-all">+</button>

          <button type="button" @click="appendCalc('1')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">1</button>
          <button type="button" @click="appendCalc('2')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">2</button>
          <button type="button" @click="appendCalc('3')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">3</button>
          <button type="button" @click="evaluateCalc" class="row-span-2 py-2.5 px-3 rounded-xl font-extrabold bg-primary text-primary-contrast hover:opacity-90 transition-all flex items-center justify-center">=</button>

          <button type="button" @click="appendCalc('0')" class="col-span-2 py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">0</button>
          <button type="button" @click="appendCalc('.')" class="py-2.5 px-3 rounded-xl font-bold bg-surface border border-border hover:bg-surface-2 text-text transition-all">.</button>
        </div>
      </div>

      <!-- History Column -->
      <div class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h3 class="text-sm font-bold text-text border-b border-border pb-3">{{ t({ id: 'Riwayat Perhitungan', en: 'Calculation History', ja: '計算履歴', es: 'Historial de Cálculo' }) }}</h3>
        <ul class="flex flex-col gap-2">
          <li v-for="(item, idx) in calcHistory" :key="idx" class="p-3 rounded-xl bg-surface-2 border border-border text-xs font-semibold text-text flex items-center justify-between">
            <span>{{ item }}</span>
          </li>
          <li v-if="!calcHistory.length" class="text-xs text-muted font-medium py-6 text-center">
            {{ t({ id: 'Belum ada perhitungan.', en: 'No calculations yet.', ja: '計算はまだありません。', es: 'Aún no hay cálculos.' }) }}
          </li>
        </ul>
      </div>
    </section>

    <!-- TAB 2: ZAKAT CALCULATOR -->
    <section v-if="activeTab === 'zakat'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Kalkulator Zakat Maal & Zakat Profesi', en: 'Zakat Maal & Income Calculator', ja: 'ザカート計算機', es: 'Calculadora de Zakat' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Hitung kewajiban zakat 2.5% berdasarkan standar Nisab 85 gram emas.', en: 'Calculate 2.5% zakat obligation based on 85g gold Nisab standard.', ja: '85gの金のニサブ基準に基づいて2.5％のザカート義務を計算します。', es: 'Calcule la obligación de zakat del 2.5% según el estándar de Nisab de 85g de oro.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Zakat Maal (Aset) -->
        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col gap-4">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">1. {{ t({ id: 'Zakat Maal (Tabungan / Aset)', en: 'Zakat Maal (Savings / Assets)', ja: 'ザカート・マール (貯蓄/資産)', es: 'Zakat Maal (Ahorros / Activos)' }) }}</span>
          
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Estimasi Harga Emas per Gram', en: 'Gold Price per Gram', ja: '金1gあたりの価格', es: 'Precio del Oro por Gramo' }) }} (Rp)
            <input v-model.number="goldPricePerGram" type="number" placeholder="Contoh: 1350000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Total Harta / Simpanan (Telah Berjalan 1 Tahun)', en: 'Total Wealth / Savings (Held for 1 Year)', ja: '保有資産合計 (1年間保有)', es: 'Riqueza Total / Ahorros (Mantenidos durante 1 año)' }) }} (Rp)
            <input v-model.number="totalAssetsForZakat" type="number" placeholder="Contoh: 50000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <div class="border-t border-border/60 pt-3 flex flex-col gap-2">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-muted">Nisab (85g Emas):</span>
              <span class="text-text font-bold">{{ formatMoney(nisabGoldValue) }}</span>
            </div>
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-muted">Status Kewajiban:</span>
              <span :class="isZakatMaalWajib ? 'text-success font-bold' : 'text-muted font-bold'">
                {{ isZakatMaalWajib ? 'Wajib Zakat (Tercapai Nisab)' : 'Belum Wajib Zakat' }}
              </span>
            </div>
            <div class="flex justify-between items-baseline mt-1 p-3 rounded-xl bg-surface border border-border">
              <span class="text-xs font-bold text-text">Zakat Maal (2.5%):</span>
              <span class="text-base font-extrabold text-primary">{{ formatMoney(zakatMaalAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Zakat Profesi (Penghasilan) -->
        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col gap-4">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">2. {{ t({ id: 'Zakat Profesi (Gaji Bulanan)', en: 'Zakat Profesi (Monthly Income)', ja: 'ザカート・プロフェシ (月収)', es: 'Zakat Profesi (Ingreso Mensual)' }) }}</span>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Penghasilan Bersih Bulanan', en: 'Net Monthly Income', ja: '月間純収入', es: 'Ingreso Neto Mensual' }) }} (Rp)
            <input v-model.number="monthlyIncomeForZakat" type="number" placeholder="Contoh: 10000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <div class="border-t border-border/60 pt-3 flex flex-col gap-2 mt-auto">
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-muted">Nisab Per Bulan:</span>
              <span class="text-text font-bold">{{ formatMoney(nisabMonthlyIncome) }}</span>
            </div>
            <div class="flex justify-between text-xs font-semibold">
              <span class="text-muted">Status Kewajiban:</span>
              <span :class="isZakatProfesiWajib ? 'text-success font-bold' : 'text-muted font-bold'">
                {{ isZakatProfesiWajib ? 'Wajib Zakat (Tercapai Nisab)' : 'Belum Wajib Zakat' }}
              </span>
            </div>
            <div class="flex justify-between items-baseline mt-1 p-3 rounded-xl bg-surface border border-border">
              <span class="text-xs font-bold text-text">Zakat Bulanan (2.5%):</span>
              <span class="text-base font-extrabold text-primary">{{ formatMoney(zakatProfesiAmount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 3: PPH 21 TAX ESTIMATOR -->
    <section v-if="activeTab === 'tax'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Estimasi Pajak Penghasilan (PPh 21)', en: 'PPh 21 Income Tax Estimator', ja: '所得税の見積もり (PPh 21)', es: 'Estimador de Impuesto PPh 21' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Hitung estimasi potongan pajak PPh 21 berdasarkan tarif PTKP dan tarif progresif Pasal 17 UU HPP Indonesia.', en: 'Calculate PPh 21 tax estimate based on PTKP and progressive rates of Indonesian tax laws.', ja: 'PTKPおよびインドネシア税法の累進課税率に基づいてPPh21の見積もりを計算します。', es: 'Calcule la estimación de PPh 21 según PTKP y tarifas progresivas.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Gaji / Penghasilan Bruto Bulanan', en: 'Monthly Gross Salary', ja: '月間額面給与', es: 'Salario Bruto Mensual' }) }} (Rp)
            <input v-model.number="monthlyGrossSalary" type="number" placeholder="Contoh: 12000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Status PTKP (Penghasilan Tidak Kena Pajak)', en: 'PTKP Status (Tax-Free Income)', ja: 'PTKPステータス (非課税所得)', es: 'Estado PTKP (Ingreso Libre de Impuesto)' }) }}
            <select v-model="maritalStatus" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none">
              <option value="TK/0">TK/0 - Tidak Kawin (Rp 54.000.000 / thn)</option>
              <option value="K/0">K/0 - Kawin 0 Tanggungan (Rp 58.500.000 / thn)</option>
              <option value="K/1">K/1 - Kawin 1 Tanggungan (Rp 63.000.000 / thn)</option>
              <option value="K/2">K/2 - Kawin 2 Tanggungan (Rp 67.500.000 / thn)</option>
              <option value="K/3">K/3 - Kawin 3 Tanggungan (Rp 72.000.000 / thn)</option>
            </select>
          </label>
        </div>

        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col gap-3">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">Rincian Perhitungan Pajak</span>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Penghasilan Bruto Setahun:</span>
            <span class="font-bold text-text">{{ formatMoney(annualGrossSalary) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Biaya Jabatan (Max 6jt/thn):</span>
            <span class="font-bold text-text">- {{ formatMoney(occupationCost) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Penghasilan Tidak Kena Pajak (PTKP):</span>
            <span class="font-bold text-text">- {{ formatMoney(ptkpValues[maritalStatus] || 54000000) }}</span>
          </div>
          <div class="flex justify-between text-xs border-t border-border/60 pt-2">
            <span class="text-muted">Penghasilan Kena Pajak (PKP):</span>
            <span class="font-bold text-text">{{ formatMoney(taxableIncome) }}</span>
          </div>
          <div class="flex justify-between items-baseline mt-2 p-3.5 rounded-xl bg-surface border border-border">
            <span class="text-xs font-bold text-text">Estimasi PPh 21 / Bulan:</span>
            <span class="text-base font-extrabold text-danger">{{ formatMoney(estimatedMonthlyTax) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: EMERGENCY FUND -->
    <section v-if="activeTab === 'emergency'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Kalkulator Target Dana Darurat', en: 'Emergency Fund Target Calculator', ja: '緊急資金ターゲット電卓', es: 'Calculadora de Fondo de Emergencia' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Ketahui berapa dana cadangan yang harus disiapkan untuk mengantisipasi risiko keuangan tak terduga.', en: 'Know how much reserve funds to prepare for unexpected financial risks.', ja: '予期せぬ財務上のリスクに備えて、どのくらいの予備費を用意すべきかを知りましょう。', es: 'Sepa cuántos fondos de reserva preparar para riesgos financieros inesperados.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Pengeluaran Rutin Bulanan', en: 'Monthly Expenses', ja: '月間支出', es: 'Gastos Mensuales' }) }} (Rp)
            <input v-model.number="manualLivingCost" type="number" placeholder="Contoh: 5000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Status Tanggungan Keluarga', en: 'Family Dependents Status', ja: '家族扶養ステータス', es: 'Estado de Dependientes Familiares' }) }}
            <select v-model="familyStatus" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none">
              <option value="single">Single / Lajang (Rekomendasi 3 Bulan)</option>
              <option value="married">Menikah (Rekomendasi 6 Bulan)</option>
              <option value="family">Menikah & Memiliki Anak (Rekomendasi 12 Bulan)</option>
            </select>
          </label>
        </div>

        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col justify-between gap-4">
          <div class="flex flex-col gap-2">
            <span class="text-xs font-bold text-primary uppercase tracking-wider">Rekomendasi Cadangan</span>
            <p class="text-sm font-bold text-text">
              Target {{ emergencyMultiplier }} Bulan Pengeluaran
            </p>
            <p class="text-xs text-muted">
              Memastikan keluargamu aman bertahan selama {{ emergencyMultiplier }} bulan jika terjadi kehilangan pekerjaan atau krisis ekonomi.
            </p>
          </div>
          <div class="p-4 rounded-xl bg-surface border border-border flex justify-between items-center">
            <span class="text-xs font-bold text-text">Total Dana Darurat:</span>
            <span class="text-lg font-extrabold text-success">{{ formatMoney(targetEmergencyFund) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 5: COMPOUND GROWTH -->
    <section v-if="activeTab === 'compound'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Kalkulator Investasi & Bunga Bergulung', en: 'Investment & Compound Interest Calculator', ja: '投資と複利計算機', es: 'Calculadora de Inversión e Interés Compuesto' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Hitung pertumbuhan nilai investasi jangka panjangmu dengan efek keajaiban bunga bergulung.', en: 'Calculate long-term investment growth with the magic of compound interest.', ja: '複利の魔法効果で長期投資の成長率を計算します。', es: 'Calcule el crecimiento de inversión a largo plazo con interés compuesto.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Modal Awal Investasi (Rp)
            <input v-model.number="initialInvestment" type="number" placeholder="Contoh: 10000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Setoran Rutin Bulanan (Rp)
            <input v-model.number="monthlyContribution" type="number" placeholder="Contoh: 1000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <div class="grid grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Jangka Waktu (Tahun)
              <input v-model.number="investmentYears" type="number" min="1" max="50" placeholder="5" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Return / Thn (%)
              <input v-model.number="expectedReturnRate" type="number" step="0.5" placeholder="7" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
            </label>
          </div>
        </div>

        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col justify-between gap-3">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">Hasil Proyeksi Masa Depan</span>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Total Setoran Modal:</span>
            <span class="font-bold text-text">{{ formatMoney(compoundResults.totalDeposited) }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Estimasi Keuntungan Bunga:</span>
            <span class="font-bold text-success">+ {{ formatMoney(compoundResults.interestEarned) }}</span>
          </div>
          <div class="flex justify-between items-baseline mt-2 p-3.5 rounded-xl bg-surface border border-border">
            <span class="text-xs font-bold text-text">Proyeksi Total Aset:</span>
            <span class="text-lg font-extrabold text-primary">{{ formatMoney(compoundResults.totalBalance) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 6: BILL SPLITTER -->
    <section v-if="activeTab === 'split'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Kalkulator Pembagian Patungan (Bill Splitter)', en: 'Bill Splitter & Tip Calculator', ja: '割勘計算機', es: 'Calculadora de División de Facturas' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Bagi bill makan bersama teman-teman secara adil dengan pajak dan tip.', en: 'Split dining bills with friends fairly including tax and tips.', ja: '税金やチップを含めて友人との食事の請求書を公平に分割します。', es: 'Divida las facturas con amigos justamente incluyendo impuestos y propinas.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Total Tagihan / Struk (Rp)
            <input v-model.number="billAmount" type="number" placeholder="Contoh: 350000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <div class="grid grid-cols-3 gap-3">
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Jumlah Orang
              <input v-model.number="numberOfPeople" type="number" min="1" placeholder="3" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Pajak (%)
              <input v-model.number="taxPercentage" type="number" placeholder="11" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Tip (%)
              <input v-model.number="tipPercentage" type="number" placeholder="10" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
            </label>
          </div>
        </div>

        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col justify-between gap-3">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">Hasil Patungan</span>
          <div class="flex justify-between text-xs">
            <span class="text-muted">Total Struk + Pajak + Tip:</span>
            <span class="font-bold text-text">{{ formatMoney(totalBillWithTaxTip) }}</span>
          </div>
          <div class="p-4 rounded-xl bg-surface border border-border flex justify-between items-center mt-2">
            <span class="text-xs font-bold text-text">Bayar per Orang ({{ numberOfPeople }} org):</span>
            <span class="text-lg font-extrabold text-primary">{{ formatMoney(perPersonAmount) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 7: DTI RATIO -->
    <section v-if="activeTab === 'dti'" class="bg-surface border border-border rounded-2xl p-6 shadow-custom flex flex-col gap-6">
      <div>
        <h2 class="text-base font-bold text-text border-b border-border pb-3">{{ t({ id: 'Kalkulator Rasio Utang (Debt-to-Income)', en: 'Debt-to-Income (DTI) Ratio Checker', ja: 'DTI比率チェッカー', es: 'Verificador de Ratio DTI' }) }}</h2>
        <p class="text-xs text-muted leading-relaxed font-semibold mt-2">
          {{ t({ id: 'Cek kesehatan finansialmu dengan mengukur perbandingan total angsuran utang bulanan terhadap penghasilan.', en: 'Check your financial health by comparing total monthly debt payments against income.', ja: '月々の総返済額と収入を比較して健全性を測定します。', es: 'Verifique su salud financiera comparando los pagos mensuales de deuda con sus ingresos.' }) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Penghasilan Bulanan Bersih (Rp)
            <input v-model.number="dtiIncome" type="number" placeholder="Contoh: 12000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Total Cicilan & Utang Bulanan (Rp)
            <input v-model.number="dtiDebts" type="number" placeholder="Contoh: 3000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none placeholder:text-muted/50" />
          </label>
        </div>

        <div class="border border-border rounded-2xl p-5 bg-surface-2 flex flex-col justify-between gap-3">
          <span class="text-xs font-bold text-primary uppercase tracking-wider">Evaluasi Kesehatan Finansial</span>
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted font-bold">Rasio DTI Anda:</span>
            <span class="text-xl font-extrabold text-text">{{ dtiRatio.toFixed(1) }}%</span>
          </div>
          <div class="p-3.5 rounded-xl border flex items-center justify-between" :class="dtiStatus.bg">
            <span class="text-xs font-bold text-text">Kategori Status:</span>
            <span class="text-sm font-extrabold" :class="dtiStatus.color">{{ dtiStatus.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
