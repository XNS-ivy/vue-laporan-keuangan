<script setup lang="ts">
import { computed, ref } from 'vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'

const { transactions, categories, addTransaction, deleteTransaction } = useFinance()
const filter = ref<'all' | 'income' | 'expense'>('all')

const filteredTransactions = computed(() => {
  if (filter.value === 'all') return transactions.value
  return transactions.value.filter((item) => item.type === filter.value)
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Transaksi</p>
        <h1>Catat setiap uang masuk dan keluar</h1>
      </div>
      <select v-model="filter">
        <option value="all">Semua</option>
        <option value="income">Pemasukan</option>
        <option value="expense">Pengeluaran</option>
      </select>
    </header>

    <div class="content-grid">
      <TransactionForm :categories="categories" @submit="addTransaction" />
      <section class="card">
        <h2>Riwayat Transaksi</h2>
        <ul class="list">
          <li v-for="item in filteredTransactions" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.category }}</strong>
              <p>{{ item.note || 'Tanpa catatan' }} • {{ item.date }}</p>
            </div>
            <div class="meta">
              <span :class="item.type === 'income' ? 'good' : 'warn'">
                {{ item.type === 'income' ? '+' : '-' }} Rp {{ item.amount.toLocaleString('id-ID') }}
              </span>
              <button class="ghost-btn" @click="deleteTransaction(item.id)">Hapus</button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: #64748b; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: white; border-radius: 16px; padding: 1rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid #e2e8f0; }
.meta { display: flex; align-items: center; gap: 0.7rem; }
.ghost-btn { border: none; border-radius: 999px; padding: 0.45rem 0.7rem; background: #fee2e2; color: #b91c1c; cursor: pointer; }
.good { color: #16a34a; font-weight: 600; }
.warn { color: #dc2626; font-weight: 600; }
select { border: 1px solid #cbd5e1; border-radius: 10px; padding: 0.6rem 0.8rem; background: #f8fafc; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } }
</style>
