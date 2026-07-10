<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  applyThemeSettings,
  dispatchThemeChange,
  getContrastColor,
  getThemeSettings,
  normalizeThemeInput,
  resolveThemePreset,
  saveThemeSettings,
  themePresets,
  type ThemeMode,
  type ThemeSettings,
} from '../composables/useTheme'
import { useUi } from '../composables/useUi'
import { useFinance } from '../composables/useFinance'
import { useNotifications } from '../composables/useNotifications'

const {
  reminderInterval,
  notificationPermission,
  requestPermission,
  setReminderInterval,
  triggerImmediateTestNotification
} = useNotifications()

const themeOptions: ThemeMode[] = ['light', 'dark', 'midnight']
const themeDraft = ref<ThemeSettings>(getThemeSettings())
const selectedPreset = ref('')
const savedMessage = ref('')
const pickerOpen = ref(false)
const { pushToast } = useUi()
const {
  exportJsonData,
  importJsonData,
  categories,
  addCategory,
  deleteCategory,
  updateCategory,
  resetAllData,
} = useFinance()

const handleResetAllData = () => {
  if (window.confirm('Apakah kamu yakin ingin menghapus semua data transaksi, aset, target tabungan, dan anggaran? Tindakan ini tidak dapat dibatalkan.')) {
    resetAllData()
  }
}

const quickSwatches = ['#2563eb', '#0f766e', '#ea580c', '#dc2626', '#4f46e5', '#0f172a', '#f59e0b', '#14b8a6']

const toRgba = (hex: string, alpha: number) => {
  const normalized = hex.trim().replace('#', '')
  const safe = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6)
  const r = Number.parseInt(safe.slice(0, 2), 16)
  const g = Number.parseInt(safe.slice(2, 4), 16)
  const b = Number.parseInt(safe.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const labelForTheme = (value: ThemeMode) => {
  if (value === 'dark') return 'Gelap'
  if (value === 'midnight') return 'Midnight'
  return 'Terang'
}

onMounted(() => {
  themeDraft.value = getThemeSettings()
})

const savePreferences = () => {
  const normalized = normalizeThemeInput(themeDraft.value)
  themeDraft.value = normalized
  saveThemeSettings(normalized)
  applyThemeSettings(normalized)
  dispatchThemeChange(normalized)
  savedMessage.value = `Tema disimpan: ${labelForTheme(normalized.mode)} dengan aksen ${normalized.primary.toUpperCase()}`
  pushToast('Preferensi tema berhasil disimpan', 'success')
}

const useSystemTheme = () => {
  localStorage.removeItem('finance-theme-settings')
  localStorage.removeItem('finance-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const systemTheme = {
    mode: (prefersDark ? 'dark' : 'light') as ThemeMode,
    primary: prefersDark ? '#0f766e' : '#2563eb',
    primaryAlpha: 1,
    surfaceMode: (prefersDark ? 'dark' : 'light') as 'light' | 'dark'
  }
  themeDraft.value = systemTheme
  applyThemeSettings(systemTheme)
  dispatchThemeChange(systemTheme)
  window.dispatchEvent(new Event('theme-reset-to-system'))
  savedMessage.value = 'Tema disinkronkan ke setelan sistem (Auto)'
  pushToast('Tema berhasil disinkronkan dengan sistem', 'success')
}

const applyPreset = () => {
  const preset = resolveThemePreset(selectedPreset.value)
  if (!preset) return
  themeDraft.value = {
    mode: preset.mode,
    primary: preset.primary,
    primaryAlpha: 1,
    surfaceMode: preset.surfaceMode,
  }
  savedMessage.value = `Preset dipilih: ${preset.label}`
}

const previewContrast = computed(() => getContrastColor(themeDraft.value.primary))
const previewSwatchStyle = computed(() => ({
  background: toRgba(themeDraft.value.primary, themeDraft.value.primaryAlpha),
}))

const applySwatch = (value: string) => {
  themeDraft.value.primary = value
}

const exportBackup = () => {
  const dataStr = exportJsonData()
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const today = new Date().toISOString().slice(0, 10)
  link.download = `backup-laporan-keuangan-${today}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const handleFileImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      const success = importJsonData(text)
      if (success) {
        input.value = ''
      }
    }
  }
  reader.readAsText(file)
}

// Category Management State & Handlers
const categoryForm = ref({
  name: '',
  type: 'expense' as 'income' | 'expense',
  color: '#3b82f6',
  icon: '🍟',
})

const editingCategoryId = ref<number | null>(null)
const editingCategoryForm = ref({
  name: '',
  color: '#3b82f6',
  icon: '🍟',
})

const quickEmojis = ['🍔', '☕', '🚗', '🛍️', '🔌', '🏠', '🎬', '🩺', '📚', '💰', '💻', '📈', '🎁', '✈️', '🏋️', '🧸']

const handleAddCategory = () => {
  const name = categoryForm.value.name.trim()
  if (!name) return
  const success = addCategory(name, categoryForm.value.type, categoryForm.value.color, categoryForm.value.icon)
  if (success) {
    categoryForm.value.name = ''
  }
}

const startEditCategory = (item: any) => {
  editingCategoryId.value = item.id
  editingCategoryForm.value = {
    name: item.name,
    color: item.color || '#3b82f6',
    icon: item.icon || '🍔',
  }
}

const handleUpdateCategory = () => {
  if (editingCategoryId.value === null) return
  updateCategory(editingCategoryId.value, {
    name: editingCategoryForm.value.name,
    color: editingCategoryForm.value.color,
    icon: editingCategoryForm.value.icon,
  })
  editingCategoryId.value = null
}

const cancelEditCategory = () => {
  editingCategoryId.value = null
}

const isPinEnabled = ref(false)
const isSettingNewPin = ref(false)
const newPin = ref('')

const checkLocalPin = () => {
  const pin = localStorage.getItem('finance_flow_pin')
  isPinEnabled.value = !!pin
}

const togglePinState = () => {
  if (isPinEnabled.value) {
    localStorage.removeItem('finance_flow_pin')
    sessionStorage.removeItem('finance_flow_unlocked')
    isPinEnabled.value = false
    isSettingNewPin.value = false
    newPin.value = ''
    window.dispatchEvent(new Event('pin-changed'))
    pushToast('Kunci PIN dinonaktifkan', 'success')
  } else {
    isSettingNewPin.value = true
  }
}

const saveNewPin = () => {
  const pinVal = newPin.value.trim()
  if (pinVal.length !== 4 || isNaN(Number(pinVal))) {
    pushToast('PIN harus berupa 4 digit angka!', 'error')
    return
  }
  localStorage.setItem('finance_flow_pin', pinVal)
  sessionStorage.setItem('finance_flow_unlocked', 'true')
  isPinEnabled.value = true
  isSettingNewPin.value = false
  newPin.value = ''
  window.dispatchEvent(new Event('pin-changed'))
  pushToast('PIN berhasil disimpan & diaktifkan', 'success')
}

onMounted(() => {
  checkLocalPin()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="bg-linear-to-br from-sidebar-bg to-sidebar-accent text-white rounded-3xl p-6 lg:p-8 shadow-custom">
      <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">Settings</p>
      <h1 class="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">Pengaturan & Tampilan Aplikasi</h1>
      <p class="text-sm text-white/80 leading-relaxed mt-2">Ganti tema warna, kelola kategori keuangan, atau cadangkan datamu dengan mudah.</p>
    </header>

    <!-- Tema Section -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Kustomisasi Tampilan</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Pilih mode tampilan dasar, kustom warna aksen secara dinamis, atau pilih preset palette yang kami sediakan.</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-2">
        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          Mode Tema
          <select v-model="themeDraft.mode" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option v-for="item in themeOptions" :key="item" :value="item">
              {{ labelForTheme(item) }}
            </option>
          </select>
        </label>
        
        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          Background Konten
          <select v-model="themeDraft.surfaceMode" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </label>

        <div class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider relative">
          Warna Utama (Aksen)
          <button class="flex items-center justify-between gap-3 border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold cursor-pointer w-full transition-all focus:outline-none focus:ring-2 focus:ring-primary-soft" type="button" @click="pickerOpen = !pickerOpen">
            <span class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0" :style="previewSwatchStyle"></span>
              <span>{{ themeDraft.primary.toUpperCase() }}</span>
            </span>
            <span class="text-[10px] text-muted font-bold">Alpha {{ Math.round(themeDraft.primaryAlpha * 100) }}%</span>
          </button>

          <!-- Color Picker Popover -->
          <div v-if="pickerOpen" class="absolute top-full left-0 right-0 mt-2 border border-border rounded-2xl p-4 bg-surface shadow-lg flex flex-col gap-3.5 z-20">
            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              Pilih Warna
              <input v-model="themeDraft.primary" type="color" class="w-full h-11 p-1 bg-surface-2 border border-border rounded-xl cursor-pointer" />
            </label>

            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              Kode HEX
              <input v-model="themeDraft.primary" type="text" placeholder="#2563eb" class="w-full border border-border rounded-xl px-3 py-1.5 bg-surface-2 text-text text-xs font-semibold focus:outline-none" />
            </label>

            <label class="flex flex-col gap-1 text-[10px] font-bold text-muted uppercase tracking-wider">
              Slider Transparansi (Alpha)
              <input v-model.number="themeDraft.primaryAlpha" type="range" min="0" max="1" step="0.01" class="w-full accent-primary h-2 bg-surface-2 rounded-lg cursor-pointer" />
            </label>

            <div class="flex flex-wrap gap-1.5 pt-1.5 border-t border-border/60">
              <button
                v-for="item in quickSwatches"
                :key="item"
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 active:scale-90 transition-all cursor-pointer shrink-0"
                type="button"
                :style="{ background: item }"
                @click="applySwatch(item)"
              ></button>
            </div>
          </div>
        </div>

        <label class="sm:col-span-2 md:col-span-3 flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          Preset Palette Cepat
          <select v-model="selectedPreset" @change="applyPreset" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="">Pilih Preset Siap Pakai</option>
            <option v-for="item in themePresets" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
        </label>
      </div>

      <!-- Preview Panel -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 border-t border-border pt-4">
        <div class="border border-border rounded-xl p-4 bg-surface-2 flex flex-col gap-2.5">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Preview Tombol Utama</span>
          <button
            class="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md border-none self-start cursor-pointer"
            type="button"
            :style="{ background: toRgba(themeDraft.primary, themeDraft.primaryAlpha), color: previewContrast }"
          >
            Simpan Preferensi
          </button>
        </div>
        <div class="border border-border rounded-xl p-4 bg-surface-2 flex flex-col gap-2.5">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider">Preview Input Field</span>
          <div class="border border-border rounded-xl px-4 py-2.5 bg-surface text-muted text-xs font-semibold leading-relaxed">
            Input akan otomatis menyesuaikan visual aksen warna aktif
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3.5 mt-2">
        <button class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none" @click="savePreferences">
          Terapkan & Simpan Preferensi
        </button>
        <button class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="useSystemTheme">
          Gunakan Tema Sistem (Auto)
        </button>
        <p v-if="savedMessage" class="text-xs font-bold text-success">{{ savedMessage }}</p>
      </div>
    </section>

    <!-- Kelola Kategori Keuangan -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Kelola Kategori Keuangan</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Tambahkan emoji kustom dan warna untuk membedakan kategori transaksi pemasukan dan pengeluaran.</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-1">
        <!-- Form Editor Kategori -->
        <div class="border border-border rounded-xl p-4 bg-surface-2 flex flex-col gap-3 height-fit">
          <h3 class="text-sm font-bold text-text border-b border-border/60 pb-2">
            {{ editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori Baru' }}
          </h3>
          
          <div v-if="!editingCategoryId" class="flex flex-col gap-3 text-xs">
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Nama Kategori
              <input v-model="categoryForm.name" placeholder="Contoh: Belanja" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
            </label>
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Jenis Kategori
              <select v-model="categoryForm.type" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none">
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Warna Identitas
              <input v-model="categoryForm.color" type="color" class="w-full h-10 p-0.5 bg-surface border border-border rounded-lg cursor-pointer" />
            </label>
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Simbol (Emoji)
              <select v-model="categoryForm.icon" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none">
                <option v-for="item in quickEmojis" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary-contrast bg-primary cursor-pointer border-none shadow-sm mt-1" type="button" @click="handleAddCategory">
              Tambah Kategori
            </button>
          </div>

          <div v-else class="flex flex-col gap-3 text-xs">
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Nama Kategori
              <input v-model="editingCategoryForm.name" placeholder="Contoh: Belanja" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none" />
            </label>
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Warna Identitas
              <input v-model="editingCategoryForm.color" type="color" class="w-full h-10 p-0.5 bg-surface border border-border rounded-lg cursor-pointer" />
            </label>
            <label class="flex flex-col gap-1.5 font-bold text-muted uppercase tracking-wider">
              Simbol (Emoji)
              <select v-model="editingCategoryForm.icon" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text font-semibold focus:outline-none">
                <option v-for="item in quickEmojis" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <div class="flex gap-2 mt-1">
              <button class="grow px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-primary-contrast bg-primary cursor-pointer border-none shadow-sm" type="button" @click="handleUpdateCategory">
                Simpan
              </button>
              <button class="px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-text bg-surface border border-border hover:bg-surface-2 transition-all cursor-pointer" type="button" @click="cancelEditCategory">
                Batal
              </button>
            </div>
          </div>
        </div>

        <!-- Daftar Kategori Aktif -->
        <div class="border border-border rounded-xl p-4 bg-surface flex flex-col gap-3">
          <h3 class="text-sm font-bold text-text border-b border-border pb-2">Daftar Kategori Terdaftar</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-3">
              <h4 class="text-xs font-bold text-muted border-b border-border/50 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-success"></span> Pemasukan
              </h4>
              <ul class="flex flex-col gap-2">
                <li v-for="item in categories.filter(c => c.type === 'income')" :key="item.id" class="flex justify-between items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl hover:bg-surface-2/65 transition-all">
                  <div class="flex items-center gap-2 text-xs font-semibold text-text">
                    <span class="text-sm shrink-0">{{ item.icon || '📈' }}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" :style="{ background: item.color || '#16a34a' }"></span>
                    <span class="truncate max-w-30">{{ item.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="p-1 text-xs hover:bg-primary-soft hover:text-primary transition-all rounded-lg cursor-pointer border-none" type="button" @click="startEditCategory(item)">✏️</button>
                    <button class="p-1 text-xs hover:bg-danger-soft hover:text-danger-text transition-all rounded-lg cursor-pointer border-none" type="button" @click="deleteCategory(item.id)">🗑️</button>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex flex-col gap-3">
              <h4 class="text-xs font-bold text-muted border-b border-border/50 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-danger"></span> Pengeluaran
              </h4>
              <ul class="flex flex-col gap-2">
                <li v-for="item in categories.filter(c => c.type === 'expense')" :key="item.id" class="flex justify-between items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl hover:bg-surface-2/65 transition-all">
                  <div class="flex items-center gap-2 text-xs font-semibold text-text">
                    <span class="text-sm shrink-0">{{ item.icon || '💸' }}</span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" :style="{ background: item.color || '#ef4444' }"></span>
                    <span class="truncate max-w-30">{{ item.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="p-1 text-xs hover:bg-primary-soft hover:text-primary transition-all rounded-lg cursor-pointer border-none" type="button" @click="startEditCategory(item)">✏️</button>
                    <button class="p-1 text-xs hover:bg-danger-soft hover:text-danger-text transition-all rounded-lg cursor-pointer border-none" type="button" @click="deleteCategory(item.id)">🗑️</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Keamanan PIN -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Keamanan PIN Aplikasi</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Proteksi privasi data Anda dengan 4-digit PIN saat pertama kali aplikasi dibuka.</p>
      
      <div class="flex flex-col gap-4 mt-1 max-w-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">Status PIN Pengunci</span>
          <button 
            class="px-4 py-2 rounded-full text-xs font-bold transition-all border-none cursor-pointer"
            :class="isPinEnabled ? 'bg-danger-soft text-danger-text hover:bg-danger/25' : 'bg-primary-soft text-primary hover:bg-primary/25'"
            type="button"
            @click="togglePinState"
          >
            {{ isPinEnabled ? 'Matikan PIN' : 'Aktifkan PIN' }}
          </button>
        </div>

        <div v-if="isPinEnabled || isSettingNewPin" class="flex flex-col gap-3 p-4 bg-surface-2 border border-border rounded-xl">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ isPinEnabled ? 'Ubah PIN Baru (4 Digit)' : 'Atur PIN Baru (4 Digit)' }}
            <input 
              v-model="newPin" 
              type="password" 
              pattern="[0-9]*" 
              inputmode="numeric" 
              maxlength="4" 
              placeholder="Masukkan 4 angka" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none transition-all"
            />
          </label>
          <button 
            class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm border-none mt-1 self-start"
            type="button"
            @click="saveNewPin"
          >
            Simpan PIN
          </button>
        </div>
      </div>
    </section>

    <!-- Pengingat Catat Keuangan (Notifikasi) -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Pengingat Catat Keuangan (Push Notification)</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Jaga kedisiplinan mencatat keuangan Anda dengan menyalakan push notification pengingat berkala.</p>

      <div class="flex flex-col gap-4 mt-1 max-w-md">
        <div class="flex items-center justify-between border-b border-border/40 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">Izin Notifikasi Browser</span>
            <span class="text-[10px] font-bold" :class="notificationPermission === 'granted' ? 'text-success' : notificationPermission === 'denied' ? 'text-danger' : 'text-amber-500'">
              {{ notificationPermission === 'granted' ? 'Diizinkan (Aktif)' : notificationPermission === 'denied' ? 'Ditolak (Blokir)' : 'Meminta Persetujuan' }}
            </span>
          </div>
          <button
            v-if="notificationPermission !== 'granted'"
            class="px-4 py-2 rounded-full text-xs font-bold bg-primary-soft text-primary hover:bg-primary/25 border-none cursor-pointer transition-colors"
            type="button"
            @click="requestPermission"
          >
            Izinkan Notifikasi
          </button>
          <span v-else class="text-xs font-bold text-success">✔️ Aktif</span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider grow">
            Frekuensi Pengingat
            <select
              :value="reminderInterval"
              @change="setReminderInterval(($event.target as HTMLSelectElement).value as any)"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all"
            >
              <option value="off">Matikan Pengingat</option>
              <option value="daily">Setiap Hari (Harian)</option>
              <option value="weekly">Setiap Minggu (Mingguan)</option>
              <option value="monthly">Setiap Bulan (Bulanan)</option>
            </select>
          </label>

          <button
            class="px-4 py-3 rounded-xl text-xs font-bold bg-surface-2 border border-border hover:bg-border text-text transition-all cursor-pointer sm:self-end shrink-0"
            type="button"
            @click="triggerImmediateTestNotification"
          >
            🔔 Uji Coba Notifikasi
          </button>
        </div>
      </div>
    </section>

    <!-- Backup & Restore -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">Backup & Restore Data</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">Simpan salinan data transaksi Anda ke format JSON, atau pulihkan data dari berkas pencadangan lama.</p>
      
      <div class="flex flex-wrap gap-3.5 mt-1">
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-primary/20 border-none" type="button" @click="exportBackup">
          Ekspor Data (.json)
        </button>
        
        <label class="inline-flex items-center justify-center border border-border rounded-full px-5 py-3 bg-surface-2 text-text text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-border transition-all mr-auto">
          <span>Impor Data (.json)</span>
          <input type="file" accept=".json" @change="handleFileImport" class="hidden" />
        </label>

        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md border-none" type="button" @click="handleResetAllData">
          Reset Semua Data (Mulai Baru)
        </button>
      </div>
    </section>
  </div>
</template>
