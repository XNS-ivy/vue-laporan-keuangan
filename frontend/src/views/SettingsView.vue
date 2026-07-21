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
import { currency, appMode, language, contentScale, t, categoryIcons, categoryExampleGroups, exchangeRates, exchangeRateLastUpdated, isFetchingRates, fetchRealtimeRates, updateExchangeRate, resetExchangeRates, formatMoney, type CurrencyType } from '../composables/useUserSettings'

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
  const confirmMsg = t({
    id: 'Apakah kamu yakin ingin menghapus semua data transaksi, aset, target tabungan, dan anggaran? Tindakan ini tidak dapat dibatalkan.',
    en: 'Are you sure you want to delete all transaction, asset, savings goal, and budget data? This action cannot be undone.',
    ja: 'すべての取引、資産、貯蓄目標、および予算データを削除してもよろしいですか？この操作は取り消せません。',
    es: '¿Está seguro de que desea eliminar todos los datos de transacciones, activos, metas de ahorro y presupuestos? Esta acción no se puede deshacer.'
  })
  if (window.confirm(confirmMsg)) {
    resetAllData()
  }
}

const handleSyncRates = async () => {
  const res = await fetchRealtimeRates()
  if (res?.success) {
    pushToast(`Kurs live berhasil diperbarui! (1 USD = Rp ${exchangeRates.value.USD.toLocaleString('id-ID')})`, 'success')
  } else {
    pushToast('Gagal terhubung ke server kurs live. Menggunakan kurs tersimpan.', 'error')
  }
}

const handleResetRates = () => {
  resetExchangeRates()
  pushToast('Kurs mata uang telah dikembalikan ke nilai default.', 'info')
}

const calcAmount = ref(100)
const calcFromCurrency = ref<CurrencyType>('USD')
const calcToCurrency = ref<CurrencyType>('IDR')

const calcResultFormatted = computed(() => {
  return formatMoney(calcAmount.value, calcFromCurrency.value, calcToCurrency.value)
})

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
  savedMessage.value = t({
    id: `Tema disimpan: ${labelForTheme(normalized.mode)} dengan aksen ${normalized.primary.toUpperCase()}`,
    en: `Theme saved: ${labelForTheme(normalized.mode)} with accent ${normalized.primary.toUpperCase()}`,
    ja: `テーマが保存されました: ${labelForTheme(normalized.mode)}、アクセント ${normalized.primary.toUpperCase()}`,
    es: `Tema guardado: ${labelForTheme(normalized.mode)} con acento ${normalized.primary.toUpperCase()}`
  })
  pushToast(t({
    id: 'Preferensi tema berhasil disimpan',
    en: 'Theme preferences successfully saved',
    ja: 'テーマ設定が正常に保存されました',
    es: 'Preferencias de tema guardadas con éxito'
  }), 'success')
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
  savedMessage.value = t({
    id: 'Tema disinkronkan ke setelan sistem (Auto)',
    en: 'Theme synced with system settings (Auto)',
    ja: 'テーマがシステム設定と同期されました（自動）',
    es: 'Tema sincronizado con la configuración del sistema (Auto)'
  })
  pushToast(t({
    id: 'Tema berhasil disinkronkan dengan sistem',
    en: 'Theme successfully synced with the system',
    ja: 'テーマがシステムと正常に同期されました',
    es: 'Tema sincronizado con éxito con el sistema'
  }), 'success')
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
  icon: 'burger',
})

const editingCategoryId = ref<number | null>(null)
const editingCategoryForm = ref({
  name: '',
  color: '#3b82f6',
  icon: 'burger',
})

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
    icon: item.icon || 'burger',
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

// Popup Icon Picker state
const showIconPicker = ref(false)
const isEditingIconPicker = ref(false)
const iconSearchQuery = ref('')

const openIconPicker = (isEdit: boolean) => {
  isEditingIconPicker.value = isEdit
  iconSearchQuery.value = ''
  showIconPicker.value = true
}

const selectCategoryIcon = (key: string) => {
  if (isEditingIconPicker.value) {
    editingCategoryForm.value.icon = key
  } else {
    categoryForm.value.icon = key
  }
  showIconPicker.value = false
}

const filteredIconGroups = computed(() => {
  const query = iconSearchQuery.value.trim().toLowerCase()
  if (!query) return categoryExampleGroups
  
  return categoryExampleGroups.map(group => {
    const matchedIcons = group.icons.filter(icon => {
      const matchKey = icon.key.toLowerCase().includes(query)
      const matchLabel = icon.label.toLowerCase().includes(query)
      const matchTrans = Object.values(icon.labelTranslations || {}).some(val => val.toLowerCase().includes(query))
      return matchKey || matchLabel || matchTrans
    })
    return {
      ...group,
      icons: matchedIcons
    }
  }).filter(group => group.icons.length > 0)
})

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
    pushToast(t({
      id: 'Kunci PIN dinonaktifkan',
      en: 'PIN lock disabled',
      ja: 'PINロックが無効になりました',
      es: 'Bloqueo de PIN desactivado'
    }), 'success')
  } else {
    isSettingNewPin.value = true
  }
}

const saveNewPin = () => {
  const pin = newPin.value.replace(/\D/g, '')
  if (pin.length !== 4) {
    pushToast(t({
      id: 'PIN harus 4 digit angka!',
      en: 'PIN must be exactly 4 digit numbers!',
      ja: 'PINは4桁の数字である必要があります！',
      es: '¡El PIN debe ser exactamente de 4 dígitos!'
    }), 'error')
    return
  }
  localStorage.setItem('finance_flow_pin', pin)
  isPinEnabled.value = true
  isSettingNewPin.value = false
  newPin.value = ''
  window.dispatchEvent(new Event('pin-changed'))
  pushToast(t({
    id: 'PIN pengunci berhasil disimpan',
    en: 'Lock PIN successfully saved',
    ja: 'ロックPINが正常に保存されました',
    es: 'PIN de bloqueo guardado con éxito'
  }), 'success')
}

onMounted(() => {
  checkLocalPin()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
      <div>
        <p class="uppercase tracking-widest text-[10px] text-muted font-bold">{{ t({ id: 'Pengaturan', en: 'Settings', ja: '設定', es: 'Ajustes' }) }}</p>
        <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text mt-0.5">{{ t({ id: 'Kelola Seluruh Preferensi & Aplikasi', en: 'Manage All Preferences & Applications', ja: 'すべての設定とアプリケーションの管理', es: 'Gestionar Todas las Preferencias y Aplicación' }) }}</h1>
      </div>
    </header>

    <!-- Preferensi Pengguna Section -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Preferensi Pengguna', en: 'User Preferences', ja: 'ユーザー設定', es: 'Preferencias de Usuario' }) }}</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-2">
        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          {{ t({ id: 'Mata Uang Utama', en: 'Primary Currency', ja: '主要通貨', es: 'Moneda Principal' }) }}
          <select v-model="currency" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="IDR">IDR (Rp)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="SGD">SGD (S$)</option>
            <option value="JPY">JPY (¥)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </label>

        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          {{ t({ id: 'Bahasa Preferensi', en: 'Language Preference', ja: '優先言語', es: 'Idioma de Preferencia' }) }}
          <select v-model="language" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
            <option value="ja">日本語 (Japanese)</option>
            <option value="es">Español (Spanish)</option>
          </select>
        </label>

        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          {{ t({ id: 'Mode Tampilan', en: 'Display Mode', ja: '表示モード', es: 'Modo de Visualización' }) }}
          <select v-model="appMode" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="simple">{{ t({ id: 'Mode Sederhana (Simple)', en: 'Simple Mode (Simple)', ja: 'シンプルモード', es: 'Modo Simple' }) }}</option>
            <option value="advance">{{ t({ id: 'Mode Lengkap (Advance)', en: 'Advanced Mode (Advance)', ja: 'アドバンスモード', es: 'Modo Avanzado' }) }}</option>
          </select>
        </label>

      </div>

        <!-- Realtime Live Exchange Rates Card -->
        <div class="border border-border rounded-2xl p-4 bg-surface-2 flex flex-col gap-3 mt-1">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs font-bold text-text uppercase tracking-wider">{{ t({ id: 'Kurs Mata Uang Real-Time & Pengaturan Manual', en: 'Real-Time Exchange Rates & Manual Config', ja: 'リアルタイム為替レートと手動設定', es: 'Tasas de Cambio en Tiempo Real y Config' }) }}</span>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-muted font-medium">{{ exchangeRateLastUpdated ? `Diperbarui: ${exchangeRateLastUpdated}` : 'Memuat data kurs...' }}</span>
              <button 
                type="button" 
                @click="handleSyncRates" 
                :disabled="isFetchingRates"
                class="px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary-soft hover:bg-primary-muted transition-all cursor-pointer border-none flex items-center gap-1"
              >
                <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isFetchingRates }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                {{ isFetchingRates ? 'Memperbarui...' : 'Sync Live FX' }}
              </button>
              <button 
                type="button" 
                @click="handleResetRates" 
                class="px-2.5 py-1 rounded-lg text-xs font-bold text-muted bg-surface hover:bg-border transition-all cursor-pointer border border-border flex items-center gap-1"
              >
                {{ t({ id: 'Reset', en: 'Reset', ja: 'リセット', es: 'Restablecer' }) }}
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div class="p-2.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
              <span class="text-muted font-semibold">1 USD ($)</span>
              <div class="flex items-center gap-1">
                <span class="text-muted font-bold text-xs">Rp</span>
                <input 
                  :value="exchangeRates.USD" 
                  @input="updateExchangeRate('USD', Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="1"
                  class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
              <span class="text-muted font-semibold">1 EUR (€)</span>
              <div class="flex items-center gap-1">
                <span class="text-muted font-bold text-xs">Rp</span>
                <input 
                  :value="exchangeRates.EUR" 
                  @input="updateExchangeRate('EUR', Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="1"
                  class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
              <span class="text-muted font-semibold">1 SGD (S$)</span>
              <div class="flex items-center gap-1">
                <span class="text-muted font-bold text-xs">Rp</span>
                <input 
                  :value="exchangeRates.SGD" 
                  @input="updateExchangeRate('SGD', Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="1"
                  class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
              <span class="text-muted font-semibold">1 GBP (£)</span>
              <div class="flex items-center gap-1">
                <span class="text-muted font-bold text-xs">Rp</span>
                <input 
                  :value="exchangeRates.GBP" 
                  @input="updateExchangeRate('GBP', Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="1"
                  class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div class="p-2.5 rounded-xl bg-surface border border-border flex flex-col gap-1">
              <span class="text-muted font-semibold">1 JPY (¥)</span>
              <div class="flex items-center gap-1">
                <span class="text-muted font-bold text-xs">Rp</span>
                <input 
                  :value="exchangeRates.JPY" 
                  @input="updateExchangeRate('JPY', Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="1"
                  class="w-full bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <!-- Mini Live FX Calculator for Live Verification -->
          <div class="mt-2 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <span class="font-bold text-muted uppercase tracking-wider shrink-0">
              {{ t({ id: 'Kalkulator Konversi Kurs Live:', en: 'Live FX Converter Calc:', ja: 'ライブ為替計算ツール:', es: 'Calc de Conversión FX:' }) }}
            </span>
            <div class="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <input 
                v-model.number="calcAmount" 
                type="number" 
                min="0"
                class="w-24 bg-surface border border-border rounded-lg px-2.5 py-1.5 font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary" 
              />
              <select v-model="calcFromCurrency" class="bg-surface border border-border rounded-lg px-2 py-1.5 font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <span class="font-bold text-muted">➔</span>
              <select v-model="calcToCurrency" class="bg-surface border border-border rounded-lg px-2 py-1.5 font-bold text-text focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <span class="font-extrabold text-xs text-primary px-3 py-1.5 rounded-lg bg-primary-soft border border-primary/20">
                = {{ calcResultFormatted }}
              </span>
            </div>
          </div>
        </div>

        <!-- Interactive Text & Symbol Scale Selector with Visual Cards & Live Preview -->
        <div class="flex flex-col gap-3 border-t border-border pt-4 mt-2">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Ukuran Teks & Simbol (Skala Layout)', en: 'Text & Symbol Size (Layout Scale)', ja: 'テキストと記号のサイズ (レイアウト倍率)', es: 'Tamaño de Texto y Símbolo (Escala)' }) }}
            </span>
            <p class="text-xs text-muted font-normal leading-relaxed">
              {{ t({ id: 'Pilih tingkat perbesaran font, tombol, dan ikon agar lebih nyaman dibaca di layar HP atau Monitor.', en: 'Choose font, button, and icon magnification level for comfortable reading on phones or monitors.', ja: 'スマホやモニターで読みやすいように、フォント、ボタン、アイコンの拡大レベルを選択します。', es: 'Elija el nivel de ampliación de fuentes, botones e iconos para leer cómodamente en teléfonos o monitores.' }) }}
            </p>
          </div>

          <!-- Interactive Selection Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <!-- Card 1: Normal -->
            <button
              type="button"
              @click="contentScale = 'normal'"
              class="flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden"
              :class="contentScale === 'normal' ? 'border-primary bg-primary-soft/40 shadow-sm ring-2 ring-primary-soft' : 'border-border bg-surface-2 hover:bg-border/60 text-text'"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ t({ id: '100% Standard', en: '100% Standard', ja: '100% 標準', es: '100% Estándar' }) }}</span>
                <span v-if="contentScale === 'normal'" class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
              <div class="flex items-baseline justify-center gap-1.5 my-1 text-text">
                <span class="text-xs font-semibold">Aa</span>
                <span class="text-sm font-bold">Aa</span>
                <span class="text-base font-extrabold text-primary">Aa</span>
              </div>
              <div class="w-full text-center border-t border-border/60 pt-2">
                <span class="text-xs font-bold text-text">{{ t({ id: 'Normal', en: 'Normal', ja: '標準', es: 'Normal' }) }}</span>
              </div>
            </button>

            <!-- Card 2: Large -->
            <button
              type="button"
              @click="contentScale = 'large'"
              class="flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden"
              :class="contentScale === 'large' ? 'border-primary bg-primary-soft/40 shadow-sm ring-2 ring-primary-soft' : 'border-border bg-surface-2 hover:bg-border/60 text-text'"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ t({ id: '120% Nyaman', en: '120% Comfortable', ja: '120% 快適', es: '120% Cómodo' }) }}</span>
                <span v-if="contentScale === 'large'" class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
              <div class="flex items-baseline justify-center gap-1.5 my-1 text-text">
                <span class="text-sm font-semibold">Aa</span>
                <span class="text-base font-bold">Aa</span>
                <span class="text-lg font-extrabold text-primary">Aa</span>
              </div>
              <div class="w-full text-center border-t border-border/60 pt-2">
                <span class="text-xs font-bold text-text">{{ t({ id: 'Besar', en: 'Large', ja: '大きい', es: 'Grande' }) }}</span>
              </div>
            </button>

            <!-- Card 3: Extra Large -->
            <button
              type="button"
              @click="contentScale = 'xlarge'"
              class="flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden"
              :class="contentScale === 'xlarge' ? 'border-primary bg-primary-soft/40 shadow-sm ring-2 ring-primary-soft' : 'border-border bg-surface-2 hover:bg-border/60 text-text'"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-bold uppercase tracking-wider text-muted">{{ t({ id: '145% Jelas', en: '145% Ultra Clear', ja: '145% 超明瞭', es: '145% Ultra Claro' }) }}</span>
                <span v-if="contentScale === 'xlarge'" class="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">✓</span>
              </div>
              <div class="flex items-baseline justify-center gap-1.5 my-1 text-text">
                <span class="text-base font-semibold">Aa</span>
                <span class="text-lg font-bold">Aa</span>
                <span class="text-xl font-extrabold text-primary">Aa</span>
              </div>
              <div class="w-full text-center border-t border-border/60 pt-2">
                <span class="text-xs font-bold text-text">{{ t({ id: 'Ekstra Besar', en: 'Extra Large', ja: '特大', es: 'Extra Grande' }) }}</span>
              </div>
            </button>
          </div>

          <!-- Live Dynamic Scale Simulation Box -->
          <div class="border border-border rounded-2xl p-4 bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1 shadow-sm">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-bold text-muted uppercase tracking-wider">{{ t({ id: 'Simulasi Ukuran Aktif', en: 'Active Size Simulation', ja: 'アクティブサイズシミュレーション', es: 'Simulación de Tamaño Activo' }) }}</span>
                <p class="text-sm font-semibold text-text leading-snug">
                  {{ t({ id: 'Teks & Ikon otomatis berubah besar secara real-time!', en: 'Text & Icons scale automatically in real-time!', ja: 'テキストとアイコンがリアルタイムで自動的に拡大縮小します！', es: '¡El texto y los iconos se escalan automáticamente en tiempo real!' }) }}
                </p>
              </div>
            </div>
            <button type="button" class="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary shrink-0 border-none shadow-sm cursor-default">
              {{ contentScale === 'normal' ? t({ id: 'Skala Normal', en: 'Normal Scale', ja: '標準スケール', es: 'Escala Normal' }) : contentScale === 'large' ? t({ id: 'Skala Besar', en: 'Large Scale', ja: '大スケール', es: 'Escala Grande' }) : t({ id: 'Skala Ekstra Besar', en: 'Extra Large Scale', ja: '特大スケール', es: 'Escala Extra Grande' }) }}
            </button>
          </div>
        </div>
    </section>

    <!-- Tema Section -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Kustomisasi Tampilan', en: 'Appearance Customization', ja: '外観のカスタマイズ', es: 'Personalización de Apariencia' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Pilih mode tampilan dasar, kustom warna aksen secara dinamis, atau pilih preset palette yang kami sediakan.', en: 'Choose basic display mode, dynamically customize accent colors, or select from preset palettes.', ja: '基本表示モードを選択し、アクセントカラーを動的にカスタマイズするか、プリセットパレットから選択します。', es: 'Elija el modo de visualización básico, personalice dinámicamente los colores de acento o seleccione de paletas preestablecidas.' }) }}</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 my-2">
        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          {{ t({ id: 'Mode Tema', en: 'Theme Mode', ja: 'テーマモード', es: 'Modo de Tema' }) }}
          <select v-model="themeDraft.mode" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option v-for="item in themeOptions" :key="item" :value="item">
              {{ labelForTheme(item) }}
            </option>
          </select>
        </label>
        
        <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
          {{ t({ id: 'Background Konten', en: 'Content Background', ja: 'コンテンツの背景', es: 'Fondo de Contenido' }) }}
          <select v-model="themeDraft.surfaceMode" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all">
            <option value="light">{{ t({ id: 'Terang', en: 'Light', ja: 'ライト', es: 'Claro' }) }}</option>
            <option value="dark">{{ t({ id: 'Gelap', en: 'Dark', ja: 'ダーク', es: 'Oscuro' }) }}</option>
          </select>
        </label>

        <div class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider relative">
          {{ t({ id: 'Warna Utama (Aksen)', en: 'Primary Color (Accent)', ja: '主要色 (アクセント)', es: 'Color Primario (Acento)' }) }}
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
            Menu
          </button>
        </div>
        <div class="border border-border rounded-xl p-4 bg-surface-2 flex flex-col gap-2.5">
          <span class="text-[10px] font-bold text-muted uppercase tracking-wider">{{ t({ id: 'Preview Input Field', en: 'Input Field Preview', ja: '入力フィールドのプレビュー', es: 'Vista Previa del Campo de Entrada' }) }}</span>
          <div class="border border-border rounded-xl px-4 py-2.5 bg-surface text-muted text-xs font-semibold leading-relaxed">
            {{ t({ id: 'Input akan otomatis menyesuaikan visual aksen warna aktif', en: 'Input will automatically adjust to active accent color', ja: '入力は自動的にアクティブなアクセントカラーに調整されます', es: 'La entrada se ajustará automáticamente al color de acento activo' }) }}
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3.5 mt-2">
        <button class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none" @click="savePreferences">
          {{ t({ id: 'Terapkan & Simpan Preferensi', en: 'Apply & Save Preferences', ja: '適用して設定を保存', es: 'Aplicar y Guardar Preferencias' }) }}
        </button>
        <button class="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="useSystemTheme">
          {{ t({ id: 'Gunakan Tema Sistem (Auto)', en: 'Use System Theme (Auto)', ja: 'システムテーマを使用（自動）', es: 'Usar Tema del Sistema (Auto)' }) }}
        </button>
        <p v-if="savedMessage" class="text-xs font-bold text-success">{{ savedMessage }}</p>
      </div>
    </section>

    <!-- Kelola Kategori Keuangan -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Kelola Kategori Keuangan', en: 'Manage Financial Categories', ja: '財務カテゴリーの管理', es: 'Gestionar Categorías Financieras' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Tambahkan ikon kustom dan warna untuk membedakan kategori transaksi pemasukan dan pengeluaran.', en: 'Add custom icons and colors to differentiate income and expense categories.', ja: 'カスタムのアイコンと色を追加して、収入と支出のカテゴリーを区別します。', es: 'Agregue iconos y colores personalizados para diferenciar las categorías de ingresos y gastos.' }) }}</p>
      
      <div class="grid grid-cols-1 lg:grid-cols-[18.75rem_1fr] gap-6 mt-1">
        <!-- Form Editor Kategori -->
        <div class="border border-border rounded-xl p-4 bg-surface-2 flex flex-col gap-3 height-fit">
          <h3 class="text-sm font-bold text-text border-b border-border/60 pb-2">
            {{ t({ id: 'Tambah Kategori Baru', en: 'Add New Category', ja: '新しいカテゴリーの追加', es: 'Agregar Nueva Categoría' }) }}
          </h3>
          
          <div class="flex flex-col gap-3.5">
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Nama Kategori', en: 'Category Name', ja: 'カテゴリー名', es: 'Nombre de Categoría' }) }}
              <input v-model="categoryForm.name" :placeholder="t({ id: 'Contoh: Belanja', en: 'e.g., Shopping', ja: '例: ショッピング', es: 'ej. Compras' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft focus:border-primary transition-all" />
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Jenis Kategori', en: 'Category Type', ja: 'カテゴリータイプ', es: 'Tipo de Categoría' }) }}
              <select v-model="categoryForm.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft focus:border-primary transition-all">
                <option value="expense">{{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}</option>
                <option value="income">{{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Warna Identitas', en: 'Color Identity', ja: '色彩識別', es: 'Identidad de Color' }) }}
              <input v-model="categoryForm.color" type="color" class="w-full h-10 p-0.5 bg-surface border border-border rounded-lg cursor-pointer" />
            </label>
            
            <!-- Popup Icon Picker Trigger (With Color Preview) -->
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Ikon Kategori', en: 'Category Icon', ja: 'カテゴリーアイコン', es: 'Icono di Categoría' }) }}
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl border border-border flex items-center justify-center bg-surface text-text shadow-sm" :style="{ color: categoryForm.color }">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="categoryIcons[categoryForm.icon || 'tag']"></svg>
                </div>
                <button type="button" @click="openIconPicker(false)" class="px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-border text-xs font-bold uppercase tracking-wider text-text transition-all cursor-pointer">
                  {{ t({ id: 'Pilih Ikon...', en: 'Choose Icon...', ja: 'アイコンを選択...', es: 'Elegir Icono...' }) }}
                </button>
              </div>
            </label>

            <button class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary cursor-pointer border-none shadow-sm mt-1" type="button" @click="handleAddCategory">
              {{ t({ id: 'Tambah Kategori', en: 'Add Category', ja: 'カテゴリーを追加', es: 'Agregar Categoría' }) }}
            </button>
          </div>
        </div>

        <!-- Daftar Kategori Aktif -->
        <div class="border border-border rounded-xl p-4 bg-surface flex flex-col gap-3">
          <h3 class="text-sm font-bold text-text border-b border-border pb-2">{{ t({ id: 'Daftar Kategori Terdaftar', en: 'Registered Categories List', ja: '登録済みカテゴリーリスト', es: 'Lista de Categorías Registradas' }) }}</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-3">
              <h4 class="text-xs font-bold text-muted border-b border-border/50 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-success"></span> {{ t({ id: 'Pemasukan', en: 'Income', ja: '収入', es: 'Ingreso' }) }}
              </h4>
              <ul class="flex flex-col gap-2">
                <li v-for="item in categories.filter(c => c.type === 'income')" :key="item.id" class="flex justify-between items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl hover:bg-surface-2/65 transition-all">
                  <div class="flex items-center gap-2 text-xs font-semibold text-text">
                    <span class="text-sm shrink-0 flex items-center justify-center w-5 h-5 text-text" v-html="`<svg class='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>${categoryIcons[item.icon || 'tag'] || categoryIcons.tag}</svg>`"></span>
                    <span class="w-2 h-2 rounded-full shrink-0 shadow-xs" :style="{ background: item.color || '#16a34a' }"></span>
                    <span class="truncate max-w-30">{{ item.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="p-1 text-xs hover:bg-primary-soft hover:text-primary transition-all rounded-lg cursor-pointer border-none bg-transparent flex items-center" type="button" @click="startEditCategory(item)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button class="p-1 text-xs hover:bg-danger-soft hover:text-danger-text transition-all rounded-lg cursor-pointer border-none bg-transparent flex items-center" type="button" @click="deleteCategory(item.id)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <div class="flex flex-col gap-3">
              <h4 class="text-xs font-bold text-muted border-b border-border/50 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-danger"></span> {{ t({ id: 'Pengeluaran', en: 'Expense', ja: '支出', es: 'Gasto' }) }}
              </h4>
              <ul class="flex flex-col gap-2">
                <li v-for="item in categories.filter(c => c.type === 'expense')" :key="item.id" class="flex justify-between items-center gap-2 p-2 bg-surface-2 border border-border rounded-xl hover:bg-surface-2/65 transition-all">
                  <div class="flex items-center gap-2 text-xs font-semibold text-text">
                    <span class="text-sm shrink-0 flex items-center justify-center w-5 h-5 text-text" v-html="`<svg class='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>${categoryIcons[item.icon || 'tag'] || categoryIcons.tag}</svg>`"></span>
                    <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" :style="{ background: item.color || '#ef4444' }"></span>
                    <span class="truncate max-w-30">{{ item.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button class="p-1 text-xs hover:bg-primary-soft hover:text-primary transition-all rounded-lg cursor-pointer border-none bg-transparent flex items-center" type="button" @click="startEditCategory(item)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button class="p-1 text-xs hover:bg-danger-soft hover:text-danger-text transition-all rounded-lg cursor-pointer border-none bg-transparent flex items-center" type="button" @click="deleteCategory(item.id)">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
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
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Keamanan PIN Aplikasi', en: 'Application PIN Security', ja: 'アプリケーションPINセキュリティ', es: 'Seguridad di PIN de la Aplicación' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Proteksi privasi data Anda dengan 4-digit PIN saat pertama kali aplikasi dibuka.', en: 'Protect your data privacy with a 4-digit PIN when the application first opens.', ja: 'アプリケーションを最初に開くときに4桁 of PINでデータのプライバシーを保護します。', es: 'Proteja la privacidad de sus datos con un PIN de 4 dígitos cuando abra la aplicación por primera vez.' }) }}</p>
      
      <div class="flex flex-col gap-4 mt-1 max-w-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-muted uppercase tracking-wider">{{ t({ id: 'Status PIN Pengunci', en: 'Lock PIN Status', ja: 'ロックPINステータス', es: 'Estado del PIN de Bloqueo' }) }}</span>
          <button 
            class="px-4 py-2 rounded-full text-xs font-bold transition-all border-none cursor-pointer"
            :class="isPinEnabled ? 'bg-danger-soft text-danger-text hover:bg-danger/25' : 'bg-primary-soft text-primary hover:bg-primary/25'"
            type="button"
            @click="togglePinState"
          >
            {{ isPinEnabled ? t({ id: 'Matikan PIN', en: 'Disable PIN', ja: 'PINを無効にする', es: 'Desactivar PIN' }) : t({ id: 'Aktifkan PIN', en: 'Enable PIN', ja: 'PINを有効にする', es: 'Activar PIN' }) }}
          </button>
        </div>

        <div v-if="isPinEnabled || isSettingNewPin" class="flex flex-col gap-3 p-4 bg-surface-2 border border-border rounded-xl">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ isPinEnabled ? t({ id: 'Ubah PIN Baru (4 Digit)', en: 'Change New PIN (4 Digits)', ja: '新しいPINの変更 (4桁)', es: 'Cambiar PIN Nuevo (4 Dígitos)' }) : t({ id: 'Atur PIN Baru (4 Digit)', en: 'Set New PIN (4 Digits)', ja: '新しいPINの設定 (4桁)', es: 'Establecer PIN Nuevo (4 Dígitos)' }) }}
            <input 
              v-model="newPin" 
              type="password" 
              pattern="[0-9]*" 
              inputmode="numeric" 
              maxlength="4" 
              :placeholder="t({ id: 'Masukkan 4 angka', en: 'Enter 4 numbers', ja: '4桁の数字を入力', es: 'Ingrese 4 números' })" 
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-sm font-semibold focus:outline-none transition-all"
            />
          </label>
          <button 
            class="px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm border-none mt-1 self-start"
            type="button"
            @click="saveNewPin"
          >
            {{ t({ id: 'Simpan PIN', en: 'Save PIN', ja: 'PINを保存', es: 'Guardar PIN' }) }}
          </button>
        </div>
      </div>
    </section>

    <!-- Pengingat Catat Keuangan (Notifikasi) -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Pengingat Catat Keuangan (Push Notification)', en: 'Financial Reminder (Push Notification)', ja: '財務リマインダー (プッシュ通知)', es: 'Recordatorio Financiero (Notificación Push)' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Jaga kedisiplinan mencatat keuangan Anda dengan menyalakan push notification pengingat berkala.', en: 'Maintain discipline in recording your finances by enabling periodic push notifications.', ja: '定期的なプッシュ通知を有効にして、財務記録の規律を維持します。', es: 'Mantenga la disciplina en el registro de sus finanzas activando notificaciones push periódicas.' }) }}</p>

      <div class="flex flex-col gap-4 mt-1 max-w-md">
        <div class="flex items-center justify-between border-b border-border/40 pb-3">
          <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-muted uppercase tracking-wider">{{ t({ id: 'Izin Notifikasi Browser', en: 'Browser Notification Permission', ja: 'ブラウザ通知権限', es: 'Permiso de Notificación del Navegador' }) }}</span>
            <span class="text-[10px] font-bold" :class="notificationPermission === 'granted' ? 'text-success' : notificationPermission === 'denied' ? 'text-danger' : 'text-amber-500'">
              {{ notificationPermission === 'granted' ? t({ id: 'Diizinkan (Aktif)', en: 'Granted (Active)', ja: '許可（アクティブ）', es: 'Permitido (Activo)' }) : notificationPermission === 'denied' ? t({ id: 'Ditolak (Blokir)', en: 'Denied (Blocked)', ja: '拒否（ブロック）', es: 'Denegado (Bloqueado)' }) : t({ id: 'Meminta Persetujuan', en: 'Requesting Permission', ja: '権限を要求中', es: 'Solicitando Permiso' }) }}
            </span>
          </div>
          <button
            v-if="notificationPermission !== 'granted'"
            class="px-4 py-2 rounded-full text-xs font-bold bg-primary-soft text-primary hover:bg-primary/25 border-none cursor-pointer transition-colors"
            type="button"
            @click="requestPermission"
          >
            {{ t({ id: 'Izinkan Notifikasi', en: 'Allow Notifications', ja: '通知を許可', es: 'Permitir Notificaciones' }) }}
          </button>
          <span v-else class="text-xs font-bold text-success flex items-center gap-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            {{ t({ id: 'Aktif', en: 'Active', ja: '有効', es: 'Activo' }) }}
          </span>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider grow">
            {{ t({ id: 'Frekuensi Pengingat', en: 'Reminder Frequency', ja: 'リマインダーの頻度', es: 'Frecuencia de Recordatorio' }) }}
            <select
              :value="reminderInterval"
              @change="setReminderInterval(($event.target as HTMLSelectElement).value as any)"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary-soft focus:outline-none transition-all"
            >
              <option value="off">{{ t({ id: 'Matikan Pengingat', en: 'Disable Reminders', ja: 'リマインダーを無効化', es: 'Desactivar Recordatorios' }) }}</option>
              <option value="daily">{{ t({ id: 'Setiap Hari (Harian)', en: 'Daily', ja: '毎日 (日次)', es: 'Diario' }) }}</option>
              <option value="weekly">{{ t({ id: 'Setiap Minggu (Mingguan)', en: 'Weekly', ja: '毎週 (週次)', es: 'Semanal' }) }}</option>
              <option value="monthly">{{ t({ id: 'Setiap Bulan (Bulanan)', en: 'Monthly', ja: '毎月 (月次)', es: 'Mensual' }) }}</option>
            </select>
          </label>

          <button
            class="px-4 py-3 rounded-xl text-xs font-bold bg-surface-2 border border-border hover:bg-border text-text transition-all cursor-pointer sm:self-end shrink-0 flex items-center gap-1.5"
            type="button"
            @click="triggerImmediateTestNotification"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            {{ t({ id: 'Uji Coba Notifikasi', en: 'Test Notification', ja: 'テスト通知', es: 'Probar Notificación' }) }}
          </button>
        </div>
      </div>
    </section>

    <!-- Backup & Restore -->
    <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4">
      <h2 class="text-base font-bold text-text tracking-tight border-b border-border pb-3">{{ t({ id: 'Backup & Restore Data', en: 'Data Backup & Restore', ja: 'データのバックアップと復元', es: 'Respaldo y Restauración de Datos' }) }}</h2>
      <p class="text-xs text-muted leading-relaxed font-semibold -mt-2">{{ t({ id: 'Simpan salinan data transaksi Anda ke format JSON, atau pulihkan data dari berkas pencadangan lama.', en: 'Save a copy of your transaction data to JSON format, or restore data from an old backup file.', ja: '取引データのコピーをJSON形式で保存するか、古いバックアップファイルからデータを復元します。', es: 'Guarde una copia de los datos de sus transacciones en formato JSON o restaure los datos desde un archivo de respaldo antiguo.' }) }}</p>
      
      <div class="flex flex-wrap gap-3.5 mt-1">
        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md hover:shadow-primary/20 border-none" type="button" @click="exportBackup">
          {{ t({ id: 'Ekspor Data (.json)', en: 'Export Data (.json)', ja: 'データのエクスポート (.json)', es: 'Exportar Datos (.json)' }) }}
        </button>
        
        <label class="inline-flex items-center justify-center border border-border rounded-full px-5 py-3 bg-surface-2 text-text text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-border transition-all mr-auto">
          <span>{{ t({ id: 'Impor Data (.json)', en: 'Import Data (.json)', ja: 'データのインポート (.json)', es: 'Importar Datos (.json)' }) }}</span>
          <input type="file" accept=".json" @change="handleFileImport" class="hidden" />
        </label>

        <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md border-none" type="button" @click="handleResetAllData">
          {{ t({ id: 'Reset Semua Data (Mulai Baru)', en: 'Reset All Data (Start Fresh)', ja: 'すべてのデータをリセット (新規開始)', es: 'Restablecer Todos los Datos (Empezar de Nuevo)' }) }}
        </button>
      </div>
    </section>

    <!-- MODAL EDIT KATEGORI -->
    <div 
      v-if="editingCategoryId" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      @click.self="cancelEditCategory"
    >
      <div class="bg-surface border border-border rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <!-- Modal Header -->
        <header class="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div>
            <span class="text-xs font-bold text-primary uppercase tracking-widest">{{ t({ id: 'Detail & Koreksi Data', en: 'Details & Correction', ja: '詳細とデータ修正', es: 'Detalles y Corrección de Datos' }) }}</span>
            <h3 class="text-base font-extrabold text-text mt-0.5">{{ t({ id: 'Edit Kategori', en: 'Edit Category', ja: 'カテゴリーの編集', es: 'Editar Categoría' }) }}</h3>
          </div>
          <button 
            class="text-muted hover:text-text text-lg font-bold border-none bg-transparent cursor-pointer"
            @click="cancelEditCategory"
          >
            ✕
          </button>
        </header>

        <!-- Modal Form Body -->
        <div class="p-6 flex flex-col gap-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Nama Kategori', en: 'Category Name', ja: 'カテゴリー名', es: 'Nombre di Categoría' }) }}
            <input v-model="editingCategoryForm.name" :placeholder="t({ id: 'Contoh: Belanja', en: 'e.g., Shopping', ja: '例: ショッピング', es: 'ej. Compras' })" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all" />
          </label>
          
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Warna Identitas', en: 'Color Identity', ja: '色彩識別', es: 'Identidad di Color' }) }}
            <input v-model="editingCategoryForm.color" type="color" class="w-full h-10 p-0.5 bg-surface border border-border rounded-lg cursor-pointer" />
          </label>

          <!-- Popup Icon Picker Trigger for Editing -->
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Ikon Kategori', en: 'Category Icon', ja: 'カテゴリーアイコン', es: 'Icono de Categoría' }) }}
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl border border-border flex items-center justify-center bg-surface-2 text-text shadow-sm" :style="{ color: editingCategoryForm.color }">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="categoryIcons[editingCategoryForm.icon || 'tag']"></svg>
              </div>
              <button type="button" @click="openIconPicker(true)" class="px-4 py-2.5 rounded-xl border border-border bg-surface-2 hover:bg-border text-xs font-bold uppercase tracking-wider text-text transition-all cursor-pointer">
                {{ t({ id: 'Pilih Ikon...', en: 'Choose Icon...', ja: 'アイコンを選択...', es: 'Elegir Icono...' }) }}
              </button>
            </div>
          </label>

          <div class="flex gap-3 mt-2 border-t border-border pt-4">
            <button class="grow px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none" type="button" @click="handleUpdateCategory">
              {{ t({ id: 'Simpan', en: 'Save', ja: '保存', es: 'Guardar' }) }}
            </button>
            <button class="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer" type="button" @click="cancelEditCategory">
              {{ t({ id: 'Batal', en: 'Cancel', ja: 'キャンセル', es: 'Cancelar' }) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Icon Picker Popup -->
    <div v-if="showIconPicker" class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div class="bg-surface border border-border rounded-3xl w-full max-w-md shadow-2xl p-5 lg:p-6 flex flex-col gap-4 max-h-[85vh] relative animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 class="text-base font-bold text-text">
            {{ t({ id: 'Pilih Ikon Kategori', en: 'Select Category Icon', ja: 'カテゴリーアイコンの選択', es: 'Seleccionar Icono de Categoría' }) }}
          </h3>
          <button @click="showIconPicker = false" class="w-8 h-8 rounded-full flex items-center justify-center bg-surface-2 hover:bg-border text-muted hover:text-text border-none cursor-pointer transition-all">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            v-model="iconSearchQuery"
            :placeholder="t({ id: 'Cari nama ikon / kategori...', en: 'Search icon / category name...', ja: 'アイコンやカテゴリーを検索...', es: 'Buscar icono / nombre de categoría...' })"
            class="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface-2 text-text text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-soft focus:border-primary transition-all"
            autofocus
          />
        </div>

        <!-- Content Area -->
        <div class="overflow-y-auto flex-1 pr-1 flex flex-col gap-4">
          <div v-for="group in filteredIconGroups" :key="group.name" class="flex flex-col gap-1.5">
            <span class="text-sm font-extrabold text-muted uppercase tracking-wider border-b border-border pb-1">
              {{ t(group.nameTranslations as any) }}
            </span>
            <div class="grid grid-cols-6 gap-2 mt-1">
              <button
                v-for="icon in group.icons"
                :key="icon.key"
                type="button"
                class="aspect-square rounded-xl border border-border flex items-center justify-center cursor-pointer transition-all hover:bg-primary-soft hover:text-primary"
                :class="(isEditingIconPicker ? editingCategoryForm.icon : categoryForm.icon) === icon.key ? 'border-primary bg-primary-soft text-primary shadow-xs ring-2 ring-primary-soft' : 'bg-surface-2 text-text'"
                @click="selectCategoryIcon(icon.key)"
                :title="t(icon.labelTranslations as any)"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" v-html="categoryIcons[icon.key]"></svg>
              </button>
            </div>
          </div>
          <!-- Empty State -->
          <div v-if="filteredIconGroups.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
            <svg class="w-8 h-8 text-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <p class="text-xs font-bold text-muted">{{ t({ id: 'Ikon tidak ditemukan', en: 'No icons found', ja: 'アイコンが見つかりません', es: 'No se encontraron iconos' }) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
