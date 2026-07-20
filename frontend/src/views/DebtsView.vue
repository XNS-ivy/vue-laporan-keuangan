<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'
import { getDynamicStep, handleNominalKeydown, t, formatMoney, appMode } from '../composables/useUserSettings'

const { 
  debts, 
  totalDebt, 
  totalReceivable, 
  addDebt, 
  toggleDebtStatus, 
  updateDebt,
  deleteDebt 
} = useFinance()

const form = ref({
  name: '',
  counterpart: '',
  amount: '',
  dueDate: '',
  kind: 'debt' as 'debt' | 'receivable',
})

const submitDebt = () => {
  addDebt({
    name: form.value.name,
    counterpart: form.value.counterpart,
    amount: Number(form.value.amount),
    dueDate: form.value.dueDate,
    kind: form.value.kind,
  })
  form.value = { name: '', counterpart: '', amount: '', dueDate: '', kind: 'debt' }
}

// Search and Filter states
const searchQuery = ref('')
const kindFilter = ref('all')
const statusFilter = ref('all')

const filteredDebts = computed(() => {
  return debts.value.filter((item) => {
    const text = searchQuery.value.toLowerCase()
    const matchSearch = item.name.toLowerCase().includes(text) || item.counterpart.toLowerCase().includes(text)
    const matchKind = kindFilter.value === 'all' || item.kind === kindFilter.value
    const matchStatus = statusFilter.value === 'all' || item.status === statusFilter.value
    return matchSearch && matchKind && matchStatus
  })
})

// Edit Modal states
const showEditModal = ref(false)
const selectedDebt = ref<any>(null)
const editForm = ref({
  name: '',
  counterpart: '',
  amount: 0,
  dueDate: '',
  kind: 'debt' as 'debt' | 'receivable',
  status: 'open' as 'open' | 'paid'
})

const openEditModal = (item: any) => {
  selectedDebt.value = item
  editForm.value = {
    name: item.name,
    counterpart: item.counterpart,
    amount: item.amount,
    dueDate: item.dueDate,
    kind: item.kind,
    status: item.status
  }
  showEditModal.value = true
}

const saveDebtChanges = () => {
  if (!selectedDebt.value) return
  updateDebt(selectedDebt.value.id, {
    name: editForm.value.name,
    counterpart: editForm.value.counterpart,
    amount: Number(editForm.value.amount),
    dueDate: editForm.value.dueDate,
    kind: editForm.value.kind,
    status: editForm.value.status
  })
  showEditModal.value = false
  selectedDebt.value = null
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-xs text-muted font-bold">{{ t({ id: 'Utang & Piutang', en: 'Debts & Receivables', ja: '負債と債権', es: 'Deudas y Cuentas por Cobrar' }) }}</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">{{ t({ id: 'Lacak Utang, Piutang, & Tagihanmu', en: 'Track Your Debts, Receivables, & Bills', ja: '負債、債権、請求書を追跡しましょう', es: 'Realice un Seguimiento de sus Deudas, Cuentas por Cobrar y Facturas' }) }}</h1>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <span class="px-4 py-2 rounded-full text-xs font-bold text-danger-text bg-danger-soft border border-danger/10 shadow-xs">
          {{ t({ id: 'Utang', en: 'Debt', ja: '負債', es: 'Deuda' }) }}: {{ formatMoney(totalDebt) }}
        </span>
        <span class="px-4 py-2 rounded-full text-xs font-bold text-success bg-emerald-600/10 border border-emerald-600/10 shadow-xs">
          {{ t({ id: 'Piutang', en: 'Receivable', ja: '債権', es: 'Cuenta por Cobrar' }) }}: {{ formatMoney(totalReceivable) }}
        </span>
      </div>
    </header>

    <!-- Bar Pencarian & Filter Utang-Piutang -->
    <div v-if="appMode === 'advance'" class="bg-surface border border-border rounded-2xl p-4.5 shadow-custom flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="relative w-full md:max-w-md">
        <input 
          v-model="searchQuery" 
          :placeholder="t({ id: 'Cari berdasarkan judul atau nama orang...', en: 'Search by title or counterpart...', ja: 'タイトルまたは名前で検索...', es: 'Buscar por título o contraparte...' })" 
          class="w-full border border-border rounded-xl pl-9.5 pr-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60"
        />
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>
      
      <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <div class="flex items-center gap-2 grow sm:grow-0">
          <label class="text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">{{ t({ id: 'Tipe', en: 'Type', ja: 'タイプ', es: 'Tipo' }) }}:</label>
          <select 
            v-model="kindFilter" 
            class="w-full sm:w-32 border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="all">{{ t({ id: 'Semua Tipe', en: 'All Types', ja: 'すべてのタイプ', es: 'Todos los Tipos' }) }}</option>
            <option value="debt">{{ t({ id: 'Utang', en: 'Debt', ja: '負債', es: 'Deuda' }) }}</option>
            <option value="receivable">{{ t({ id: 'Piutang', en: 'Receivable', ja: '債権', es: 'Cuenta por Cobrar' }) }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 grow sm:grow-0">
          <label class="text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">{{ t({ id: 'Status', en: 'Status', ja: 'ステータス', es: 'Estado' }) }}:</label>
          <select 
            v-model="statusFilter" 
            class="w-full sm:w-36 border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="all">{{ t({ id: 'Semua Status', en: 'All Statuses', ja: 'すべてのステータス', es: 'Todos los Estados' }) }}</option>
            <option value="open">{{ t({ id: 'Belum Lunas', en: 'Unpaid', ja: '未清算', es: 'No Pagado' }) }}</option>
            <option value="paid">{{ t({ id: 'Lunas', en: 'Paid', ja: '清算済み', es: 'Pagado' }) }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Section Form Tambah Catatan -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Tambah Catatan Utang/Piutang', en: 'Add Debt/Receivable Note', ja: '負債/債権のメモを追加', es: 'Agregar Nota de Deuda/Cuenta por Cobrar' }) }}</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Judul Catatan', en: 'Note Title', ja: 'メモのタイトル', es: 'Título de la Nota' }) }}
            <input v-model="form.name" :placeholder="t({ id: 'Contoh: Pinjaman Kas Kecil', en: 'e.g., Petty Cash Loan', ja: '例: 小口現金のローン', es: 'ej. Préstamo de Caja Chica' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Jenis Catatan', en: 'Note Type', ja: 'メモのタイプ', es: 'Tipo de Nota' }) }}
            <select v-model="form.kind" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
              <option value="debt">{{ t({ id: 'Utang (Saya berutang ke orang lain)', en: 'Debt (I owe someone)', ja: '負債 (借入)', es: 'Deuda (Le debo a alguien)' }) }}</option>
              <option value="receivable">{{ t({ id: 'Piutang (Orang lain berutang ke saya)', en: 'Receivable (Someone owes me)', ja: '債権 (貸出)', es: 'Cuenta por Cobrar (Alguien me debe)' }) }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nama Pihak Terkait (Orang/Instansi)', en: 'Counterpart Name (Person/Company)', ja: '関係者の名前 (個人/企業)', es: 'Nombre de la Contraparte (Persona/Instancia)' }) }}
            <input v-model="form.counterpart" :placeholder="t({ id: 'Contoh: Rian', en: 'e.g., John', ja: '例: ジョン', es: 'ej. Juan' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nominal', en: 'Amount', ja: '金額', es: 'Monto' }) }}
            <input 
              v-model="form.amount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(form.amount)"
              @keydown="handleNominalKeydown"
              placeholder="1000000" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" 
            />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Tanggal Jatuh Tempo', en: 'Due Date', ja: '期日', es: 'Fecha de Vencimiento' }) }}
            <input v-model="form.dueDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitDebt">
          {{ t({ id: 'Simpan Catatan', en: 'Save Note', ja: 'メモを保存', es: 'Guardar Nota' }) }}
        </button>
      </section>

      <!-- Section Daftar Kewajiban -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3 flex justify-between items-center">
          <span>{{ t({ id: 'Daftar Kewajiban & Tagihan', en: 'Obligations & Bills List', ja: '負債と請求書の一覧', es: 'Lista de Obligaciones y Facturas' }) }}</span>
          <span class="text-xs text-muted font-semibold italic">{{ t({ id: 'Ubah detail dengan klik item', en: 'Click item to edit details', ja: 'クリックして詳細を編集', es: 'Haga clic en el elemento para editar los detalles' }) }}</span>
        </h2>
        
        <div class="max-h-125 overflow-y-auto pr-1 flex flex-col gap-3">
          <article 
            v-for="item in filteredDebts" 
            :key="item.id" 
            class="flex justify-between items-center gap-4 p-3 border border-border rounded-xl bg-surface hover:bg-slate-500/5 transition-all cursor-pointer group"
            @click="openEditModal(item)"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base">
                  <svg v-if="item.kind === 'debt'" class="w-4 h-4 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  <svg v-else class="w-4 h-4 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </span>
                <strong class="text-sm font-bold text-text group-hover:text-primary transition-colors">
                  {{ item.name }}
                </strong>
              </div>
              <p class="text-xs text-muted font-semibold mt-1">
                <span :class="item.kind === 'debt' ? 'text-danger' : 'text-success'">
                  {{ item.kind === 'debt' ? t({ id: 'Utang ke', en: 'Owe to', ja: '借入先:', es: 'Deuda a' }) : t({ id: 'Piutang dari', en: 'Owed by', ja: '貸出先:', es: 'Cuentas por cobrar de' }) }}
                </span> 
                {{ item.counterpart }}
              </p>
              <p class="text-xs text-muted font-semibold mt-0.5">
                {{ formatMoney(item.amount) }} 
                <span v-if="item.dueDate" class="text-slate-500 font-bold ml-1.5">
                  • {{ t({ id: 'Tempo', en: 'Due', ja: '期限', es: 'Vence' }) }}: {{ item.dueDate }}
                </span>
              </p>
            </div>
            
            <div class="flex items-center gap-2 shrink-0" @click.stop>
              <span 
                class="px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider border select-none" 
                :class="item.status === 'open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : 'bg-emerald-600/10 text-success border-success/10'"
              >
                {{ item.status === 'open' ? t({ id: 'Belum lunas', en: 'Unpaid', ja: '未清算', es: 'No pagado' }) : t({ id: 'Lunas', en: 'Paid', ja: '清算済み', es: 'Pagado' }) }}
              </span>
              
              <button 
                class="px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary-soft hover:scale-105 active:scale-95 transition-all cursor-pointer border-none" 
                type="button" 
                @click="toggleDebtStatus(item.id)"
                :title="item.status === 'open' ? t({ id: 'Lunas', en: 'Paid', ja: '清算済み', es: 'Pagado' }) : t({ id: 'Batal', en: 'Cancel', ja: 'キャンセル', es: 'Cancelar' })"
              >
                {{ item.status === 'open' ? t({ id: 'Lunas', en: 'Paid', ja: '清算済み', es: 'Pagado' }) : t({ id: 'Batal', en: 'Cancel', ja: 'キャンセル', es: 'Cancelar' }) }}
              </button>
              
              <button 
                class="px-2.5 py-2.5 rounded-xl text-xs font-bold text-danger-text bg-danger-soft hover:scale-105 active:scale-95 transition-all cursor-pointer border-none flex items-center" 
                type="button" 
                @click="deleteDebt(item.id)"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          </article>
          
          <p v-if="!filteredDebts.length" class="text-center py-10 text-xs text-muted font-semibold">
            {{ t({ id: 'Tidak ada catatan utang/piutang ditemukan.', en: 'No debt or receivable notes found.', ja: '負債または債権のメモは見つかりませんでした。', es: 'No se encontraron notas de deudas o cuentas por cobrar.' }) }}
          </p>
        </div>
      </section>
    </div>

    <!-- MODAL EDIT DETAIL UTANG / PIUTANG -->
    <div 
      v-if="showEditModal && selectedDebt" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      @click.self="showEditModal = false"
    >
      <div class="bg-surface border border-border rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <!-- Modal Header -->
        <header class="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div>
            <span class="text-xs font-bold text-primary uppercase tracking-widest">{{ t({ id: 'Detail & Koreksi Data', en: 'Details & Correction', ja: '詳細とデータ修正', es: 'Detalles y Corrección de Datos' }) }}</span>
            <h3 class="text-base font-extrabold text-text mt-0.5">{{ t({ id: 'Ubah Rincian Catatan', en: 'Edit Note Details', ja: 'メモ詳細の編集', es: 'Editar Detalles de la Nota' }) }}</h3>
          </div>
          <button 
            class="text-muted hover:text-text text-lg font-bold border-none bg-transparent cursor-pointer"
            @click="showEditModal = false"
          >
            ✕
          </button>
        </header>

        <!-- Modal Form Body -->
        <div class="p-6 flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Judul Catatan', en: 'Note Title', ja: 'メモのタイトル', es: 'Título de la Nota' }) }}
            <input v-model="editForm.name" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Jenis Catatan', en: 'Note Type', ja: 'メモのタイプ', es: 'Tipo de Nota' }) }}
            <select v-model="editForm.kind" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
              <option value="debt">{{ t({ id: 'Utang (Saya berutang ke orang lain)', en: 'Debt (I owe someone)', ja: '負債 (借入)', es: 'Deuda (Le debo a alguien)' }) }}</option>
              <option value="receivable">{{ t({ id: 'Piutang (Orang lain berutang ke saya)', en: 'Receivable (Someone owes me)', ja: '債権 (貸出)', es: 'Cuenta por Cobrar (Alguien me debe)' }) }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nama Pihak Terkait (Orang/Instansi)', en: 'Counterpart Name (Person/Company)', ja: '関係者の名前 (個人/企業)', es: 'Nombre de la Contraparte (Persona/Instancia)' }) }}
            <input v-model="editForm.counterpart" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nominal', en: 'Amount', ja: '金額', es: 'Monto' }) }}
            <input 
              v-model="editForm.amount" 
              type="number" 
              min="0" 
              :step="getDynamicStep(editForm.amount)"
              @keydown="handleNominalKeydown"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all" 
            />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Tanggal Jatuh Tempo', en: 'Due Date', ja: '期日', es: 'Fecha de Vencimiento' }) }}
            <input v-model="editForm.dueDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Status Pelunasan', en: 'Payment Status', ja: '清算ステータス', es: 'Estado de Pago' }) }}
            <select v-model="editForm.status" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
              <option value="open">{{ t({ id: 'Belum Lunas', en: 'Unpaid', ja: '未清算', es: 'No Pagado' }) }}</option>
              <option value="paid">{{ t({ id: 'Lunas', en: 'Paid', ja: '清算済み', es: 'Pagado' }) }}</option>
            </select>
          </label>

          <button 
            class="w-full mt-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
            @click="saveDebtChanges"
          >
            {{ t({ id: 'Simpan Perubahan', en: 'Save Changes', ja: '変更を保存', es: 'Guardar Cambios' }) }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
