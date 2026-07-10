<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFinance } from '../composables/useFinance'

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
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Utang & Piutang</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Lacak Utang, Piutang, & Tagihanmu</h1>
      </div>
      <div class="flex flex-wrap gap-2 shrink-0">
        <span class="px-4 py-2 rounded-full text-xs font-bold text-danger-text bg-danger-soft border border-danger/10 shadow-xs">
          Utang: Rp {{ totalDebt.toLocaleString('id-ID') }}
        </span>
        <span class="px-4 py-2 rounded-full text-xs font-bold text-success bg-emerald-600/10 border border-emerald-600/10 shadow-xs">
          Piutang: Rp {{ totalReceivable.toLocaleString('id-ID') }}
        </span>
      </div>
    </header>

    <!-- Bar Pencarian & Filter Utang-Piutang -->
    <div class="bg-surface border border-border rounded-2xl p-4.5 shadow-custom flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="relative w-full md:max-w-md">
        <input 
          v-model="searchQuery" 
          placeholder="Cari berdasarkan judul atau nama orang..." 
          class="w-full border border-border rounded-xl pl-9.5 pr-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60"
        />
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted select-none text-sm">🔍</span>
      </div>
      
      <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
        <div class="flex items-center gap-2 grow sm:grow-0">
          <label class="text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">Tipe:</label>
          <select 
            v-model="kindFilter" 
            class="w-full sm:w-32 border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="all">Semua Tipe</option>
            <option value="debt">Utang 💸</option>
            <option value="receivable">Piutang 💰</option>
          </select>
        </div>

        <div class="flex items-center gap-2 grow sm:grow-0">
          <label class="text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">Status:</label>
          <select 
            v-model="statusFilter" 
            class="w-full sm:w-36 border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-semibold focus:outline-none transition-all"
          >
            <option value="all">Semua Status</option>
            <option value="open">Belum Lunas ⏳</option>
            <option value="paid">Lunas ✅</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Section Form Tambah Catatan -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Tambah Catatan Utang/Piutang</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Judul Catatan
            <input v-model="form.name" placeholder="Contoh: Pinjaman Kas Kecil" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jenis Catatan
            <select v-model="form.kind" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
              <option value="debt">Utang (Saya berutang ke orang lain) 💸</option>
              <option value="receivable">Piutang (Orang lain berutang ke saya) 💰</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nama Pihak Terkait (Orang/Instansi)
            <input v-model="form.counterpart" placeholder="Contoh: Rian" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal
            <input v-model="form.amount" type="number" min="0" placeholder="1000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="sm:col-span-2 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tanggal Jatuh Tempo
            <input v-model="form.dueDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" type="button" @click="submitDebt">
          Simpan Catatan
        </button>
      </section>

      <!-- Section Daftar Kewajiban -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3 flex justify-between items-center">
          <span>Daftar Kewajiban & Tagihan</span>
          <span class="text-xs text-muted font-semibold italic">Ubah detail dengan klik item</span>
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
                  {{ item.kind === 'debt' ? '💸' : '💰' }}
                </span>
                <strong class="text-sm font-bold text-text group-hover:text-primary transition-colors">
                  {{ item.name }}
                </strong>
              </div>
              <p class="text-xs text-muted font-semibold mt-1">
                <span :class="item.kind === 'debt' ? 'text-danger' : 'text-success'">
                  {{ item.kind === 'debt' ? 'Utang ke' : 'Piutang dari' }}
                </span> 
                {{ item.counterpart }}
              </p>
              <p class="text-xs text-muted font-semibold mt-0.5">
                Rp {{ item.amount.toLocaleString('id-ID') }} 
                <span v-if="item.dueDate" class="text-slate-500 font-bold ml-1.5">
                  • Tempo: {{ item.dueDate }}
                </span>
              </p>
            </div>
            
            <div class="flex items-center gap-2 shrink-0" @click.stop>
              <span 
                class="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border select-none" 
                :class="item.status === 'open' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' : 'bg-emerald-600/10 text-success border-success/10'"
              >
                {{ item.status === 'open' ? '⏳ Belum lunas' : '✅ Lunas' }}
              </span>
              
              <button 
                class="px-3 py-1.5 rounded-xl text-[10px] font-bold text-primary bg-primary-soft hover:scale-105 active:scale-95 transition-all cursor-pointer border-none" 
                type="button" 
                @click="toggleDebtStatus(item.id)"
                :title="item.status === 'open' ? 'Tandai lunas' : 'Tandai belum lunas'"
              >
                {{ item.status === 'open' ? 'Lunas' : 'Batal' }}
              </button>
              
              <button 
                class="px-2.5 py-2.5 rounded-xl text-xs font-bold text-danger-text bg-danger-soft hover:scale-105 active:scale-95 transition-all cursor-pointer border-none" 
                type="button" 
                @click="deleteDebt(item.id)"
              >
                🗑️
              </button>
            </div>
          </article>
          
          <p v-if="!filteredDebts.length" class="text-center py-10 text-xs text-muted font-semibold">
            Tidak ada catatan utang/piutang ditemukan.
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
            <span class="text-[10px] font-bold text-primary uppercase tracking-widest">Detail & Koreksi Data</span>
            <h3 class="text-base font-extrabold text-text mt-0.5">Ubah Rincian Catatan</h3>
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
            Judul Catatan
            <input v-model="editForm.name" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jenis Catatan
            <select v-model="editForm.kind" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
              <option value="debt">Utang (Saya berutang ke orang lain)</option>
              <option value="receivable">Piutang (Orang lain berutang ke saya)</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Pihak Terkait (Orang/Instansi)
            <input v-model="editForm.counterpart" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal Pinjaman (Rp)
            <input v-model="editForm.amount" type="number" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jatuh Tempo
            <input v-model="editForm.dueDate" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Status Pelunasan
            <select v-model="editForm.status" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
              <option value="open">⏳ Belum Lunas</option>
              <option value="paid">✅ Lunas</option>
            </select>
          </label>

          <button 
            class="w-full mt-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
            @click="saveDebtChanges"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
