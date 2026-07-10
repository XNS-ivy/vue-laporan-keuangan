<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { applyThemeSettings, getThemeSettings, type ThemeSettings, themePresets, type ThemeMode } from '../composables/useTheme'
import { useUi } from '../composables/useUi'
import { useFinance } from '../composables/useFinance'

const theme = ref<ThemeSettings>(getThemeSettings())
const sidebarOpen = ref(false)
const isDesktop = ref(false)
const { globalDateFilter, hasDateFilter, resetGlobalDateFilter, setGlobalDateFilter, toasts, removeToast } = useUi()
const { exportJsonData, addTransaction, categories } = useFinance()
const route = useRoute()

// Scroll tracking and Floating apps states
const mainElement = ref<HTMLElement | null>(null)
const showScrollTop = ref(false)
const showFloatingMenu = ref(false)
const dateFilterExpanded = ref(false)

// Quick transaction form states
const showQuickTxModal = ref(false)
const quickTxForm = ref({
  type: 'expense' as 'income' | 'expense',
  amount: '',
  category: '',
  note: '',
  date: new Date().toISOString().slice(0, 10)
})

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (target) {
    showScrollTop.value = target.scrollTop > 200
  }
}

const scrollToTop = () => {
  if (mainElement.value) {
    mainElement.value.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

// Reset main container scroll to top on route change
watch(() => route.path, () => {
  if (mainElement.value) {
    mainElement.value.scrollTop = 0
  }
  showFloatingMenu.value = false
  dateFilterExpanded.value = false
})

const syncViewport = () => {
  isDesktop.value = window.innerWidth > 900
  if (isDesktop.value) {
    sidebarOpen.value = true
  }
}

const sidebarStateLabel = computed(() => (sidebarOpen.value ? 'Tutup menu' : 'Buka menu'))

let systemThemeMedia: MediaQueryList | null = null
let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null

const setupSystemThemeListener = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return
  cleanupSystemThemeListener()
  
  if (!localStorage.getItem('finance-theme-settings')) {
    systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    systemThemeListener = (e: MediaQueryListEvent) => {
      const mode = (e.matches ? 'dark' : 'light') as ThemeMode
      const surfaceMode = (e.matches ? 'dark' : 'light') as 'light' | 'dark'
      const primary = e.matches ? '#0f766e' : '#2563eb'
      const newTheme: ThemeSettings = {
        mode,
        primary,
        primaryAlpha: 1,
        surfaceMode
      }
      theme.value = newTheme
      applyThemeSettings(newTheme)
      window.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: newTheme }))
    }
    systemThemeMedia.addEventListener('change', systemThemeListener)
  }
}

const cleanupSystemThemeListener = () => {
  if (systemThemeMedia && systemThemeListener) {
    systemThemeMedia.removeEventListener('change', systemThemeListener)
  }
  systemThemeMedia = null
  systemThemeListener = null
}

const handleResetToSystem = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const systemTheme: ThemeSettings = {
    mode: (prefersDark ? 'dark' : 'light') as ThemeMode,
    primary: prefersDark ? '#0f766e' : '#2563eb',
    primaryAlpha: 1,
    surfaceMode: (prefersDark ? 'dark' : 'light') as 'light' | 'dark'
  }
  theme.value = systemTheme
  applyThemeSettings(systemTheme)
  setupSystemThemeListener()
}

const handleThemeChange = (event: Event) => {
  const customEvent = event as CustomEvent<ThemeSettings>
  theme.value = customEvent.detail
  applyThemeSettings(theme.value)
  setupSystemThemeListener()
}

const closeSidebar = () => {
  if (!isDesktop.value) {
    sidebarOpen.value = false
  }
}

// Cycle theme quickly (Light -> Dark -> Midnight -> Light)
const cycleTheme = () => {
  const modes: Array<'light' | 'dark' | 'midnight'> = ['light', 'dark', 'midnight']
  const nextModeIndex = (modes.indexOf(theme.value.mode) + 1) % modes.length
  const nextMode = modes[nextModeIndex]!
  
  const preset = themePresets.find(p => p.mode === nextMode) || themePresets[0]!
  
  const updatedTheme: ThemeSettings = {
    mode: preset.mode,
    primary: preset.primary,
    primaryAlpha: theme.value.primaryAlpha,
    surfaceMode: preset.surfaceMode
  }
  
  theme.value = updatedTheme
  applyThemeSettings(updatedTheme)
  window.localStorage.setItem('finance-theme-settings', JSON.stringify(updatedTheme))
  window.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: updatedTheme }))
  showFloatingMenu.value = false
}

// Download backup JSON file
const downloadBackup = () => {
  const jsonString = exportJsonData()
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showFloatingMenu.value = false
}

// Submit quick transaction
const submitQuickTx = () => {
  if (!quickTxForm.value.amount || !quickTxForm.value.category) return
  addTransaction({
    type: quickTxForm.value.type,
    amount: Number(quickTxForm.value.amount),
    category: quickTxForm.value.category,
    note: quickTxForm.value.note || 'Transaksi Pintas',
    date: quickTxForm.value.date
  })
  
  // Reset form
  quickTxForm.value = {
    type: 'expense',
    amount: '',
    category: '',
    note: '',
    date: new Date().toISOString().slice(0, 10)
  }
  showQuickTxModal.value = false
}

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === quickTxForm.value.type)
})

onMounted(() => {
  applyThemeSettings(theme.value)
  syncViewport()
  window.addEventListener('resize', syncViewport)
  window.addEventListener('theme-preference-changed', handleThemeChange as EventListener)
  window.addEventListener('theme-reset-to-system', handleResetToSystem)
  setupSystemThemeListener()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport)
  window.removeEventListener('theme-preference-changed', handleThemeChange as EventListener)
  window.removeEventListener('theme-reset-to-system', handleResetToSystem)
  cleanupSystemThemeListener()
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
      class="fixed lg:static inset-y-0 left-0 w-70 h-screen max-h-screen p-4 lg:p-5 bg-linear-to-b from-sidebar-bg to-sidebar-accent text-sidebar-text flex flex-col gap-4 lg:gap-6 shadow-2xl lg:shadow-none z-30 transition-transform duration-300 ease-in-out"
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
        <p class="text-xs text-white/70 leading-relaxed mt-1">Pantau uangmu dengan lebih tenang dan terarah.</p>
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

        <!-- Date Filter Panel inside nav (raised and expands inline) -->
        <div class="relative select-none mt-2 shrink-0">
          <button
            class="w-full border border-white/10 rounded-xl py-2 px-3.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white flex items-center justify-between cursor-pointer transition-all"
            type="button"
            @click="dateFilterExpanded = !dateFilterExpanded"
          >
            <div class="flex items-center gap-2">
              <svg 
                class="w-3.5 h-3.5 text-white/80 transition-transform duration-200" 
                :class="{ 'rotate-180': dateFilterExpanded }" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <strong class="text-xs font-semibold">Filter Tanggal</strong>
              <span v-if="hasDateFilter" class="text-[9px] bg-primary/30 text-white border border-white/10 rounded-sm px-1.5 py-0.5 font-bold uppercase tracking-wider scale-90">
                Aktif
              </span>
            </div>
            <span class="text-[10px] text-white/50">{{ dateFilterExpanded ? 'Tutup' : 'Buka' }}</span>
          </button>

          <!-- Inline Dropdown Menu (No floating absolute popup) -->
          <div
            v-if="dateFilterExpanded"
            class="mt-2 border border-white/15 rounded-xl p-3 bg-slate-900/40 flex flex-col gap-3 transition-all animate-in fade-in duration-200"
          >
            <div class="flex items-center justify-between border-b border-white/10 pb-2">
              <span class="text-[9px] font-bold text-white/60 uppercase tracking-wider">Rentang Waktu</span>
              <button
                v-if="hasDateFilter"
                class="border-none rounded-full px-2 py-0.5 bg-white/10 hover:bg-white/20 active:bg-white/35 text-[9px] text-white cursor-pointer font-semibold transition-colors"
                type="button"
                @click="resetGlobalDateFilter"
              >
                Reset
              </button>
            </div>
            <label class="flex flex-col gap-1 text-[10px] text-white/60">
              <span class="font-bold uppercase tracking-wider">Dari</span>
              <input
                :value="globalDateFilter.start"
                type="date"
                class="bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 w-full transition-all"
                @input="setGlobalDateFilter({ start: ($event.target as HTMLInputElement).value })"
              />
            </label>
            <label class="flex flex-col gap-1 text-[10px] text-white/60">
              <span class="font-bold uppercase tracking-wider">Sampai</span>
              <input
                :value="globalDateFilter.end"
                type="date"
                class="bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20 w-full transition-all"
                @input="setGlobalDateFilter({ end: ($event.target as HTMLInputElement).value })"
              />
            </label>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Content Area -->
    <main 
      ref="mainElement" 
      @scroll="handleScroll"
      class="h-screen overflow-y-auto p-5 lg:p-8 pt-20 lg:pt-8 bg-bg-soft flex flex-col justify-between"
    >
      <div class="grow">
        <RouterView />
      </div>

      <!-- Footer -->
      <footer class="mt-12 border-t border-border/80 pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted select-none shrink-0">
        <div class="flex items-center gap-3">
          <img src="https://avatars.githubusercontent.com/u/140568381?v=4" alt="XNS-ivy GitHub Profile" class="w-10 h-10 rounded-full border border-border/80 shadow-xs shrink-0" />
          <div class="flex flex-col text-left">
            <span class="font-bold text-text">Developed by XNS-ivy</span>
            <span class="font-medium text-[10px] text-muted">Aplikasi Laporan Keuangan Pribadi (Offline-First)</span>
          </div>
        </div>
        <div class="flex items-center gap-4 font-semibold text-xs">
          <a href="https://github.com/XNS-ivy" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors flex items-center gap-1.5">
             GitHub
          </a>
          <span class="text-border/60">|</span>
          <a href="mailto:ayramusic.nightcore@gmail.com" class="hover:text-primary transition-colors flex items-center gap-1.5">
             Email
          </a>
          <span class="text-border/60">|</span>
          <RouterLink to="/privacy" class="hover:text-primary transition-colors">Kebijakan Privasi</RouterLink>
          <span class="text-border/60">|</span>
          <RouterLink to="/terms" class="hover:text-primary transition-colors">Ketentuan Layanan</RouterLink>
        </div>
      </footer>
    </main>

    <!-- Scroll to Top Button (Floating just above the utility button) -->
    <button
      v-if="showScrollTop"
      class="fixed bottom-20.5 right-6 z-40 border-none rounded-full w-12 h-12 bg-primary text-primary-contrast flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all animate-bounce"
      type="button"
      @click="scrollToTop"
      aria-label="Scroll ke atas"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>

    <!-- Floating Apps Utility Button -->
    <div class="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      <!-- Floating Menu Popover -->
      <div 
        v-if="showFloatingMenu" 
        class="bg-surface border border-border/50 rounded-2xl p-3.5 shadow-2xl w-48 mb-3.5 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div class="text-[9px] font-bold text-muted uppercase tracking-widest px-1 pb-1 border-b border-border/50">
          Utilitas Cepat
        </div>
        <button 
          class="w-full text-left px-2 py-2 rounded-xl text-xs font-bold text-text hover:bg-slate-500/10 cursor-pointer flex items-center gap-2.5 border-none bg-transparent"
          @click="showQuickTxModal = true"
        >
          <span class="text-sm">📝</span> Tambah Transaksi
        </button>
        <button 
          class="w-full text-left px-2 py-2 rounded-xl text-xs font-bold text-text hover:bg-slate-500/10 cursor-pointer flex items-center gap-2.5 border-none bg-transparent"
          @click="cycleTheme"
        >
          <span class="text-sm">🎨</span> Ganti Tema Cepat
        </button>
        <button 
          class="w-full text-left px-2 py-2 rounded-xl text-xs font-bold text-text hover:bg-slate-500/10 cursor-pointer flex items-center gap-2.5 border-none bg-transparent"
          @click="downloadBackup"
        >
          <span class="text-sm">📥</span> Ekspor Backup
        </button>
      </div>

      <!-- Toggle Button -->
      <button
        class="rounded-full w-12 h-12 bg-slate-900 text-white border border-slate-800/80 flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all focus:outline-none"
        :class="{ 'bg-primary text-primary-contrast border-primary/20': showFloatingMenu }"
        type="button"
        @click="showFloatingMenu = !showFloatingMenu"
        aria-label="Utilitas Cepat"
      >
        <span v-if="!showFloatingMenu" class="text-base select-none">⚡</span>
        <span v-else class="text-xs font-extrabold select-none">✕</span>
      </button>
    </div>

    <!-- Quick Transaction Modal -->
    <div 
      v-if="showQuickTxModal" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4"
      @click.self="showQuickTxModal = false"
    >
      <div class="bg-surface border border-border rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
        <!-- Modal Header -->
        <header class="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div>
            <span class="text-[10px] font-bold text-primary uppercase tracking-widest">Pintasan Cepat</span>
            <h3 class="text-base font-extrabold text-text mt-0.5">Tambah Transaksi Baru</h3>
          </div>
          <button 
            class="text-muted hover:text-text text-lg font-bold border-none bg-transparent cursor-pointer"
            @click="showQuickTxModal = false"
          >
            ✕
          </button>
        </header>

        <!-- Modal Form Body -->
        <div class="p-6 flex flex-col gap-4 text-text">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jenis Transaksi
            <select v-model="quickTxForm.type" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:outline-none transition-all">
              <option value="expense">Pengeluaran 💸</option>
              <option value="income">Pemasukan 💰</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Nominal (Rp)
            <input v-model="quickTxForm.amount" type="number" min="0" placeholder="10000" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Kategori
            <input v-model="quickTxForm.category" list="quick-categories" placeholder="Tulis atau pilih kategori..." class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:outline-none transition-all" />
            <datalist id="quick-categories">
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
            </datalist>
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Catatan
            <input v-model="quickTxForm.note" placeholder="Makan siang, freelance, dll." class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:outline-none transition-all" />
          </label>

          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Tanggal
            <input v-model="quickTxForm.date" type="date" class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:outline-none transition-all" />
          </label>

          <button 
            class="w-full mt-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer border-none"
            @click="submitQuickTx"
          >
            Simpan Transaksi
          </button>
        </div>
      </div>
    </div>

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
