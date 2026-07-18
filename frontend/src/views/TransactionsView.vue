<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TransactionForm from '../components/TransactionForm.vue'
import { useFinance, type Transaction } from '../composables/useFinance'
import { useUi } from '../composables/useUi'
import { getDynamicStep, handleNominalKeydown, t, formatMoney, appMode } from '../composables/useUserSettings'

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
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">{{ t({ id: 'Transaksi', en: 'Transactions', ja: '取引', es: 'Transacciones' }) }}</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">
          {{ appMode === 'simple' 
              ? t({ id: 'Catat Transaksi Harianmu', en: 'Record Your Daily Transactions', ja: '日々の取引を記録する', es: 'Registre sus Transacciones Diarias' })
              : t({ id: 'Catat Transaksi & Pengeluaran Rutinmu', en: 'Record Your Transactions & Recurring Expenses', ja: '取引と定期的な支出を記録しましょう', es: 'Registre sus Transacciones y Gastos Recurrentes' })
          }}
        </h1>
      </div>
      <select v-model="filter" class="border border-border rounded-xl px-4 py-2 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all w-full sm:w-auto">
        <option value="all">{{ t({ id: 'Semua Jenis', en: 'All Types', ja: 'すべての種類', es: 'Todos los Tipos' }) }}</option>
        <option value="income">{{ t({ id: 'Pemasukan saja', en: 'Income only', ja: '収入のみ', es: 'Solo ingresos' }) }}</option>
        <option value="expense">{{ t({ id: 'Pengeluaran saja', en: 'Expense only', ja: '支出のみ', es: 'Solo gastos' }) }}</option>
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
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Riwayat Transaksi', en: 'Transaction History', ja: '取引履歴', es: 'Historial de Transacciones' }) }}</h2>
        
        <div v-if="appMode === 'advance'" class="flex flex-col gap-3">
          <input v-model="searchQuery" :placeholder="t({ id: 'Cari catatan atau kategori...', en: 'Search note or category...', ja: 'メモまたはカテゴリーを検索...', es: 'Buscar nota o categoría...' })" type="text" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          <div class="grid grid-cols-2 gap-3">
            <input 
              v-model.number="minAmount" 
              :placeholder="t({ id: 'Nominal Min', en: 'Min Amount', ja: '最小金額', es: 'Monto Mínimo' })" 
              type="number" 
              min="0" 
              :step="getDynamicStep(minAmount)"
              @keydown="handleNominalKeydown"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
            <input 
              v-model.number="maxAmount" 
              :placeholder="t({ id: 'Nominal Max', en: 'Max Amount', ja: '最大金額', es: 'Monto Máximo' })" 
              type="number" 
              min="0" 
              :step="getDynamicStep(maxAmount)"
              @keydown="handleNominalKeydown"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </div>
          <div class="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Dari Tanggal', en: 'From Date', ja: '開始日', es: 'Desde Fecha' }) }}
              <input
                :value="globalDateFilter.start"
                type="date"
                class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all"
                @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Sampai Tanggal', en: 'To Date', ja: '終了日', es: 'Hasta Fecha' }) }}
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
              {{ t({ id: 'Reset', en: 'Reset', ja: 'リセット', es: 'Restablecer' }) }}
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
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.note || t({ id: 'Tanpa catatan', en: 'No note', ja: 'メモなし', es: 'Sin nota' }) }} • {{ item.date }}</p>
            </div>
            <div class="flex items-center gap-3.5 shrink-0">
              <span :class="item.type === 'income' ? 'text-success' : 'text-danger'" class="text-sm font-bold">
                {{ item.type === 'income' ? '+' : '-' }} {{ formatMoney(item.amount) }}
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
            {{ t({ id: 'Tidak ada transaksi ditemukan.', en: 'No transactions found.', ja: '取引が見つかりませんでした。', es: 'No se encontraron transacciones.' }) }}
          </li>
        </ul>

        <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button class="px-4 py-2 rounded-xl text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === 1" @click="currentPage--">{{ t({ id: 'Sebelumnya', en: 'Previous', ja: '前へ', es: 'Anterior' }) }}</button>
          <span class="text-xs font-semibold text-muted">{{ t({ id: `Halaman ${currentPage} dari ${totalPages}`, en: `Page ${currentPage} of ${totalPages}`, ja: `ページ ${currentPage} / ${totalPages}`, es: `Página ${currentPage} de ${totalPages}` }) }}</span>
          <button class="px-4 py-2 rounded-xl text-xs font-bold text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" :disabled="currentPage === totalPages" @click="currentPage++">{{ t({ id: 'Selanjutnya', en: 'Next', ja: '次へ', es: 'Siguiente' }) }}</button>
        </div>
      </section>
    </div>

    <div v-if="appMode === 'advance'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Transaksi Rutin', en: 'Recurring Transactions', ja: '定期的な取引', es: 'Transacciones Recurrentes' }) }}</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Judul', en: 'Title', ja: 'タイトル', es: 'Título' }) }}
            <input v-model="recurringForm.title" :placeholder="t({ id: 'Contoh: Gaji Bulanan', en: 'e.g., Monthly Salary', ja: '例: 毎月の給与', es: 'ej. Salario Mensual' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Jenis', en: 'Type', ja: '種類', es: 'Tipo' }) }}
            <select v-model="recurringForm.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all">
              <option value="income">{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}</option>
              <option value="expense">{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Kategori', en: 'Category', ja: 'カテゴリー', es: 'Categoría' }) }}
            <input v-model="recurringForm.category" :placeholder="t({ id: 'Contoh: Tagihan', en: 'e.g., Bill', ja: '例: 請求書', es: 'ej. Factura' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nominal', en: 'Amount', ja: '金額', es: 'Monto' }) }}
            <input 
              v-model="recurringForm.amount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(recurringForm.amount)"
              @keydown="handleNominalKeydown"
              placeholder="350000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Tanggal setiap bulan', en: 'Day of month', ja: '毎月の日付', es: 'Día del mes' }) }}
            <input v-model="recurringForm.dayOfMonth" type="number" min="1" max="28" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Catatan', en: 'Note', ja: 'メモ', es: 'Nota' }) }}
            <input v-model="recurringForm.note" :placeholder="t({ id: 'Catatan transaksi rutin', en: 'Recurring transaction note', ja: '定期的な取引のメモ', es: 'Nota de transacción recurrente' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitRecurring">{{ t({ id: 'Tambah Transaksi Rutin', en: 'Add Recurring Transaction', ja: '定期的な取引の追加', es: 'Agregar Transacción Recurrente' }) }}</button>
      </section>

      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Jadwal Transaksi Rutin', en: 'Recurring Schedule', ja: '定期スケジュール', es: 'Horario Recurrente' }) }}</h2>
        <div class="flex flex-col gap-3">
          <article v-for="item in upcomingRecurring" :key="item.id" class="flex justify-between items-center gap-4 pb-3.5 border-b border-border last:border-0 last:pb-0">
            <div>
              <strong class="text-sm font-bold text-text">{{ item.title }}</strong>
              <p class="text-xs text-muted font-semibold mt-0.5">{{ item.category }} • {{ t({ id: 'Tanggal', en: 'Date', ja: '日付', es: 'Fecha' }) }} {{ item.dayOfMonth }} • {{ formatMoney(item.amount) }}</p>
              <p class="text-[10px] text-muted font-bold mt-1 inline-block px-2 py-0.5 bg-surface-2 rounded-md border border-border">{{ item.isApplied ? t({ id: 'Sudah diterapkan bulan ini', en: 'Applied this month', ja: '今月適用済み', es: 'Aplicado este mes' }) : t({ id: 'Belum diterapkan', en: 'Not applied yet', ja: '未適用', es: 'No aplicado aún' }) }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button class="px-3.5 py-1.5 rounded-full text-xs font-bold text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm" type="button" @click="applyRecurringTransaction(item.id)">{{ t({ id: 'Terapkan', en: 'Apply', ja: '適用', es: 'Aplicar' }) }}</button>
              <button class="px-3 py-1.5 rounded-full text-xs font-bold text-danger-text bg-danger-soft hover:opacity-90 transition-all cursor-pointer border-none flex items-center gap-1" type="button" @click="deleteRecurringTransaction(item.id)">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
            </div>
          </article>
          <p v-if="!recurringTransactions.length" class="text-center py-8 text-xs text-muted font-semibold">{{ t({ id: 'Belum ada transaksi rutin.', en: 'No recurring transactions yet.', ja: '定期的な取引はまだありません。', es: 'Aún no hay transacciones recurrentes.' }) }}</p>
        </div>
      </section>
    </div>

    <section v-if="appMode === 'advance'" class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Kategori Aktif', en: 'Active Categories', ja: '有効なカテゴリー', es: 'Categorías Activas' }) }}</h2>
      <p class="text-xs text-muted font-medium -mt-2">{{ t({ id: 'Kategori ditambahkan otomatis saat transaksi baru disimpan, atau bisa dikelola secara mendetail dari Settings.', en: 'Categories are automatically added when a new transaction is saved, or can be managed in detail from Settings.', ja: 'カテゴリーは新しい取引が保存されたときに自动的に追加されるか、設定から詳細に管理できます。', es: 'Las categorías se agregan automáticamente cuando se guarda una nueva transacción o se pueden administrar en detalle desde Ajustes.' }) }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-1">
        <div>
          <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-3">{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}</h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="item in categories.filter((category) => category.type === 'income')" :key="item.id" class="px-3 py-1.5 rounded-full text-xs font-semibold text-primary bg-primary-soft">
              {{ item.name }}
            </span>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-bold text-muted uppercase tracking-wider mb-3">{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}</h3>
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
