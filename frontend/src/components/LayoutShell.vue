<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { applyThemeSettings, getThemeSettings, type ThemeSettings } from '../composables/useTheme'

const theme = ref<ThemeSettings>(getThemeSettings())
const sidebarOpen = ref(false)
const isDesktop = ref(false)

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
    </aside>

    <main class="content">
      <RouterView />
    </main>
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
}
</style>
