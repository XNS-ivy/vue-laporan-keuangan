<script setup lang="ts">
import { onMounted, ref } from 'vue'

const themeOptions = ['light', 'dark', 'midnight']
const themeDraft = ref('light')
const savedMessage = ref('')

const labelForTheme = (value: string) => {
  if (value === 'dark') return 'Gelap'
  if (value === 'midnight') return 'Midnight'
  return 'Terang'
}

onMounted(() => {
  const saved = localStorage.getItem('finance-theme') || 'light'
  themeDraft.value = saved
})

const savePreferences = () => {
  localStorage.setItem('finance-theme', themeDraft.value)
  document.documentElement.setAttribute('data-theme', themeDraft.value)
  window.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: { theme: themeDraft.value } }))
  savedMessage.value = `Tema disimpan: ${labelForTheme(themeDraft.value)}`
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
      <p>Pilih tema yang ingin Anda pakai. Perubahan akan diterapkan setelah Anda menekan tombol simpan.</p>
      <label class="field">
        <span>Pilih tema</span>
        <select v-model="themeDraft">
          <option v-for="item in themeOptions" :key="item" :value="item">
            {{ labelForTheme(item) }}
          </option>
        </select>
      </label>
      <button class="primary-btn" @click="savePreferences">Simpan Preferensi</button>
      <p v-if="savedMessage" class="status">{{ savedMessage }}</p>
    </section>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 1rem; }
.hero { background: linear-gradient(135deg, var(--sidebar-bg), #2563eb); color: white; border-radius: 24px; padding: 1.3rem 1.4rem; box-shadow: var(--shadow); }
.eyebrow { text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.75rem; opacity: 0.8; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 1rem; box-shadow: var(--shadow); }
.field { display: flex; flex-direction: column; gap: 0.35rem; max-width: 320px; margin: 0.8rem 0; }
select, button { font: inherit; }
select { border: 1px solid var(--border); border-radius: 10px; padding: 0.7rem 0.8rem; background: var(--surface-2); color: var(--text); }
.primary-btn { border: none; border-radius: 999px; padding: 0.7rem 1rem; background: #2563eb; color: white; cursor: pointer; }
.status { color: #16a34a; margin-top: 0.6rem; }
</style>
