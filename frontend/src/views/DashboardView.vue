<script setup lang="ts">
import { computed } from 'vue'
import StatCard from '../components/StatCard.vue'
import FinanceChart from '../components/FinanceChart.vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'

const { transactions, incomeTotal, expenseTotal, balance, totalAssets, expenseByCategory, monthlyTrend, addTransaction, savingsGoal, setSavingsGoal } = useFinance()

const expenseChartData = computed(() => ({
  labels: expenseByCategory.value.map(([category]) => category),
  datasets: [{ data: expenseByCategory.value.map(([, amount]) => amount), backgroundColor: ['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444'] }],
}))

const monthlyChartData = computed(() => ({
  labels: monthlyTrend.value.map(([month]) => month),
  datasets: [
    { label: 'Pemasukan', data: monthlyTrend.value.map(([, values]) => values.income), backgroundColor: '#16a34a' },
    { label: 'Pengeluaran', data: monthlyTrend.value.map(([, values]) => values.expense), backgroundColor: '#ef4444' },
  ],
}))

const latestTransactions = computed(() => [...transactions.value].slice(0, 6))
const goalProgress = computed(() => Math.min(100, Math.round((balance.value / Math.max(1, savingsGoal.value)) * 100)))
const biggestExpense = computed(() => expenseByCategory.value[0])
const savingsRate = computed(() => (incomeTotal.value ? Math.round((balance.value / incomeTotal.value) * 100) : 0))
const averageExpense = computed(() => (monthlyTrend.value.length ? Math.round(expenseTotal.value / monthlyTrend.value.length) : 0))
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Ringkasan finansial Anda</h1>
        <p>Kelola pemasukan, pengeluaran, dan target anggaran dari satu tempat dengan tampilan yang lebih nyaman.</p>
      </div>
    </header>

    <section class="stats-grid">
      <StatCard label="Pemasukan" :value="`Rp ${incomeTotal.toLocaleString('id-ID')}`" tone="positive" />
      <StatCard label="Pengeluaran" :value="`Rp ${expenseTotal.toLocaleString('id-ID')}`" tone="negative" />
      <StatCard label="Saldo" :value="`Rp ${balance.toLocaleString('id-ID')}`" :tone="balance >= 0 ? 'positive' : 'negative'" />
      <StatCard label="Aset" :value="`Rp ${totalAssets.toLocaleString('id-ID')}`" tone="neutral" />
    </section>

    <section class="content-grid">
      <TransactionForm :categories="[]" @submit="addTransaction" />
      <div class="stack">
        <section class="card goal-card">
          <div class="goal-header">
            <h3>Target Tabungan</h3>
            <span>{{ savingsGoal }}%</span>
          </div>
          <input type="range" v-model.number="savingsGoal" min="10" max="100" step="5" @input="setSavingsGoal(Number(savingsGoal))" />
          <div class="bar"><span :style="{ width: `${goalProgress}%` }"></span></div>
          <p>Progress saat ini: {{ goalProgress }}%</p>
        </section>
        <FinanceChart type="doughnut" title="Pengeluaran per Kategori" :data="expenseChartData" />
        <FinanceChart type="bar" title="Tren 6 Bulan" :data="monthlyChartData" />
      </div>
    </section>

    <section class="analytics-grid">
      <article class="card analytics-card">
        <h3>Analitik Singkat</h3>
        <ul>
          <li>Rasio tabungan: <strong>{{ savingsRate }}%</strong></li>
          <li>Rata-rata pengeluaran per bulan: <strong>Rp {{ averageExpense.toLocaleString('id-ID') }}</strong></li>
          <li>Kategori terbesar: <strong>{{ biggestExpense ? biggestExpense[0] : 'Belum ada' }}</strong></li>
        </ul>
      </article>
      <article class="card analytics-card">
        <h3>Insight</h3>
        <p v-if="balance >= 0">Kondisi saldo Anda sekarang sehat. Anda bisa mempertahankan pola menabung yang konsisten.</p>
        <p v-else>Saldo Anda sedang minus. Fokuskan pengurangan belanja di kategori utama agar lebih stabil.</p>
      </article>
    </section>

    <section class="card">
      <h2>Transaksi Terbaru</h2>
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
.hero { background: linear-gradient(135deg, var(--sidebar-bg), #2563eb); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; opacity: 0.8; }
.hero h1 { margin: 0.2rem 0; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
.content-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 1rem; }
.stack { display: flex; flex-direction: column; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.goal-card { display: flex; flex-direction: column; gap: 0.6rem; }
.goal-header { display: flex; justify-content: space-between; align-items: center; }
input[type='range'] { width: 100%; accent-color: #2563eb; }
.bar { width: 100%; height: 8px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
.bar span { display: block; height: 100%; background: linear-gradient(90deg, #2563eb, #22c55e); }
.analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
.analytics-card ul { padding-left: 1rem; margin: 0.5rem 0 0; color: var(--muted); }
.analytics-card li { margin-bottom: 0.4rem; }
.analytics-card strong { color: var(--text); }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid var(--border); }
.good { color: #16a34a; font-weight: 600; }
.warn { color: #dc2626; font-weight: 600; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .list-item { flex-direction: column; align-items: flex-start; } }
</style>
