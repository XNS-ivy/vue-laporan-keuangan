<script setup lang="ts">
import { ref } from 'vue'

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

const handleNumber = (num: number) => {
  if (pin.value.length >= 4) return
  error.value = false
  errorMessage.value = ''
  pin.value += num.toString()

  if (pin.value.length === 4) {
    // Validate PIN
    setTimeout(() => {
      if (pin.value === props.correctPin) {
        emit('unlocked')
      } else {
        error.value = true
        errorMessage.value = 'PIN salah. Coba lagi.'
        pin.value = ''
        // Trigger small vibration if supported
        if (navigator.vibrate) {
          navigator.vibrate(150)
        }
      }
    }, 200)
  }
}

const handleBackspace = () => {
  if (pin.value.length > 0) {
    pin.value = pin.value.slice(0, -1)
  }
}

const handleClear = () => {
  pin.value = ''
  error.value = false
  errorMessage.value = ''
}
</script>

<template>
  <div class="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white select-none">
    <div class="flex flex-col items-center max-w-xs w-full px-6 text-center transition-all duration-300">
      <!-- Icon / Logo Lock -->
      <div class="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center text-2xl text-blue-500 shadow-lg shadow-blue-500/5 mb-6">
        🔒
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
      <div class="h-5 text-center">
        <p v-if="errorMessage" class="text-xs font-bold text-red-500 tracking-wide animate-pulse">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Keypad -->
      <div class="grid grid-cols-3 gap-4.5 w-full mt-6">
        <button 
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" 
          :key="num"
          type="button"
          class="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 text-xl font-bold flex items-center justify-center hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all cursor-pointer shadow-xs self-center justify-self-center"
          @click="handleNumber(num)"
        >
          {{ num }}
        </button>

        <button 
          type="button"
          class="w-16 h-16 rounded-full text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition-all cursor-pointer border-none self-center justify-self-center"
          @click="handleClear"
        >
          CLEAR
        </button>

        <button 
          type="button"
          class="w-16 h-16 rounded-full bg-slate-900 border border-slate-800/80 text-xl font-bold flex items-center justify-center hover:bg-slate-800 active:scale-90 active:bg-blue-600 transition-all cursor-pointer shadow-xs self-center justify-self-center"
          @click="handleNumber(0)"
        >
          0
        </button>

        <button 
          type="button"
          class="w-16 h-16 rounded-full text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition-all cursor-pointer border-none self-center justify-self-center"
          @click="handleBackspace"
        >
          ⌫
        </button>
      </div>
    </div>
  </div>
</template>
