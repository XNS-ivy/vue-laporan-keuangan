<script setup lang="ts">
import { computed, ref } from 'vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance } from '../composables/useFinance'

const { filteredTransactions: transactions, categories, recurringTransactions, upcomingRecurring, addTransaction, addCategory, addRecurringTransaction, applyRecurringTransaction, deleteRecurringTransaction, deleteTransaction } = useFinance()
const filter = ref<'all' | 'income' | 'expense'>('all')
const recurringForm = ref({
  title: '',
  type: 'expense' as 'income' | 'expense',
  category: '',
  amount: '',
  note: '',
  dayOfMonth: '1',
})

const filteredTransactions = computed(() => {
  if (filter.value === 'all') return transactions.value
  return transactions.value.filter((item) => item.type === filter.value)
})

const submitRecurring = () => {
  addRecurringTransaction({
    title: recurringForm.value.title,
    type: recurringForm.value.type,
    category: recurringForm.value.category,
    amount: Number(recurringForm.value.amount),
    note: recurringForm.value.note,
    dayOfMonth: Number(recurringForm.value.dayOfMonth),
  })
  recurringForm.value = { title: '', type: 'expense', category: '', amount: '', note: '', dayOfMonth: '1' }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Transaksi</p>
        <h1>Catat uang masuk, keluar, dan transaksi rutin</h1>
      </div>
      <select v-model="filter">
        <option value="all">Semua</option>
        <option value="income">Pemasukan</option>
        <option value="expense">Pengeluaran</option>
      </select>
    </header>

    <div class="content-grid">
      <TransactionForm :categories="categories" @submit="addTransaction" @add-category="({ name, type }) => addCategory(name, type)" />
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

    <section class="content-grid">
      <section class="card">
        <h2>Recurring Transaction</h2>
        <div class="form-grid">
          <label>
            Judul
            <input v-model="recurringForm.title" placeholder="Contoh: Gaji Bulanan" />
          </label>
          <label>
            Jenis
            <select v-model="recurringForm.type">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </label>
          <label>
            Kategori
            <input v-model="recurringForm.category" placeholder="Contoh: Tagihan" />
          </label>
          <label>
            Nominal
            <input v-model="recurringForm.amount" type="number" min="0" placeholder="350000" />
          </label>
          <label>
            Tanggal setiap bulan
            <input v-model="recurringForm.dayOfMonth" type="number" min="1" max="28" />
          </label>
          <label class="full">
            Catatan
            <input v-model="recurringForm.note" placeholder="Catatan transaksi rutin" />
          </label>
        </div>
        <button class="primary-btn" type="button" @click="submitRecurring">Tambah Transaksi Rutin</button>
      </section>

      <section class="card">
        <h2>Jadwal Transaksi Rutin</h2>
        <div class="goal-list">
          <article v-for="item in upcomingRecurring" :key="item.id" class="goal-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.category }} • Tanggal {{ item.dayOfMonth }} • Rp {{ item.amount.toLocaleString('id-ID') }}</p>
              <p>{{ item.note || 'Tanpa catatan' }} • {{ item.isApplied ? 'Sudah diterapkan bulan ini' : 'Belum diterapkan' }}</p>
            </div>
            <div class="actions">
              <button class="primary-btn" type="button" @click="applyRecurringTransaction(item.id)">Terapkan</button>
              <button class="ghost-btn" type="button" @click="deleteRecurringTransaction(item.id)">Hapus</button>
            </div>
          </article>
          <p v-if="!recurringTransactions.length" class="subtle">Belum ada transaksi rutin.</p>
        </div>
      </section>
    </section>

    <section class="card">
      <h2>Kategori Aktif</h2>
      <p class="subtle">Kategori akan bertambah otomatis saat transaksi baru disimpan, atau bisa ditambahkan langsung dari input form.</p>
      <div class="category-groups">
        <div>
          <h3>Pemasukan</h3>
          <div class="chips">
            <span v-for="item in categories.filter((category) => category.type === 'income')" :key="item.id" class="chip">{{ item.name }}</span>
          </div>
        </div>
        <div>
          <h3>Pengeluaran</h3>
          <div class="chips">
            <span v-for="item in categories.filter((category) => category.type === 'expense')" :key="item.id" class="chip">{{ item.name }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), var(--hero-accent)); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; opacity: 0.8; }
.page-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.8rem; color: var(--muted); }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1rem; box-shadow: var(--shadow); }
.list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.list-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.7rem; border-bottom: 1px solid var(--border); }
.meta { display: flex; align-items: center; gap: 0.7rem; }
.good { color: var(--success); font-weight: 600; }
.warn { color: var(--danger); font-weight: 600; }
.subtle { color: var(--muted); margin-top: -0.2rem; }
.category-groups { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.55rem; }
.chip { border-radius: 999px; padding: 0.42rem 0.75rem; }
.form-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.full { grid-column: 1 / -1; }
.goal-list { display: flex; flex-direction: column; gap: 0.8rem; }
.goal-item { display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); }
.actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
@media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; } .form-grid { grid-template-columns: 1fr; } .goal-item, .list-item { flex-direction: column; align-items: flex-start; } }
</style>
