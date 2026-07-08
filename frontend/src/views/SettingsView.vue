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

const themeOptions: ThemeMode[] = ['light', 'dark', 'midnight']
const themeDraft = ref<ThemeSettings>(getThemeSettings())
const selectedPreset = ref('')
const savedMessage = ref('')
const pickerOpen = ref(false)
const { pushToast } = useUi()

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
</style>
