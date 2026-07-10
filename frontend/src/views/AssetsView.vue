<script setup lang="ts">
import { computed, ref } from 'vue'
import FinanceChart from '../components/FinanceChart.vue'
import { useFinance } from '../composables/useFinance'

const { 
  assets, 
  addAsset, 
  updateAsset, 
  adjustAssetValue, 
  deleteAssetAdjustment, 
  assetGrowthTrend, 
  deleteAsset, 
  totalAssets 
} = useFinance()

const form = ref({ name: '', amount: '', type: 'cash' as 'cash' | 'bank' | 'investment', date: new Date().toISOString().slice(0, 10) })

const submitAsset = () => {
  addAsset({ name: form.value.name, amount: Number(form.value.amount), type: form.value.type, date: form.value.date })
  form.value = { name: '', amount: '', type: 'cash', date: new Date().toISOString().slice(0, 10) }
}

// Search and Filter states
const searchQuery = ref('')
const typeFilter = ref('all')

const filteredAssets = computed(() => {
  return assets.value.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchType = typeFilter.value === 'all' || item.type === typeFilter.value
    return matchSearch && matchType
  })
})

const totalByType = computed(() => {
  const grouped = new Map<string, number>()
  assets.value.forEach((item) => grouped.set(item.type, (grouped.get(item.type) || 0) + item.amount))
  return Array.from(grouped.entries())
})

// Modal states
const showModal = ref(false)
const selectedAsset = ref<any>(null)

// Edit asset form state
const editForm = ref({
  name: '',
  type: 'cash' as 'cash' | 'bank' | 'investment',
  initialAmount: 0,
  date: ''
})

// Adjustment form state
const adjustmentForm = ref({
  type: 'depreciation' as 'appreciation' | 'depreciation',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  recordAsTransaction: true
})

const openAssetDetail = (item: any) => {
  selectedAsset.value = item
  editForm.value = {
    name: item.name,
    type: item.type,
    initialAmount: item.initialAmount ?? item.amount,
    date: item.date
  }
  // Reset adjustment form
  adjustmentForm.value = {
    type: 'depreciation',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
    recordAsTransaction: true
  }
  showModal.value = true
}

const saveAssetChanges = () => {
  if (!selectedAsset.value) return
  updateAsset(selectedAsset.value.id, {
    name: editForm.value.name,
    type: editForm.value.type,
    initialAmount: Number(editForm.value.initialAmount),
    date: editForm.value.date
  })
  // Sync selectedAsset reference with updated data
  const updated = assets.value.find((a) => a.id === selectedAsset.value.id)
  if (updated) selectedAsset.value = updated
}

const submitAdjustment = () => {
  if (!selectedAsset.value) return
  const success = adjustAssetValue(
    selectedAsset.value.id,
    {
      type: adjustmentForm.value.type,
      amount: Number(adjustmentForm.value.amount),
      date: adjustmentForm.value.date,
      note: adjustmentForm.value.note
    },
    adjustmentForm.value.recordAsTransaction
  )
  
  if (success) {
    // Refresh modal selected asset
    const updated = assets.value.find((a) => a.id === selectedAsset.value.id)
    if (updated) selectedAsset.value = updated
    
    // Clear form fields
    adjustmentForm.value.amount = ''
    adjustmentForm.value.note = ''
  }
}

const deleteAdjustment = (adjId: number) => {
  if (!selectedAsset.value) return
  const success = deleteAssetAdjustment(selectedAsset.value.id, adjId)
  if (success) {
    const updated = assets.value.find((a) => a.id === selectedAsset.value.id)
    if (updated) selectedAsset.value = updated
  }
}

const formatAssetType = (type: string) => {
  switch (type) {
    case 'cash': return 'Tunai 💵'
    case 'bank': return 'Bank 🏦'
    case 'investment': return 'Investasi 📈'
    default: return type
  }
}

const assetGrowthChartData = computed(() => ({
  labels: assetGrowthTrend.value.map(([month]) => month),
  datasets: [
    {
      label: 'Pertumbuhan Aset',
      data: assetGrowthTrend.value.map(([, amount]) => amount),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      fill: true,
      tension: 0.3,
    },
  ],
}))
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">Aset</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">Pantau nilai & pertumbuhan aset Anda</h1>
      </div>
      <div class="px-4.5 py-2.5 rounded-full text-sm font-bold text-success bg-emerald-600/10 border border-emerald-600/10 shrink-0">
        Total: Rp {{ totalAssets.toLocaleString('id-ID') }}
      </div>
    </header>

    <!-- Bar Pencarian & Penyaringan -->
    <div class="bg-surface border border-border rounded-2xl p-4.5 shadow-custom flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="relative w-full sm:max-w-xs">
        <input 
          v-model="searchQuery" 
          placeholder="Cari nama aset..." 
          class="w-full border border-border rounded-xl pl-9.5 pr-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60"
        />
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted select-none text-sm">🔍</span>
      </div>
      
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <label class="text-xs font-bold text-muted uppercase tracking-wider whitespace-nowrap">Filter Tipe:</label>
        <select 
          v-model="typeFilter" 
          class="w-full sm:w-44 border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all"
        >
          <option value="all">Semua Tipe</option>
          <option value="cash">Tunai</option>
          <option value="bank">Bank</option>
          <option value="investment">Investasi</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Section Tambah Aset -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Tambah Aset Baru</h2>
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nama Aset
            <input v-model="form.name" placeholder="Contoh: Logam Mulia" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal Awal
            <input v-model="form.amount" type="number" min="0" placeholder="2000000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all placeholder:text-muted/60" />
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tipe
            <select v-model="form.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
              <option value="cash">Tunai</option>
              <option value="bank">Bank</option>
              <option value="investment">Investasi</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tanggal Perolehan
            <input v-model="form.date" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all" />
          </label>
        </div>
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 self-start" @click="submitAsset">
          Tambah Aset
        </button>
      </section>

      <!-- Section Ringkasan & Daftar Detail Aset -->
      <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
        <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Ringkasan & Daftar Aset</h2>
        
        <ul class="flex flex-col gap-3">
          <li v-for="item in totalByType" :key="item[0]" class="flex justify-between items-center gap-4 pb-2 border-b border-border last:border-0 last:pb-0">
            <strong class="text-sm font-bold text-muted uppercase tracking-wider">{{ formatAssetType(item[0]) }}</strong>
            <span class="text-sm font-extrabold text-text">Rp {{ item[1].toLocaleString('id-ID') }}</span>
          </li>
        </ul>
        
        <h3 class="text-xs font-bold text-muted uppercase tracking-wider border-t border-border pt-4 mt-2 mb-1 flex items-center justify-between">
          <span>Daftar Rincian (Klik untuk Edit/Penyusutan)</span>
          <span class="text-[10px] text-primary lowercase normal-case italic font-semibold">interactive mode *</span>
        </h3>
        
        <div class="max-h-96 overflow-y-auto pr-1">
          <ul class="flex flex-col gap-2.5">
            <li 
              v-for="item in filteredAssets" 
              :key="item.id" 
              class="flex justify-between items-center gap-4 p-3 border border-border bg-surface hover:bg-slate-500/5 rounded-xl transition-all cursor-pointer group"
              @click="openAssetDetail(item)"
            >
              <div>
                <strong class="text-sm font-bold text-text group-hover:text-primary transition-colors">{{ item.name }}</strong>
                <p class="text-xs text-muted font-semibold mt-0.5">{{ formatAssetType(item.type) }} • {{ item.date }}</p>
                <div v-if="item.adjustments && item.adjustments.length" class="flex gap-1.5 mt-1.5">
                  <span class="text-[9px] px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-500 font-bold flex items-center gap-0.5">
                    ⚙️ {{ item.adjustments.length }} Penyesuaian
                  </span>
                </div>
              </div>
              
              <div class="flex items-center gap-3 shrink-0" @click.stop>
                <span class="text-sm font-extrabold text-text">Rp {{ item.amount.toLocaleString('id-ID') }}</span>
                <button 
                  class="px-2.5 py-2.5 rounded-xl text-xs font-bold text-danger-text bg-danger-soft hover:scale-105 active:scale-95 transition-all cursor-pointer border-none" 
                  @click="deleteAsset(item.id)"
                  title="Hapus aset"
                >
                  🗑️
                </button>
              </div>
            </li>
            
            <li v-if="!filteredAssets.length" class="text-center py-8 text-xs text-muted font-semibold">
              Tidak ada aset ditemukan.
            </li>
          </ul>
        </div>
      </section>
    </div>

    <FinanceChart type="line" title="Tren Pertumbuhan Nilai Aset" :data="assetGrowthChartData" />

    <!-- MODAL INTERAKTIF: EDIT & PENYESUAIAN ASET -->
    <div 
      v-if="showModal && selectedAsset" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      @click.self="showModal = false"
    >
      <div class="bg-surface border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <!-- Modal Header -->
        <header class="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div>
            <span class="text-[10px] font-bold text-primary uppercase tracking-widest">Detail & Penyesuaian Nilai</span>
            <h3 class="text-base font-extrabold text-text mt-0.5">{{ selectedAsset.name }}</h3>
          </div>
          <button 
            class="text-muted hover:text-text text-lg font-bold border-none bg-transparent cursor-pointer"
            @click="showModal = false"
          >
            ✕
          </button>
        </header>

        <!-- Modal Body (Two Column Layout) -->
        <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 leading-relaxed">
          
          <!-- Column Left: Edit Detail (Span 5) -->
          <div class="md:col-span-5 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
            <h4 class="text-sm font-bold text-text uppercase tracking-tight flex items-center gap-1.5">
              <span>✏️</span> Edit Informasi Aset
            </h4>
            
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Nama Aset
              <input v-model="editForm.name" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
            </label>

            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Tipe Aset
              <select v-model="editForm.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
                <option value="cash">Tunai</option>
                <option value="bank">Bank</option>
                <option value="investment">Investasi</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Nilai Awal Aset (Rp)
              <input v-model="editForm.initialAmount" type="number" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
            </label>

            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              Tanggal Perolehan Awal
              <input v-model="editForm.date" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all" />
            </label>

            <div class="mt-2 bg-slate-500/5 border border-border rounded-xl p-3.5 flex flex-col gap-1">
              <span class="text-[10px] font-bold text-muted uppercase tracking-wide">Kalkulasi Nilai Saat Ini</span>
              <div class="flex justify-between items-baseline mt-1">
                <span class="text-xs text-muted">Nilai Bersih:</span>
                <span class="text-base font-extrabold text-primary">Rp {{ selectedAsset.amount.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <button 
              class="w-full mt-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
              @click="saveAssetChanges"
            >
              Simpan Perubahan
            </button>
          </div>

          <!-- Column Right: Depreciation / Appreciation Adjustments (Span 7) -->
          <div class="md:col-span-7 flex flex-col gap-5">
            <!-- Form Adjustment -->
            <div class="flex flex-col gap-3.5 bg-slate-500/5 border border-border rounded-2xl p-4.5">
              <h4 class="text-sm font-bold text-text uppercase tracking-tight flex items-center gap-1.5">
                <span>🔄</span> Catat Penyesuaian Nilai (Apresiasi / Penyusutan)
              </h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1.5">
                <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                  Jenis Penyesuaian
                  <select v-model="adjustmentForm.type" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-semibold focus:outline-none transition-all">
                    <option value="depreciation">Penyusutan (Menyusut 📉)</option>
                    <option value="appreciation">Apresiasi (Mengembang 📈)</option>
                  </select>
                </label>
                
                <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                  Nominal Penyesuaian (Rp)
                  <input v-model="adjustmentForm.amount" type="number" placeholder="Contoh: 100000" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-medium focus:outline-none transition-all" />
                </label>

                <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                  Tanggal
                  <input v-model="adjustmentForm.date" type="date" class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-medium focus:outline-none transition-all" />
                </label>

                <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
                  Keterangan / Catatan
                  <input v-model="adjustmentForm.note" placeholder="Penyusutan bulanan, dsb." class="w-full border border-border rounded-xl px-3 py-2 bg-surface-2 text-text text-xs font-medium focus:outline-none transition-all" />
                </label>
              </div>

              <!-- Transaksi Checkbox -->
              <label class="flex items-center gap-2 mt-1.5 text-xs font-semibold text-text cursor-pointer select-none">
                <input type="checkbox" v-model="adjustmentForm.recordAsTransaction" class="w-4 h-4 rounded text-primary focus:ring-primary-soft" />
                <span>Catat penyesuaian sebagai transaksi Pemasukan / Pengeluaran</span>
              </label>

              <button 
                class="px-4 py-2.5 mt-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 active:scale-98 transition-all cursor-pointer border border-slate-700/60 self-start"
                @click="submitAdjustment"
              >
                Catat Penyesuaian
              </button>
            </div>

            <!-- History of adjustments -->
            <div class="flex flex-col gap-3">
              <h4 class="text-xs font-bold text-muted uppercase tracking-wider border-b border-border pb-2 flex justify-between items-center">
                <span>Riwayat Penyesuaian Aset</span>
                <span class="text-[10px] text-muted normal-case">{{ selectedAsset.adjustments?.length || 0 }} catatan</span>
              </h4>

              <div class="max-h-56 overflow-y-auto pr-1 flex flex-col gap-2">
                <div 
                  v-for="adj in selectedAsset.adjustments" 
                  :key="adj.id"
                  class="flex justify-between items-center p-3 border border-border rounded-xl bg-surface-2/45 text-xs"
                >
                  <div class="flex items-start gap-2.5">
                    <span class="text-base select-none mt-0.5">
                      {{ adj.type === 'appreciation' ? '📈' : '📉' }}
                    </span>
                    <div>
                      <p class="font-bold text-text leading-snug">
                        {{ adj.type === 'appreciation' ? 'Apresiasi / Mengembang' : 'Penyusutan / Menyusut' }}
                      </p>
                      <p class="text-[10px] text-muted font-medium mt-0.5">
                        {{ adj.note || 'Tanpa keterangan' }} • {{ adj.date }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 font-semibold shrink-0">
                    <span :class="adj.type === 'appreciation' ? 'text-success' : 'text-danger'">
                      {{ adj.type === 'appreciation' ? '+' : '-' }} Rp {{ adj.amount.toLocaleString('id-ID') }}
                    </span>
                    <button 
                      class="text-danger hover:text-red-500 font-bold border-none bg-transparent cursor-pointer text-sm"
                      @click="deleteAdjustment(adj.id)"
                      title="Hapus penyesuaian"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p 
                  v-if="!selectedAsset.adjustments || !selectedAsset.adjustments.length" 
                  class="text-center py-6 text-[11px] text-muted font-semibold italic bg-slate-500/5 border border-dashed border-border rounded-xl"
                >
                  Belum ada penyesuaian nilai untuk aset ini.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
</template>
