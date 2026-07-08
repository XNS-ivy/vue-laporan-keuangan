<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { applyThemeSettings, getThemeSettings, type ThemeSettings } from '../composables/useTheme'
import { useUi } from '../composables/useUi'

const theme = ref<ThemeSettings>(getThemeSettings())
const sidebarOpen = ref(false)
const isDesktop = ref(false)
const { globalDateFilter, hasDateFilter, resetGlobalDateFilter, setGlobalDateFilter, toasts, removeToast } = useUi()

const syncViewport = () => {
  isDesktop.value = window.innerWidth > 900
  if (isDesktop.value) {
    sidebarOpen.value = true
  }
}

const sidebarStateLabel = computed(() => (sidebarOpen.value ? 'Tutup menu' : 'Buka menu'))

const handleThemeChange = (event: Event) => {
  const customEvent = event as CustomEvent<ThemeSettings>
  theme.value = customEvent.detail
  applyThemeSettings(theme.value)
}

const closeSidebar = () => {
  if (!isDesktop.value) {
    sidebarOpen.value = false
  }
}

onMounted(() => {
  applyThemeSettings(theme.value)
  syncViewport()
  window.addEventListener('resize', syncViewport)
  window.addEventListener('theme-preference-changed', handleThemeChange as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
  window.removeEventListener('theme-preference-changed', handleThemeChange as EventListener)
})
</script>

<template>
  <div class="shell">
    <button class="menu-toggle" type="button" @click="sidebarOpen = !sidebarOpen" :aria-label="sidebarStateLabel">
      {{ sidebarOpen ? 'Tutup' : 'Menu' }}
    </button>

    <div v-if="sidebarOpen && !isDesktop" class="overlay" @click="closeSidebar"></div>

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand-block">
        <div>
          <p class="eyebrow">Personal Finance</p>
          <h2>Finance Flow</h2>
        </div>
        <p class="subtitle">Pantau uang Anda dengan lebih tenang dan terarah.</p>
      </div>

      <nav>
        <RouterLink to="/" class="nav-link" @click="closeSidebar">Dashboard</RouterLink>
        <RouterLink to="/transactions" class="nav-link" @click="closeSidebar">Transaksi</RouterLink>
        <RouterLink to="/planning" class="nav-link" @click="closeSidebar">Planning</RouterLink>
        <RouterLink to="/savings-goal" class="nav-link" @click="closeSidebar">Target Tabungan</RouterLink>
        <RouterLink to="/assets" class="nav-link" @click="closeSidebar">Aset</RouterLink>
        <RouterLink to="/debts" class="nav-link" @click="closeSidebar">Utang Piutang</RouterLink>
        <RouterLink to="/reports" class="nav-link" @click="closeSidebar">Reports</RouterLink>
        <RouterLink to="/settings" class="nav-link" @click="closeSidebar">Settings</RouterLink>
      </nav>

      <section class="filter-panel">
        <div class="filter-head">
          <strong>Filter tanggal</strong>
          <button v-if="hasDateFilter" class="clear-btn" type="button" @click="resetGlobalDateFilter">Reset</button>
        </div>
        <label class="filter-field">
          <span>Dari</span>
          <input :value="globalDateFilter.start" type="date" @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })" />
        </label>
        <label class="filter-field">
          <span>Sampai</span>
          <input :value="globalDateFilter.end" type="date" @input="setGlobalDateFilter({ end: ($event.target as HTMLInputElement).value })" />
        </label>
      </section>
    </aside>

    <main class="content">
      <RouterView />
    </main>

    <div class="toast-stack">
      <button
        v-for="item in toasts"
        :key="item.id"
        class="toast"
        :class="item.tone"
        type="button"
        @click="removeToast(item.id)"
      >
        {{ item.message }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background: var(--bg-soft);
  position: relative;
}

.menu-toggle {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 30;
  border: none;
  border-radius: 999px;
  padding: 0.72rem 1rem;
  background: var(--primary);
  color: var(--primary-contrast);
  cursor: pointer;
  box-shadow: var(--shadow);
  display: none;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.48);
  z-index: 15;
}

.sidebar {
  padding: 1.4rem;
  background: linear-gradient(180deg, var(--sidebar-bg) 0%, var(--sidebar-accent) 100%);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 12px 0 30px rgba(15, 23, 42, 0.14);
  z-index: 20;
}

.brand-block {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.24em;
  font-size: 0.72rem;
  opacity: 0.8;
  margin: 0;
}

.sidebar h2 {
  margin: 0;
  font-size: 1.2rem;
}

.subtitle {
  margin: 0.2rem 0 0;
  color: color-mix(in srgb, var(--sidebar-text) 72%, transparent);
  line-height: 1.5;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.6rem;
}

.filter-panel {
  margin-top: auto;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 16px;
  padding: 0.9rem;
  background: rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.filter-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: var(--sidebar-text);
}

.filter-field input {
  background: rgba(255,255,255,0.12);
  color: var(--sidebar-text);
  border-color: rgba(255,255,255,0.18);
}

.clear-btn {
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  background: rgba(255,255,255,0.16);
  color: white;
  cursor: pointer;
}

.nav-link {
  color: var(--sidebar-text);
  text-decoration: none;
  padding: 0.8rem 0.95rem;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255,255,255,0.16);
  color: white;
  transform: translateX(2px);
}

.content {
  padding: 1.35rem;
}

.toast-stack {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.toast {
  min-width: 220px;
  max-width: 320px;
  text-align: left;
  border: none;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  color: white;
  cursor: pointer;
  box-shadow: var(--shadow);
}

.toast.success { background: #15803d; }
.toast.info { background: #2563eb; }
.toast.warning { background: #d97706; }
.toast.error { background: #b91c1c; }

@media (max-width: 900px) {
  .shell {
    grid-template-columns: 1fr;
  }

  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(82vw, 320px);
    transform: translateX(-105%);
    transition: transform 0.25s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .content {
    padding-top: 4.8rem;
  }

  .toast-stack {
    left: 1rem;
    right: 1rem;
  }

  .toast {
    max-width: none;
    width: 100%;
  }
}
</style>
