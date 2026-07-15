<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinance } from '../composables/useFinance'
import { applyThemeSettings, themePresets, type ThemeSettings } from '../composables/useTheme'

const router = useRouter()
const { addAsset } = useFinance()

const activeStep = ref(1)

// Step 2: Theme Selector
const selectedThemeId = ref('ocean-light')
const currentThemeMode = ref<'light' | 'dark' | 'midnight'>('light')

const selectTheme = (preset: any) => {
  selectedThemeId.value = preset.id
  currentThemeMode.value = preset.mode
  
  const updatedTheme: ThemeSettings = {
    mode: preset.mode,
    primary: preset.primary,
    primaryAlpha: 1,
    surfaceMode: preset.surfaceMode
  }
  
  // Apply theme settings immediately to preview
  applyThemeSettings(updatedTheme)
  
  // Save to localStorage
  window.localStorage.setItem('finance-theme-settings', JSON.stringify(updatedTheme))
  window.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: updatedTheme }))
}

// Step 3: PIN Security
const pinEnabled = ref(false)
const pinValue = ref('')
const pinError = ref('')

const handlePinInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const clean = target.value.replace(/\D/g, '').slice(0, 4)
  pinValue.value = clean
  pinError.value = ''
}

// Step 4: Initial Cash
const initialBalance = ref('')

const finishOnboarding = () => {
  // Validate PIN if enabled
  if (pinEnabled.value) {
    if (pinValue.value.length !== 4) {
      pinError.value = 'PIN harus 4 digit ya!'
      activeStep.value = 3
      return
    }
    localStorage.setItem('finance_flow_pin', pinValue.value)
  } else {
    localStorage.removeItem('finance_flow_pin')
  }

  // Create initial asset if balance is entered
  const cashAmount = Number(initialBalance.value)
  if (cashAmount > 0) {
    addAsset({
      name: 'Uang Tunai (Dompet)',
      amount: cashAmount,
      type: 'cash',
      date: new Date().toISOString().slice(0, 10)
    })
  }

  // Set introduced flag and redirect to dashboard
  localStorage.setItem('finance_flow_introduced', 'true')
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-bg-soft text-text relative overflow-hidden leading-relaxed select-none">
    <!-- Background blur spots -->
    <div class="absolute top-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -ml-20 -mt-20"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-32 -mb-32"></div>

    <!-- Onboarding Card Container -->
    <div class="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 lg:p-8 flex flex-col justify-between relative z-10 min-h-[500px]">
      
      <!-- Progress Indicator -->
      <div class="flex justify-between items-center gap-2 mb-6">
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Langkah {{ activeStep }} dari 4</span>
        <div class="flex gap-1.5 grow max-w-[200px]">
          <span 
            v-for="step in 4" 
            :key="step"
            class="h-1.5 rounded-full transition-all duration-300 grow"
            :class="step <= activeStep ? 'bg-primary' : 'bg-surface-2 border border-border'"
          ></span>
        </div>
      </div>

      <!-- STEP 1: WELCOME & INTRO -->
      <div v-if="activeStep === 1" class="flex flex-col gap-5 grow justify-center">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            Hai! Mulai Catat Keuanganmu Lebih Rapi! 👋
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            Selamat datang di <strong class="text-primary font-bold">MyFinanceFlow</strong>. Solusi asyik dan privat buat ngelola duitmu tanpa drama.
          </p>
        </div>

        <div class="flex flex-col gap-3.5 my-2">
          <div class="flex gap-3.5 p-3 rounded-2xl border border-border bg-slate-500/5 items-start">
            <span class="text-2xl">🔒</span>
            <div>
              <h3 class="text-xs font-bold text-text uppercase tracking-wide">100% Rahasia & Aman</h3>
              <p class="text-xs text-muted font-medium mt-0.5 leading-relaxed">
                Semua data keuanganmu cuma disimpen di browser perangkat ini aja. Gak ada yang dikirim ke internet, privat maksimal!
              </p>
            </div>
          </div>

          <div class="flex gap-3.5 p-3 rounded-2xl border border-border bg-slate-500/5 items-start">
            <span class="text-2xl">📈</span>
            <div>
              <h3 class="text-xs font-bold text-text uppercase tracking-wide">Grafik & Tren Keren</h3>
              <p class="text-xs text-muted font-medium mt-0.5 leading-relaxed">
                Pantau visualisasi pemasukan, pengeluaran, anggaran, dan perkembangan asetmu dengan gampang.
              </p>
            </div>
          </div>

          <div class="flex gap-3.5 p-3 rounded-2xl border border-border bg-slate-500/5 items-start">
            <span class="text-2xl">⚡</span>
            <div>
              <h3 class="text-xs font-bold text-text uppercase tracking-wide">Simpel & Praktis</h3>
              <p class="text-xs text-muted font-medium mt-0.5 leading-relaxed">
                Ada menu tombol melayang cepat buat catat transaksi, ganti tema kilat, ekspor laporan, dan kelola utang piutang.
              </p>
            </div>
          </div>
        </div>

        <button 
          class="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2"
          @click="activeStep = 2"
        >
          Yuk, Mulai Setup! ➡️
        </button>
      </div>

      <!-- STEP 2: THEME SELECTOR -->
      <div v-if="activeStep === 2" class="flex flex-col gap-5 grow justify-center">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            Pilih Warna Favoritmu! 🎨
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            Pilih tema visual yang pas di matamu. Nanti kamu bisa ganti lagi kok di menu Settings kapan saja.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3.5 my-3">
          <button 
            v-for="preset in themePresets" 
            :key="preset.id"
            type="button"
            class="p-3.5 border rounded-2xl bg-surface hover:bg-slate-500/5 cursor-pointer text-left transition-all flex flex-col gap-1.5 text-xs font-bold"
            :class="selectedThemeId === preset.id ? 'border-primary shadow-md ring-2 ring-primary-soft' : 'border-border'"
            @click="selectTheme(preset)"
          >
            <div class="flex items-center gap-1.5 justify-between">
              <span class="text-text">{{ preset.label }}</span>
              <span 
                class="w-4 h-4 rounded-full" 
                :style="{ backgroundColor: preset.primary }"
              ></span>
            </div>
            <span class="text-[10px] text-muted font-medium capitalize">
              Mode: {{ preset.mode === 'light' ? 'Terang ☀️' : 'Gelap 🌙' }}
            </span>
          </button>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer"
            @click="activeStep = 1"
          >
            Kembali
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none"
            @click="activeStep = 3"
          >
            Keren, Lanjut! ➡️
          </button>
        </div>
      </div>

      <!-- STEP 3: SECURITY PIN (OPTIONAL) -->
      <div v-if="activeStep === 3" class="flex flex-col gap-5 grow justify-center">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            Biar Aman, Set PIN Dulu Yuk! 🔑
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            Biar data catatan keuanganmu gak diintip temen pas pinjam HP. Kamu bisa aktifkan atau lewati langkah ini dulu.
          </p>
        </div>

        <div class="flex flex-col gap-4 my-4 bg-slate-500/5 border border-border p-4.5 rounded-2xl">
          <label class="flex items-center gap-3 text-xs font-bold text-text cursor-pointer select-none">
            <input 
              type="checkbox" 
              v-model="pinEnabled" 
              class="w-4.5 h-4.5 rounded text-primary focus:ring-primary-soft" 
            />
            <span>Aktifkan Kunci PIN Pengaman</span>
          </label>

          <div v-if="pinEnabled" class="flex flex-col gap-2 animate-in fade-in duration-200">
            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">
              Masukkan 4 Digit Angka PIN Baru
            </label>
            <input 
              :value="pinValue"
              type="password"
              pattern="[0-9]*"
              inputmode="numeric"
              maxlength="4"
              placeholder="••••"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface text-text text-center text-lg font-bold tracking-widest focus:border-primary focus:outline-none transition-all placeholder:text-muted/40"
              @input="handlePinInput"
            />
            <p v-if="pinError" class="text-[11px] font-bold text-danger animate-pulse">{{ pinError }}</p>
          </div>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer"
            @click="activeStep = 2"
          >
            Kembali
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none"
            @click="activeStep = 4"
          >
            Lanjut! ➡️
          </button>
        </div>
      </div>

      <!-- STEP 4: INITIAL CASH SETUP -->
      <div v-if="activeStep === 4" class="flex flex-col gap-5 grow justify-center">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            Isi Nominal Uang Tunaimu! 💵
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            Punya duit cash di dompet/saku sekarang? Masukkan jumlahnya buat dicatat sebagai modal awal Aset Uang Tunai kamu.
          </p>
        </div>

        <div class="flex flex-col gap-3 my-4">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            Jumlah Duit Tunai Saat Ini (Rp)
            <input 
              v-model="initialBalance"
              type="number"
              min="0"
              placeholder="Contoh: 150000"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-medium focus:border-primary focus:outline-none transition-all placeholder:text-muted/60"
            />
          </label>
          <p class="text-[10px] text-muted font-medium italic">
            *Langkah ini opsional ya, kamu bisa skip dengan langsung mengosongkan nominalnya dan klik selesai.
          </p>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer"
            @click="activeStep = 3"
          >
            Kembali
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none"
            @click="finishOnboarding"
          >
            Simpan & Mulai! 🎉
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
