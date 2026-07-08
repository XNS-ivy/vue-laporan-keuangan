<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StatCard from '../components/StatCard.vue'
import FinanceChart from '../components/FinanceChart.vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'

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
  automatedInsights,
  totalDebt,
  totalReceivable,
  addTransaction,
  addCategory,
} = useFinance()

const palette = ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']

const expenseChartData = computed(() => ({
  labels: expenseByCategory.value.map(([category]) => category),
  datasets: [{ data: expenseByCategory.value.map(([, amount]) => amount), backgroundColor: palette }],
}))

const monthlyChartData = computed(() => ({
  labels: monthlyTrend.value.map(([month]) => month),
  datasets: [
    { label: 'Pemasukan', data: monthlyTrend.value.map(([, values]) => values.income), backgroundColor: '#16a34a' },
    { label: 'Pengeluaran', data: monthlyTrend.value.map(([, values]) => values.expense), backgroundColor: '#ef4444' },
  ],
}))

const cashflowChartData = computed(() => ({
  labels: monthlyTrend.value.map(([month]) => month),
  datasets: [
    {
      label: 'Arus Kas Bersih',
      data: monthlyTrend.value.map(([, values]) => values.net),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.18)',
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
      backgroundColor: categoryAnalytics.value.slice(0, 6).map((_, index) => palette[index % palette.length]),
    },
  ],
}))

const latestTransactions = computed(() => [...transactions.value].slice(0, 6))
const biggestExpense = computed(() => expenseByCategory.value[0])
const topIncome = computed(() => incomeByCategory.value[0])
const savingsRate = computed(() => (incomeTotal.value ? Math.round((balance.value / incomeTotal.value) * 100) : 0))
const healthiestCategory = computed(() => categoryAnalytics.value[0])
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Analisis keuangan yang lebih bisa ditindaklanjuti</h1>
        <p>Ringkasan sekarang dilengkapi perbandingan bulanan, insight otomatis, alert budget, goal tabungan, dan status utang/piutang supaya user bisa langsung ambil keputusan.</p>
      </div>
      <div class="hero-actions">
        <RouterLink to="/reports" class="hero-link">Export Laporan</RouterLink>
        <RouterLink to="/savings-goal" class="hero-link">Kelola Goal</RouterLink>
      </div>
    </header>

    <section class="stats-grid">
      <StatCard label="Pemasukan" :value="`Rp ${incomeTotal.toLocaleString('id-ID')}`" tone="positive" />
      <StatCard label="Pengeluaran" :value="`Rp ${expenseTotal.toLocaleString('id-ID')}`" tone="negative" />
      <StatCard label="Saldo" :value="`Rp ${balance.toLocaleString('id-ID')}`" :tone="balance >= 0 ? 'positive' : 'negative'" />
      <StatCard label="Aset" :value="`Rp ${totalAssets.toLocaleString('id-ID')}`" tone="neutral" />
    </section>

    <section class="content-grid">
      <TransactionForm
        :categories="categories"
        @submit="addTransaction"
        @add-category="({ name, type }) => addCategory(name, type)"
      />

      <div class="stack">
        <section class="card analytics-card">
          <div class="section-head">
            <h3>Insight Utama</h3>
            <span class="pill">Transaksi {{ transactionCount }}</span>
          </div>
          <ul>
            <li>Rasio tabungan saat ini: <strong>{{ savingsRate }}%</strong></li>
            <li>Rata-rata pemasukan per transaksi: <strong>Rp {{ averageIncome.toLocaleString('id-ID') }}</strong></li>
            <li>Rata-rata pengeluaran per transaksi: <strong>Rp {{ averageExpense.toLocaleString('id-ID') }}</strong></li>
            <li>Kategori pengeluaran terbesar: <strong>{{ biggestExpense ? biggestExpense[0] : 'Belum ada' }}</strong></li>
            <li>Sumber pemasukan utama: <strong>{{ topIncome ? topIncome[0] : 'Belum ada' }}</strong></li>
          </ul>
        </section>

        <section class="card savings-overview">
          <div class="section-head">
            <h3>Status Goal Tabungan</h3>
            <span>{{ savingsGoalProgress }}%</span>
          </div>
          <div class="bar"><span :style="{ width: `${savingsGoalProgress}%` }"></span></div>
          <p>
            Total target <strong>Rp {{ savingsGoalTarget.toLocaleString('id-ID') }}</strong>
            dengan estimasi
            <strong>{{ monthsToGoal === null ? 'belum bisa dihitung' : `${monthsToGoal} bulan` }}</strong>.
          </p>
        </section>

        <section class="card comparison-card">
          <h3>Perbandingan Bulanan</h3>
          <ul>
            <li>Pemasukan berubah <strong>{{ monthlyComparison.incomeChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.incomeChange.toLocaleString('id-ID') }}</strong></li>
            <li>Pengeluaran berubah <strong>{{ monthlyComparison.expenseChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.expenseChange.toLocaleString('id-ID') }}</strong></li>
            <li>Net cashflow berubah <strong>{{ monthlyComparison.netChange >= 0 ? '+' : '' }}Rp {{ monthlyComparison.netChange.toLocaleString('id-ID') }}</strong></li>
          </ul>
        </section>
      </div>
    </section>

    <section v-if="budgetAlerts.length" class="card alert-card">
      <h2>Budget Alert</h2>
      <div class="alert-list">
        <div v-for="item in budgetAlerts" :key="item.id" class="alert-item" :class="item.level">
          <strong>{{ item.category }}</strong>
          <span>{{ item.message }}</span>
        </div>
      </div>
    </section>

    <section class="chart-grid">
      <FinanceChart type="doughnut" title="Pengeluaran per Kategori" :data="expenseChartData" />
      <FinanceChart type="bar" title="Tren 6 Bulan" :data="monthlyChartData" />
      <FinanceChart type="line" title="Arus Kas Bersih per Bulan" :data="cashflowChartData" />
      <FinanceChart type="bar" title="Kategori Paling Aktif" :data="categoryActivityChartData" />
    </section>

    <section class="analytics-grid">
      <article class="card analytics-card">
        <h3>Analisis Perilaku User</h3>
        <ul>
          <li v-for="item in automatedInsights" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="card analytics-card">
        <h3>Analisis Kategori dan Kewajiban</h3>
        <p v-if="healthiestCategory">
          Kategori paling dominan saat ini adalah <strong>{{ healthiestCategory.name }}</strong>
          dengan total <strong>Rp {{ healthiestCategory.total.toLocaleString('id-ID') }}</strong>
          dari <strong>{{ healthiestCategory.count }} transaksi</strong>.
        </p>
        <p>Utang aktif: <strong>Rp {{ totalDebt.toLocaleString('id-ID') }}</strong></p>
        <p>Piutang aktif: <strong>Rp {{ totalReceivable.toLocaleString('id-ID') }}</strong></p>
      </article>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>Transaksi Terbaru</h2>
        <span class="pill">Kategori aktif {{ categories.length }}</span>
      </div>
      <ul class="list">
        <li v-for="item in latestTransactions" :key="item.id" class="list-item">
          <div>
            <strong>{{ item.category }}</strong>
            <p>{{ item.note || 'Tanpa catatan' }} • {{ item.date }}</p>
          </div>
          <span :class="item.type === 'income' ? 'good' : 'warn'">
            {{ item.type === 'income' ? '+' : '-' }} Rp {{ item.amount.toLocaleString('id-ID') }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), var(--hero-accent)); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); display: flex; justify-content: space-between; gap: 1rem; align-items: end; }
.hero-actions { display: flex; gap: 0.7rem; flex-wrap: wrap; justify-content: flex-end; }
.hero-link { color: white; text-decoration: none; border: 1px solid rgba(255,255,255,0.28); border-radius: 999px; padding: 0.72rem 1rem; background: rgba(255,255,255,0.1); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; opacity: 0.8; }
.hero h1 { margin: 0.2rem 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.content-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1rem; }
.stack { display: flex; flex-direction: column; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.section-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.analytics-card ul { padding-left: 1rem; margin: 0.5rem 0 0; color: var(--muted); }
.analytics-card li { margin-bottom: 0.4rem; }
.analytics-card strong { color: var(--text); }
.savings-overview { display: flex; flex-direction: column; gap: 0.75rem; }
.comparison-card ul { padding-left: 1rem; margin: 0.3rem 0 0; color: var(--muted); }
.alert-card { border-color: color-mix(in srgb, var(--danger) 20%, var(--border)); }
.alert-list { display: flex; flex-wrap: wrap; gap: 0.7rem; }
.alert-item { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.8rem 0.9rem; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.alert-item.warning { border-color: #f59e0b; }
.alert-item.danger { border-color: var(--danger); }
.bar { width: 100%; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--success)); }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid var(--border); }
.good { color: var(--success); font-weight: 600; }
.warn { color: var(--danger); font-weight: 600; }
@media (max-width: 900px) {
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-actions { justify-content: flex-start; }
  .content-grid { grid-template-columns: 1fr; }
  .list-item { flex-direction: column; align-items: flex-start; }
}
</style>
