<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance, type Transaction } from '../composables/useFinance'
import { useUi } from '../composables/useUi'

const {
  filteredTransactions: transactions,
  categories,
  recurringTransactions,
  upcomingRecurring,
  addTransaction,
  addCategory,
  addRecurringTransaction,
  applyRecurringTransaction,
  deleteRecurringTransaction,
  deleteTransaction,
  updateTransaction,
} = useFinance()

const { globalDateFilter, hasDateFilter, resetGlobalDateFilter, setGlobalDateFilter } = useUi()

const filter = ref<'all' | 'income' | 'expense'>('all')
const searchQuery = ref('')
const minAmount = ref<number | ''>('')
const maxAmount = ref<number | ''>('')

const currentPage = ref(1)
const itemsPerPage = 10

const editingTransaction = ref<Transaction | null>(null)

const recurringForm = ref({
  title: '',
  type: 'expense' as 'income' | 'expense',
  category: '',
  amount: '',
  note: '',
  dayOfMonth: '1',
})

const filteredTransactions = computed(() => {
  let list = transactions.value

  if (filter.value !== 'all') {
    list = list.filter((item) => item.type === filter.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(
      (item) =>
        item.category.toLowerCase().includes(query) ||
        item.note.toLowerCase().includes(query),
    )
  }

  if (minAmount.value !== '') {
    list = list.filter((item) => item.amount >= (minAmount.value as number))
  }

  if (maxAmount.value !== '') {
    list = list.filter((item) => item.amount <= (maxAmount.value as number))
  }

  return list
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage))

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTransactions.value.slice(start, start + itemsPerPage)
})

// Watch filters to reset page to 1
watch([filter, searchQuery, minAmount, maxAmount], () => {
  currentPage.value = 1
})

const handleUpdateTransaction = (id: number, payload: Omit<Transaction, 'id'>) => {
  updateTransaction(id, payload)
  editingTransaction.value = null
}

const handleCancelEdit = () => {
  editingTransaction.value = null
}

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
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Transaksi</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Catat Transaksi & Pengeluaran Rutinmu</h1>
      </div>
      <select v-model="filter" class="border border-border rounded-xl px-4 py-2 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all w-full sm:w-auto">
        <option value="all">Semua Jenis</option>
        <option value="income">Pemasukan saja</option>
        <option value="expense">Pengeluaran saja</option>
      </select>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TransactionForm
        :categories="categories"
        :edit-transaction="editingTransaction"
        @submit="addTransaction"
        @update="handleUpdateTransaction"
        @cancel-edit="handleCancelEdit"
        @add-category="({ name, type }) => addCategory(name, type)"
      />
      
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Riwayat Transaksi</h2>
        
        <div class="flex flex-col gap-3">
          <input v-model="searchQuery" placeholder="Cari catatan atau kategori..." type="text" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          <div class="grid grid-cols-2 gap-3">
            <input v-model.number="minAmount" placeholder="Nominal Min (Rp)" type="number" min="0" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
            <input v-model.number="maxAmount" placeholder="Nominal Max (Rp)" type="number" min="0" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </div>
          <div class="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              Dari Tanggal
              <input
                :value="globalDateFilter.start"
                type="date"
                class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all"
                @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              Sampai Tanggal
              <input
                :value="globalDateFilter.end"
                type="date"
                class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all"
                @input="setGlobalDateFilter({ end: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <button
              v-if="hasDateFilter"
              class="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none"
              type="button"
              @click="resetGlobalDateFilter"
            >
              Reset
            </button>
          </div>
        </div>

        <ul class="flex flex-col gap-3 pr-1">
          <li v-for="item in paginatedTransactions" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <strong class="text-sm font-bold text-text">{{ item.category }}</strong>
                <span v-if="item.subCategory" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary border border-primary/10">
                  {{ item.subCategory }}
                </span>
              </div>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.note || 'Tanpa catatan' }} • {{ item.date }}</p>
            </div>
            <div class="flex items-center gap-3.5 shrink-0">
              <span :class="item.type === 'income' ? 'text-success' : 'text-danger'" class="text-sm font-bold">
                {{ item.type === 'income' ? '+' : '-' }} Rp {{ item.amount.toLocaleString('id-ID') }}
              </span>
              <div class="flex items-center gap-1.5">
                <button class="px-3 py-1.5 rounded-full text-xs font-bold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none flex items-center gap-1" type="button" @click="editingTransaction = item">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
                <button class="px-3 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none flex items-center gap-1" type="button" @click="deleteTransaction(item.id)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          </li>
          <li v-if="!paginatedTransactions.length" class="text-center py-10 text-xs text-muted font-semibold">
            Tidak ada transaksi ditemukan.
          </li>
        </ul>

        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button class="px-4 py-2 rounded-xl text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === 1" @click="currentPage--">Sebelumnya</button>
          <span class="text-xs font-semibold text-muted">Halaman {{ currentPage }} dari {{ totalPages }}</span>
          <button class="px-4 py-2 rounded-xl text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === totalPages" @click="currentPage++">Selanjutnya</button>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Recurring Transaction</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Judul
            <input v-model="recurringForm.title" placeholder="Contoh: Gaji Bulanan" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jenis
            <select v-model="recurringForm.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all">
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Kategori
            <input v-model="recurringForm.category" placeholder="Contoh: Tagihan" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal
            <input v-model="recurringForm.amount" type="number" min="0" placeholder="350000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tanggal setiap bulan
            <input v-model="recurringForm.dayOfMonth" type="number" min="1" max="28" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Catatan
            <input v-model="recurringForm.note" placeholder="Catatan transaksi rutin" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitRecurring">Tambah Transaksi Rutin</button>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Jadwal Transaksi Rutin</h2>
        <div class="flex flex-col gap-3">
          <article v-for="item in upcomingRecurring" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.title }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.category }} • Tanggal {{ item.dayOfMonth }} • Rp {{ item.amount.toLocaleString('id-ID') }}</p>
              <p class="text-[10px] text-muted font-bold mt-1 inline-block px-2 py-0.5 bg-surface-2 rounded-md border border-border">{{ item.isApplied ? 'Sudah diterapkan bulan ini' : 'Belum diterapkan' }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="applyRecurringTransaction(item.id)">Terapkan</button>
              <button class="px-3 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none flex items-center gap-1" type="button" @click="deleteRecurringTransaction(item.id)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
            </div>
          </article>
          <p v-if="!recurringTransactions.length" class="text-center py-8 text-xs text-muted font-semibold">Belum ada transaksi rutin.</p>
        </div>
      </section>
    </div>

    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Kategori Aktif</h2>
      <p class="text-xs text-muted font-medium -mt-2">Kategori ditambahkan otomatis saat transaksi baru disimpan, atau bisa dikelola secara mendetail dari Settings.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-1">
        <div>
          <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Pemasukan</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="item in categories.filter((category) => category.type === 'income')" :key="item.id" class="px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-soft">
              {{ item.name }}
            </span>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Pengeluaran</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="item in categories.filter((category) => category.type === 'expense')" :key="item.id" class="px-3 py-1.5 rounded-full text-xs font-semibold text-danger bg-danger-soft">
              {{ item.name }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

