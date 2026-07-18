<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinance } from '../composables/useFinance'
import { applyThemeSettings, themePresets, type ThemeSettings } from '../composables/useTheme'
import { language, currency, contentScale, t, getDynamicStep, handleNominalKeydown } from '../composables/useUserSettings'

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
      pinError.value = t({ id: 'PIN harus 4 digit ya!', en: 'PIN must be exactly 4 digits!', ja: 'PINは4桁である必要があります！', es: '¡El PIN debe tener exactamente 4 dígitos!' })
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
      name: t({ id: 'Uang Tunai (Dompet)', en: 'Cash (Wallet)', ja: '現金 (財布)', es: 'Efectivo (Cartera)' }),
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
    <div class="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 lg:p-8 flex flex-col justify-between relative z-10 min-h-130">
      
      <!-- Progressive Progress Indicator -->
      <div class="flex flex-col gap-2 mb-6">
        <div class="flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-widest">
          <span>{{ t({ id: 'Langkah', en: 'Step', ja: 'ステップ', es: 'Paso' }) }} {{ activeStep }} {{ t({ id: 'dari', en: 'of', ja: '/', es: 'de' }) }} 4</span>
          <span class="text-primary">{{ (activeStep / 4) * 100 }}%</span>
        </div>
        <div class="w-full h-1.5 bg-surface-2 border border-border rounded-full overflow-hidden">
          <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${(activeStep / 4) * 100}%` }"></div>
        </div>
      </div>

      <!-- STEP 1: WELCOME & INITIAL SETUP -->
      <div v-if="activeStep === 1" class="flex flex-col gap-5 grow justify-center animate-in fade-in duration-200">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            {{ t({ id: 'Mulai Catat Keuanganmu Lebih Rapi!', en: 'Start Tracking Your Finance Better!', ja: '家計簿をスマートに始めましょう！', es: '¡Comience a Registrar sus Finanzas Mejor!' }) }}
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            {{ t({ id: 'Selamat datang di MyFinanceFlow. Solusi asyik dan privat buat ngelola duitmu tanpa drama.', en: 'Welcome to MyFinanceFlow. A fun and private solution to manage your money without drama.', ja: 'MyFinanceFlowへようこそ。ストレスなくお金を管理できる、楽しくプライベートなソリューションです。', es: 'Bienvenido a MyFinanceFlow. Una solución divertida y privada para gestionar su dinero sin dramas.' }) }}
          </p>
        </div>

        <!-- Language & Currency & Size Quick Setup Selection -->
        <div class="grid grid-cols-1 gap-3 bg-slate-500/5 p-4 border border-border rounded-2xl">
          <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Bahasa Preferensi', en: 'Preferred Language', ja: '優先言語', es: 'Idioma Preferido' }) }}
              <select v-model="language" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text text-xs font-semibold focus:outline-none transition-all">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="es">Español</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Mata Uang Utama', en: 'Primary Currency', ja: '主要通貨', es: 'Moneda Principal' }) }}
              <select v-model="currency" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text text-xs font-semibold focus:outline-none transition-all">
                <option value="IDR">IDR (Rp)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </label>
          </div>
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Ukuran Teks & Tombol (Skala)', en: 'Text & Button Size (Scale)', ja: 'テキストとボタンのサイズ (倍率)', es: 'Tamaño de Texto y Botón (Escala)' }) }}
            <select v-model="contentScale" class="w-full border border-border rounded-xl px-3 py-2 bg-surface text-text text-xs font-semibold focus:outline-none transition-all">
              <option value="normal">{{ t({ id: 'Normal (Standar)', en: 'Normal (Standard)', ja: '標準', es: 'Normal (Estándar)' }) }}</option>
              <option value="large">{{ t({ id: 'Besar (Ramah Orang Tua)', en: 'Large (Elder-Friendly)', ja: '大きい (シニア向け)', es: 'Grande (Apto para Mayores)' }) }}</option>
              <option value="xlarge">{{ t({ id: 'Ekstra Besar (Sangat Besar)', en: 'Extra Large (Very Large)', ja: '特大', es: 'Extra Grande (Muy Grande)' }) }}</option>
            </select>
          </label>
        </div>

        <div class="flex flex-col gap-3 my-1">
          <div class="flex gap-3.5 p-3 rounded-2xl border border-border bg-slate-500/5 items-start">
            <svg class="w-5 h-5 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <div>
              <h3 class="text-xs font-bold text-text uppercase tracking-wide">{{ t({ id: '100% Rahasia & Aman', en: '100% Private & Secure', ja: '100% プライベート＆セキュア', es: '100% Privado y Seguro' }) }}</h3>
              <p class="text-[11px] text-muted font-medium mt-0.5 leading-relaxed">
                {{ t({ id: 'Semua data keuanganmu cuma disimpen di browser perangkat ini aja. Gak ada yang dikirim ke internet, privat maksimal!', en: 'All your financial data is only stored in this device\'s browser. Nothing is sent to the internet, maximum privacy!', ja: 'すべての財務データはこのデバイスのブラウザにのみ保存されます。インターネットには送信されず、最大限のプライバシーが保たれます。', es: 'Todos sus datos financieros se guardan únicamente en el navegador de este dispositivo. ¡Nada se envía a internet, privacidad al máximo!' }) }}
              </p>
            </div>
          </div>

          <div class="flex gap-3.5 p-3 rounded-2xl border border-border bg-slate-500/5 items-start">
            <svg class="w-5 h-5 text-primary shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            <div>
              <h3 class="text-xs font-bold text-text uppercase tracking-wide">{{ t({ id: 'Grafik & Tren Keren', en: 'Beautiful Charts & Trends', ja: '美しいチャートとトレンド', es: 'Gráficos y Tendencias Hermosos' }) }}</h3>
              <p class="text-[11px] text-muted font-medium mt-0.5 leading-relaxed">
                {{ t({ id: 'Pantau visualisasi pemasukan, pengeluaran, anggaran, dan perkembangan asetmu dengan gampang.', en: 'Easily monitor visualizations of your income, expenses, budgets, and asset growth.', ja: '収入、支出、予算、資産の成長を視覚的に簡単に確認できます。', es: 'Monitoree fácilmente las visualizaciones de sus ingresos, gastos, presupuestos y crecimiento de activos.' }) }}
              </p>
            </div>
          </div>
        </div>

        <button 
          class="w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none mt-2 flex items-center justify-center gap-2"
          @click="activeStep = 2"
        >
          <span>{{ t({ id: 'Yuk, Mulai Setup!', en: 'Let\'s Start Setup!', ja: 'セットアップを始めましょう！', es: '¡Comencemos la Configuración!' }) }}</span>
          <svg class="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      </div>

      <!-- STEP 2: THEME SELECTOR -->
      <div v-if="activeStep === 2" class="flex flex-col gap-5 grow justify-center animate-in fade-in duration-200">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            {{ t({ id: 'Pilih Warna Favoritmu!', en: 'Pick Your Favorite Color!', ja: 'お好みの色を選んでください！', es: '¡Elija su Color Favorito!' }) }}
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            {{ t({ id: 'Pilih tema visual yang pas di matamu. Nanti kamu bisa ganti lagi kok di menu Settings kapan saja.', en: 'Choose a visual theme that suits your eyes. You can always change it later in the Settings menu.', ja: '目に優しいビジュアルテーマを選択してください。設定メニューからいつでも変更できます。', es: 'Elija un tema visual que se adapte a sus ojos. Siempre puede cambiarlo más tarde en el menú Ajustes.' }) }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3.5 my-2">
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
              {{ t({ id: 'Mode:', en: 'Mode:', ja: 'モード:', es: 'Modo:' }) }} 
              {{ preset.mode === 'light' ? t({ id: 'Terang', en: 'Light', ja: 'ライト', es: 'Claro' }) : t({ id: 'Gelap', en: 'Dark', ja: 'ダーク', es: 'Oscuro' }) }}
            </span>
          </button>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer border-none"
            @click="activeStep = 1"
          >
            {{ t({ id: 'Kembali', en: 'Back', ja: '戻る', es: 'Atrás' }) }}
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none flex items-center justify-center gap-2"
            @click="activeStep = 3"
          >
            <span>{{ t({ id: 'Keren, Lanjut!', en: 'Looks Great, Next!', ja: '次へ進む', es: '¡Se ve Bien, Siguiente!' }) }}</span>
            <svg class="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      </div>

      <!-- STEP 3: SECURITY PIN (OPTIONAL) -->
      <div v-if="activeStep === 3" class="flex flex-col gap-5 grow justify-center animate-in fade-in duration-200">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            {{ t({ id: 'Biar Aman, Set PIN Dulu Yuk!', en: 'Let\'s Set a Security PIN!', ja: 'セキュリティPINを設定しましょう！', es: '¡Establezcamos un PIN de Seguridad!' }) }}
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            {{ t({ id: 'Biar data catatan keuanganmu gak diintip temen pas pinjam HP. Kamu bisa aktifkan atau lewati langkah ini dulu.', en: 'To keep your financial records safe when others borrow your phone. You can enable or skip this step for now.', ja: '他の人があなたのスマホを借りたときでも家計簿のデータを安全に保ちます。このステップは有効にすることも、今はスキップすることもできます。', es: 'Para mantener seguros sus registros financieros cuando otros tomen prestado su teléfono. Puede habilitar o omitir este paso por ahora.' }) }}
          </p>
        </div>

        <div class="flex flex-col gap-4 my-3 bg-slate-500/5 border border-border p-4.5 rounded-2xl">
          <label class="flex items-center gap-3 text-xs font-bold text-text cursor-pointer select-none">
            <input 
              type="checkbox" 
              v-model="pinEnabled" 
              class="w-4.5 h-4.5 rounded text-primary focus:ring-primary-soft" 
            />
            <span>{{ t({ id: 'Aktifkan Kunci PIN Pengaman', en: 'Enable Security PIN Lock', ja: 'セキュリティPINロックを有効にする', es: 'Habilitar Bloqueo de PIN de Seguridad' }) }}</span>
          </label>

          <div v-if="pinEnabled" class="flex flex-col gap-2 animate-in fade-in duration-200">
            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">
              {{ t({ id: 'Masukkan 4 Digit Angka PIN Baru', en: 'Enter New 4-Digit PIN', ja: '新しい4桁のPINを入力してください', es: 'Ingrese el Nuevo PIN de 4 Dígitos' }) }}
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
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer border-none"
            @click="activeStep = 2"
          >
            {{ t({ id: 'Kembali', en: 'Back', ja: '戻る', es: 'Atrás' }) }}
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none flex items-center justify-center gap-2"
            @click="activeStep = 4"
          >
            <span>{{ t({ id: 'Lanjut!', en: 'Next!', ja: '次へ', es: '¡Siguiente!' }) }}</span>
            <svg class="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
        </div>
      </div>

      <!-- STEP 4: INITIAL CASH SETUP -->
      <div v-if="activeStep === 4" class="flex flex-col gap-5 grow justify-center animate-in fade-in duration-200">
        <div>
          <h1 class="text-xl lg:text-2xl font-extrabold tracking-tight text-text">
            {{ t({ id: 'Isi Nominal Uang Tunaimu!', en: 'Enter Your Initial Cash!', ja: '初期の所持金を入力してください！', es: '¡Ingrese su Efectivo Inicial!' }) }}
          </h1>
          <p class="text-xs text-muted font-semibold mt-1.5">
            {{ t({ id: 'Punya duit cash di dompet/saku sekarang? Masukkan jumlahnya buat dicatat sebagai modal awal Aset Uang Tunai kamu.', en: 'Have cash in your wallet/pocket now? Enter the amount to record it as your initial Cash asset.', ja: '現在、財布やポケットに現金はありますか？初期の現金資産として記録する金額を入力してください。', es: '¿Tiene efectivo en su billetera/bolsillo ahora? Ingrese el monto para registrarlo como su activo de efectivo inicial.' }) }}
          </p>
        </div>

        <div class="flex flex-col gap-3 my-3">
          <label class="flex flex-col gap-1.5 text-xs font-bold text-muted uppercase tracking-wider">
            {{ t({ id: 'Jumlah Duit Tunai Saat Ini', en: 'Current Cash Amount', ja: '現在の現金総額', es: 'Monto de Efectivo Actual' }) }} ({{ currency }})
            <input 
              v-model="initialBalance"
              type="number"
              min="0"
              :step="getDynamicStep(initialBalance)"
              @keydown="handleNominalKeydown"
              placeholder="150000"
              class="w-full border border-border rounded-xl px-4 py-2.5 bg-surface-2 text-text text-sm font-semibold focus:border-primary focus:outline-none transition-all placeholder:text-muted/60"
            />
          </label>
          <p class="text-[10px] text-muted font-medium italic">
            {{ t({ id: '*Langkah ini opsional ya, kamu bisa skip dengan langsung mengosongkan nominalnya dan klik selesai.', en: '*This step is optional, you can skip by leaving it empty and clicking finish.', ja: '※このステップは任意です。空欄のまま完了をクリックしてスキップできます。', es: '*Este paso es opcional, puede omitirlo dejándolo vacío y haciendo clic en finalizar.' }) }}
          </p>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            class="w-1/3 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-text bg-surface-2 border border-border hover:bg-border transition-all cursor-pointer border-none"
            @click="activeStep = 3"
          >
            {{ t({ id: 'Kembali', en: 'Back', ja: '戻る', es: 'Atrás' }) }}
          </button>
          <button 
            class="grow py-3 rounded-full text-xs font-bold uppercase tracking-wider text-primary-contrast bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg hover:shadow-primary/20 border-none flex items-center justify-center gap-2"
            @click="finishOnboarding"
          >
            <span>{{ t({ id: 'Simpan & Mulai!', en: 'Save & Start!', ja: '保存して開始！', es: '¡Guardar y Comenzar!' }) }}</span>
            <svg class="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
