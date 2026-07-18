<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps<{
  correctPin: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'unlocked'): void
}>()

const pin = ref('')
const error = ref(false)
const errorMessage = ref('')
const failedAttempts = ref(0)
const lockoutCountdown = ref(0)
let timerId: any = null

const startLockout = () => {
  lockoutCountdown.value = 30
  errorMessage.value = `Terlalu banyak percobaan salah. Keypad dikunci selama ${lockoutCountdown.value} detik.`
  
  if (timerId) clearInterval(timerId)
  
  timerId = setInterval(() => {
    lockoutCountdown.value--
    if (lockoutCountdown.value <= 0) {
      clearInterval(timerId)
      timerId = null
      failedAttempts.value = 0
      errorMessage.value = ''
      error.value = false
    } else {
      errorMessage.value = `Terlalu banyak percobaan salah. Keypad dikunci selama ${lockoutCountdown.value} detik.`
    }
  }, 1000)
}

const handleNumber = (num: number) => {
  if (lockoutCountdown.value > 0) return
  if (pin.value.length >= 4) return
  error.value = false
  errorMessage.value = ''
  pin.value += num.toString()

  if (pin.value.length === 4) {
    // Validate PIN
    setTimeout(() => {
      if (pin.value === props.correctPin) {
        failedAttempts.value = 0
        emit('unlocked')
      } else {
        error.value = true
        failedAttempts.value++
        
        // Trigger small vibration if supported
        if (navigator.vibrate) {
          navigator.vibrate(150)
        }

        if (failedAttempts.value >= 5) {
          pin.value = ''
          startLockout()
        } else {
          errorMessage.value = `PIN salah. Sisa percobaan: ${5 - failedAttempts.value}`
          pin.value = ''
        }
      }
    }, 200)
  }
}

const handleBackspace = () => {
  if (lockoutCountdown.value > 0) return
  if (pin.value.length > 0) {
    pin.value = pin.value.slice(0, -1)
  }
}

const handleClear = () => {
  if (lockoutCountdown.value > 0) return
  pin.value = ''
  error.value = false
  errorMessage.value = ''
}

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<template>
  <div class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white select-none">
    <div class="flex flex-col items-center max-w-xs w-full px-6 text-center transition-all duration-300">
      <div class="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5 mb-6">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      </div>

      <h1 class="text-lg font-extrabold tracking-tight text-white">{{ title || 'MyFinanceFlow Terkunci' }}</h1>
      <p class="text-xs text-slate-400 font-semibold mt-1">Masukkan 4-digit PIN keamanan Anda</p>

      <!-- Dots Indicators -->
      <div class="flex justify-center gap-4.5 my-8 h-4 items-center" :class="{ 'animate-bounce text-red-500': error }">
        <span 
          v-for="i in 4" 
          :key="i"
          class="w-3.5 h-3.5 rounded-full border transition-all duration-200"
          :class="[
            pin.length >= i 
              ? 'bg-blue-500 border-blue-500 scale-110 shadow-md shadow-blue-500/30' 
              : 'border-slate-700 bg-slate-900'
          ]"
        ></span>
      </div>

      <!-- Error message -->
      <div class="h-10 text-center flex items-center justify-center mb-2">
        <p v-if="errorMessage" class="text-xs font-bold text-red-500 tracking-wide animate-pulse leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Keypad -->
      <div 
        class="grid grid-cols-3 gap-4.5 w-full mt-4 transition-all duration-300"
        :class="{ 'opacity-40 pointer-events-none': lockoutCountdown > 0 }"
      >
        <button 
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" 
          :key="num"
          type="button"
          :disabled="lockoutCountdown > 0"
          class="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 text-xl font-bold flex items-center justify-center hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all cursor-pointer shadow-xs self-center justify-self-center disabled:cursor-not-allowed"
          @click="handleNumber(num)"
        >
          {{ num }}
        </button>

        <button 
          type="button"
          :disabled="lockoutCountdown > 0"
          class="w-16 h-16 rounded-full text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition-all cursor-pointer border-none self-center justify-self-center disabled:cursor-not-allowed"
          @click="handleClear"
        >
          CLEAR
        </button>

        <button 
          type="button"
          :disabled="lockoutCountdown > 0"
          class="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 text-xl font-bold flex items-center justify-center hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all cursor-pointer shadow-xs self-center justify-self-center disabled:cursor-not-allowed"
          @click="handleNumber(0)"
        >
          0
        </button>

        <button 
          type="button"
          :disabled="lockoutCountdown > 0"
          class="w-16 h-16 rounded-full text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition-all cursor-pointer border-none self-center justify-self-center disabled:cursor-not-allowed"
          @click="handleBackspace"
        >
          ⌫
        </button>
      </div>
    </div>
  </div>
</template>
