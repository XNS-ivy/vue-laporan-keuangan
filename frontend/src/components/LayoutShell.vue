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
  <div class="grid lg:grid-cols-[280px_1fr] h-screen bg-bg-soft relative overflow-hidden">
    <!-- Menu Toggle (Mobile) -->
    <button
      v-if="!sidebarOpen"
      class="fixed top-4 left-4 z-30 border-none rounded-xl w-11 h-11 bg-primary text-primary-contrast flex items-center justify-center shadow-custom lg:hidden cursor-pointer hover:scale-105 active:scale-95 transition-all"
      type="button"
      @click="sidebarOpen = true"
      aria-label="Buka menu"
    >
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>

    <!-- Overlay (Mobile) -->
    <div
      v-if="sidebarOpen && !isDesktop"
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-20 lg:hidden transition-opacity"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed lg:static inset-y-0 left-0 w-70 h-screen max-h-screen p-5 bg-linear-to-b from-sidebar-bg to-sidebar-accent text-sidebar-text flex flex-col gap-6 shadow-2xl lg:shadow-none z-30 transition-transform duration-300 ease-in-out"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Close Sidebar Button (Mobile) -->
      <button
        v-if="!isDesktop"
        class="lg:hidden self-end border-none bg-white/10 hover:bg-white/15 text-sidebar-text w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
        type="button"
        @click="closeSidebar"
        aria-label="Tutup menu"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- Brand Block -->
      <div class="brand-block flex flex-col gap-1 border-b border-white/10 pb-4">
        <div>
          <p class="uppercase tracking-widest text-[10px] text-white/60 font-bold">Personal Finance</p>
          <h2 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-primary-muted animate-pulse" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.267-.267c.947-.946 2.482-.946 3.428 0l.27.27a2.424 2.424 0 010 3.428l-.27.27c-.947.946-2.482.946-3.428 0l-.267-.267M12 6.75V3m0 18v-3.75M8.25 12h7.5" />
            </svg>
            MyFinanceFlow
          </h2>
        </div>
        <p class="text-xs text-white/70 leading-relaxed mt-1">Pantau uang Anda dengan lebih tenang dan terarah.</p>
      </div>

      <!-- Navigation Links -->
      <nav class="flex flex-col gap-1.5 overflow-y-auto pr-1 grow min-h-0">
        <RouterLink to="/" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/transactions" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          <span>Transaksi</span>
        </RouterLink>
        <RouterLink to="/planning" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Planning</span>
        </RouterLink>
        <RouterLink to="/savings-goal" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>Target Tabungan</span>
        </RouterLink>
        <RouterLink to="/assets" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Aset</span>
        </RouterLink>
        <RouterLink to="/debts" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 3H4v18h16V7l-4-4z" />
            <path d="M14 3v4h4" />
            <circle cx="10" cy="12" r="2" />
          </svg>
          <span>Utang Piutang</span>
        </RouterLink>
        <RouterLink to="/reports" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Reports</span>
        </RouterLink>
        <RouterLink to="/settings" class="nav-link group" @click="closeSidebar">
          <svg class="w-5 h-5 opacity-80 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </RouterLink>
      </nav>

      <!-- Date Filter Panel -->
      <section class="mt-auto border border-white/10 rounded-2xl p-4 bg-white/5 flex flex-col gap-3 backdrop-blur-xs">
        <div class="flex items-center justify-between">
          <strong class="text-xs font-semibold text-white">Filter Tanggal</strong>
          <button
            v-if="hasDateFilter"
            class="border-none rounded-full px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/35 text-[10px] text-white cursor-pointer font-medium transition-colors"
            type="button"
            @click="resetGlobalDateFilter"
          >
            Reset
          </button>
        </div>
        <label class="flex flex-col gap-1 text-[11px] text-white/60">
          <span class="font-bold uppercase tracking-wider">Dari</span>
          <input
            :value="globalDateFilter.start"
            type="date"
            class="bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 w-full transition-all"
            @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="flex flex-col gap-1 text-[11px] text-white/60">
          <span class="font-bold uppercase tracking-wider">Sampai</span>
          <input
            :value="globalDateFilter.end"
            type="date"
            class="bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 w-full transition-all"
            @input="setGlobalDateFilter({ end: ($event.target as HTMLInputElement).value })"
          />
        </label>
      </section>
    </aside>

    <!-- Content Area -->
    <main class="h-screen overflow-y-auto p-5 lg:p-8 pt-20 lg:pt-8 bg-bg-soft">
      <RouterView />
    </main>

    <!-- Toast stack notifications -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 lg:px-0">
      <button
        v-for="item in toasts"
        :key="item.id"
        class="w-full text-left rounded-2xl p-4 text-white text-xs font-semibold shadow-xl cursor-pointer hover:opacity-90 active:scale-98 transition-all flex items-center justify-between border border-white/10"
        :class="{
          'bg-emerald-600': item.tone === 'success',
          'bg-blue-600': item.tone === 'info',
          'bg-amber-600': item.tone === 'warning',
          'bg-red-600': item.tone === 'error'
        }"
        type="button"
        @click="removeToast(item.id)"
      >
        <span>{{ item.message }}</span>
        <svg class="w-4 h-4 opacity-70" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(248, 250, 252, 0.8);
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>

