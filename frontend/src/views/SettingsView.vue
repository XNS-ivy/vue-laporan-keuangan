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
} = useFinance()

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
</script>

<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Settings</p>
        <h1>Preferensi pengguna</h1>
        <p>Atur tampilan sesuai kenyamanan Anda sebelum diterapkan.</p>
      </div>
    </header>

    <section class="card">
      <h2>Tema</h2>
      <p>Pilih mode dasar, masukkan warna HEX sendiri, atau pakai preset. Sekarang picker warna juga punya pop-up, preview lingkaran, dan slider alpha.</p>
      <label class="field">
        <span>Mode tema</span>
        <select v-model="themeDraft.mode">
          <option v-for="item in themeOptions" :key="item" :value="item">
            {{ labelForTheme(item) }}
          </option>
        </select>
      </label>

      <div class="grid">
        <label class="field">
          <span>Background</span>
          <select v-model="themeDraft.surfaceMode">
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </select>
        </label>

        <div class="field">
          <span>Warna utama</span>
          <button class="picker-trigger" type="button" @click="pickerOpen = !pickerOpen">
            <span class="picker-dot" :style="previewSwatchStyle"></span>
            <span>{{ themeDraft.primary.toUpperCase() }}</span>
            <span class="alpha-badge">Alpha {{ Math.round(themeDraft.primaryAlpha * 100) }}%</span>
          </button>

          <div v-if="pickerOpen" class="picker-popover">
            <label class="picker-field">
              <span>Pilih warna</span>
              <input v-model="themeDraft.primary" type="color" />
            </label>

            <label class="picker-field">
              <span>HEX</span>
              <input v-model="themeDraft.primary" type="text" placeholder="#2563eb" />
            </label>

            <label class="picker-field">
              <span>Alpha</span>
              <input v-model.number="themeDraft.primaryAlpha" type="range" min="0" max="1" step="0.01" />
            </label>

            <div class="swatch-row">
              <button
                v-for="item in quickSwatches"
                :key="item"
                class="swatch-btn"
                type="button"
                :style="{ background: item }"
                @click="applySwatch(item)"
              ></button>
            </div>
          </div>
        </div>

        <label class="field">
          <span>Preset palette</span>
          <select v-model="selectedPreset" @change="applyPreset">
            <option value="">Pilih preset</option>
            <option v-for="item in themePresets" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="preview-panel">
        <div class="preview-card">
          <span>Preview tombol</span>
          <button
            class="preview-button"
            type="button"
            :style="{ background: toRgba(themeDraft.primary, themeDraft.primaryAlpha), color: previewContrast }"
          >
            Simpan
          </button>
        </div>
        <div class="preview-card">
          <span>Preview form</span>
          <div class="preview-field">Input akan menyesuaikan warna tema aktif</div>
        </div>
      </div>

      <button class="primary-btn" @click="savePreferences">Simpan Preferensi</button>
      <p v-if="savedMessage" class="status">{{ savedMessage }}</p>
    </section>

    <section class="card">
      <h2>Kelola Kategori Keuangan</h2>
      <p class="subtle">Kelola nama, warna aksen, dan emoji ikon untuk setiap kategori.</p>
      
      <div class="category-manager">
        <!-- Form Editor Kategori -->
        <div class="category-editor-card">
          <h3>{{ editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori Baru' }}</h3>
          
          <div v-if="!editingCategoryId" class="form-grid-small">
            <label>
              <span>Nama Kategori</span>
              <input v-model="categoryForm.name" placeholder="Contoh: Hiburan" />
            </label>
            <label>
              <span>Jenis</span>
              <select v-model="categoryForm.type">
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </label>
            <label>
              <span>Warna</span>
              <input v-model="categoryForm.color" type="color" class="color-picker-input" />
            </label>
            <label>
              <span>Ikon (Emoji)</span>
              <select v-model="categoryForm.icon">
                <option v-for="item in quickEmojis" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <button class="primary-btn full-width" type="button" @click="handleAddCategory">Tambah Kategori</button>
          </div>

          <div v-else class="form-grid-small">
            <label>
              <span>Nama Kategori</span>
              <input v-model="editingCategoryForm.name" placeholder="Contoh: Hiburan" />
            </label>
            <label>
              <span>Warna</span>
              <input v-model="editingCategoryForm.color" type="color" class="color-picker-input" />
            </label>
            <label>
              <span>Ikon (Emoji)</span>
              <select v-model="editingCategoryForm.icon">
                <option v-for="item in quickEmojis" :key="item" :value="item">{{ item }}</option>
              </select>
            </label>
            <div class="button-group-row">
              <button class="primary-btn flex-grow" type="button" @click="handleUpdateCategory">Simpan</button>
              <button class="secondary-btn" type="button" @click="cancelEditCategory">Batal</button>
            </div>
          </div>
        </div>

        <!-- Daftar Kategori Aktif -->
        <div class="categories-list-container">
          <h3>Daftar Kategori</h3>
          
          <div class="category-columns">
            <div class="category-col">
              <h4>Pemasukan</h4>
              <ul class="settings-category-list">
                <li v-for="item in categories.filter(c => c.type === 'income')" :key="item.id" class="settings-category-item">
                  <div class="category-item-info">
                    <span class="category-item-icon">{{ item.icon || '📈' }}</span>
                    <span class="category-item-dot" :style="{ background: item.color || '#16a34a' }"></span>
                    <span class="category-item-name">{{ item.name }}</span>
                  </div>
                  <div class="category-item-actions">
                    <button class="small-edit-btn" type="button" @click="startEditCategory(item)">✏️</button>
                    <button class="small-delete-btn" type="button" @click="deleteCategory(item.id)">🗑️</button>
                  </div>
                </li>
              </ul>
            </div>

            <div class="category-col">
              <h4>Pengeluaran</h4>
              <ul class="settings-category-list">
                <li v-for="item in categories.filter(c => c.type === 'expense')" :key="item.id" class="settings-category-item">
                  <div class="category-item-info">
                    <span class="category-item-icon">{{ item.icon || '💸' }}</span>
                    <span class="category-item-dot" :style="{ background: item.color || '#ef4444' }"></span>
                    <span class="category-item-name">{{ item.name }}</span>
                  </div>
                  <div class="category-item-actions">
                    <button class="small-edit-btn" type="button" @click="startEditCategory(item)">✏️</button>
                    <button class="small-delete-btn" type="button" @click="deleteCategory(item.id)">🗑️</button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Backup & Restore Data</h2>
      <p class="subtle">Ekspor seluruh data transaksi, anggaran, aset, target tabungan, dan utang piutang ke file JSON atau pulihkan data dari file JSON sebelumnya.</p>
      <div class="backup-actions">
        <button class="primary-btn" type="button" @click="exportBackup">Ekspor Data (.json)</button>
        <label class="file-import-label">
          <span>Impor Data (.json)</span>
          <input type="file" accept=".json" @change="handleFileImport" class="file-input" />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), var(--hero-accent)); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.75rem; opacity: 0.8; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.9rem; margin: 1rem 0; align-items: start; }
.field { display: flex; flex-direction: column; gap: 0.35rem; position: relative; }
.picker-trigger { display: flex; align-items: center; gap: 0.7rem; justify-content: space-between; border: 1px solid var(--border); border-radius: 14px; padding: 0.8rem 0.9rem; background: var(--surface-2); color: var(--text); cursor: pointer; }
.picker-dot { width: 1.35rem; height: 1.35rem; border-radius: 999px; border: 2px solid rgba(255,255,255,0.7); box-shadow: 0 0 0 1px var(--border); flex: 0 0 auto; }
.alpha-badge { color: var(--muted); font-size: 0.85rem; }
.picker-popover { margin-top: 0.5rem; border: 1px solid var(--border); border-radius: 16px; padding: 0.9rem; background: var(--surface); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 0.8rem; }
.picker-field { display: flex; flex-direction: column; gap: 0.35rem; }
.picker-field input[type='color'] { padding: 0.35rem; min-height: 3rem; }
.swatch-row { display: flex; flex-wrap: wrap; gap: 0.55rem; }
.swatch-btn { width: 2rem; height: 2rem; border-radius: 999px; border: 2px solid rgba(255,255,255,0.75); box-shadow: 0 0 0 1px var(--border); cursor: pointer; }
.preview-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.9rem; margin-bottom: 1rem; }
.preview-card { border: 1px solid var(--border); border-radius: 16px; padding: 1rem; background: var(--surface-2); display: flex; flex-direction: column; gap: 0.7rem; }
.preview-button { border: none; border-radius: 999px; padding: 0.75rem 1rem; width: fit-content; }
.preview-field { border: 1px solid var(--border); border-radius: 12px; padding: 0.8rem 0.9rem; background: var(--surface); color: var(--muted); }
.status { color: var(--success); margin-top: 0.6rem; }
.subtle { color: var(--muted); margin-top: 0.1rem; }
.backup-actions { display: flex; gap: 0.9rem; flex-wrap: wrap; margin-top: 1rem; }
.file-import-label { display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 999px; padding: 0.72rem 1rem; background: var(--surface-2); color: var(--text); cursor: pointer; transition: transform 0.2s ease, background-color 0.25s ease; }
.file-import-label:hover { transform: translateY(-1px); background: var(--border); }
.file-input { display: none; }

/* Category Manager Styles */
.category-manager { display: grid; grid-template-columns: 260px 1fr; gap: 1.2rem; margin-top: 1rem; }
.category-editor-card { border: 1px solid var(--border); border-radius: 16px; padding: 1rem; background: var(--surface-2); height: fit-content; }
.category-editor-card h3, .categories-list-container h3 { margin-top: 0; margin-bottom: 0.8rem; font-size: 1.1rem; }
.form-grid-small { display: flex; flex-direction: column; gap: 0.8rem; }
.form-grid-small label span { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.25rem; }
.color-picker-input { padding: 0.2rem; min-height: 2.5rem; border-radius: 10px; cursor: pointer; }
.full-width { width: 100%; }
.button-group-row { display: flex; gap: 0.5rem; }
.flex-grow { flex-grow: 1; }
.secondary-btn { border: 1px solid var(--border); border-radius: 999px; padding: 0.72rem 1rem; background: var(--surface-2); color: var(--text); cursor: pointer; transition: transform 0.2s ease, background-color 0.25s ease; }
.secondary-btn:hover { transform: translateY(-1px); background: var(--border); }
.categories-list-container { border: 1px solid var(--border); border-radius: 16px; padding: 1rem; background: var(--surface); }
.category-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.category-col h4 { margin-top: 0; margin-bottom: 0.6rem; font-size: 0.95rem; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
.settings-category-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.settings-category-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.6rem; background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; }
.category-item-info { display: flex; align-items: center; gap: 0.5rem; }
.category-item-icon { font-size: 1.1rem; }
.category-item-dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; }
.category-item-name { font-size: 0.95rem; font-weight: 500; }
.category-item-actions { display: flex; gap: 0.3rem; }
.small-edit-btn, .small-delete-btn { border: none; background: transparent; cursor: pointer; padding: 0.2rem; font-size: 0.9rem; border-radius: 6px; transition: background-color 0.2s ease; }
.small-edit-btn:hover { background: rgba(37, 99, 235, 0.1); }
.small-delete-btn:hover { background: var(--danger-soft); }
@media (max-width: 900px) {
  .category-manager { grid-template-columns: 1fr; }
  .category-columns { grid-template-columns: 1fr; }
}
</style>
