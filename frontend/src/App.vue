<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import LayoutShell from './components/LayoutShell.vue'
import SecurityLock from './components/SecurityLock.vue'
import { useNotifications } from './composables/useNotifications'

const storedPin = ref<string | null>(null)
const isLocked = ref(false)
const { checkAndTriggerReminder } = useNotifications()

const checkPin = () => {
  const pin = localStorage.getItem('finance_flow_pin')
  if (pin) {
    storedPin.value = pin
    // Only lock if we haven't unlocked in this session
    if (storedPin.value && !sessionStorage.getItem('finance_flow_unlocked')) {
      isLocked.value = true
    }
  } else {
    storedPin.value = null
    isLocked.value = false
  }
}

const handleUnlock = () => {
  isLocked.value = false
  sessionStorage.setItem('finance_flow_unlocked', 'true')
}

onMounted(() => {
  checkPin()
  window.addEventListener('pin-changed', checkPin)
  checkAndTriggerReminder()
})

onBeforeUnmount(() => {
  window.removeEventListener('pin-changed', checkPin)
})
</script>

<template>
  <SecurityLock 
    v-if="isLocked && storedPin" 
    :correct-pin="storedPin" 
    @unlocked="handleUnlock" 
  />
  <LayoutShell v-else />
</template>