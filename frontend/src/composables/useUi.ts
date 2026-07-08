import { computed, ref } from 'vue'

type ToastTone = 'success' | 'info' | 'warning' | 'error'

export type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

const toasts = ref<ToastItem[]>([])
const globalDateFilter = ref({
  start: '',
  end: '',
})

const pushToast = (message: string, tone: ToastTone = 'success') => {
  const id = Date.now() + Math.floor(Math.random() * 1000)
  toasts.value.push({ id, message, tone })
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }, 2600)
}

export function useUi() {
  const hasDateFilter = computed(() => Boolean(globalDateFilter.value.start || globalDateFilter.value.end))

  const setGlobalDateFilter = (payload: Partial<{ start: string; end: string }>) => {
    globalDateFilter.value = {
      start: payload.start ?? globalDateFilter.value.start,
      end: payload.end ?? globalDateFilter.value.end,
    }
  }

  const resetGlobalDateFilter = () => {
    globalDateFilter.value = { start: '', end: '' }
  }

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  return {
    toasts,
    globalDateFilter,
    hasDateFilter,
    pushToast,
    removeToast,
    setGlobalDateFilter,
    resetGlobalDateFilter,
  }
}
