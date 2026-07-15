import { ref, onMounted, onBeforeUnmount } from 'vue'

// Module-level singleton state (shared across all components)
const deferredPrompt = ref<any>(null)
const canInstall = ref(false)
const isInstalled = ref(false)
const dismissed = ref(false)

let listenerAttached = false

export function usePwaInstall() {
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  }

  const handleAppInstalled = () => {
    isInstalled.value = true
    canInstall.value = false
    deferredPrompt.value = null
  }

  const promptInstall = async () => {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    if (outcome === 'accepted') {
      isInstalled.value = true
      canInstall.value = false
    }
    deferredPrompt.value = null
    return outcome === 'accepted'
  }

  const dismissBanner = () => {
    dismissed.value = true
    sessionStorage.setItem('pwa_install_dismissed', 'true')
  }

  onMounted(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      canInstall.value = false
    }

    // Restore dismiss state from session
    if (sessionStorage.getItem('pwa_install_dismissed')) {
      dismissed.value = true
    }

    if (!listenerAttached) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
      listenerAttached = true
    }
  })

  onBeforeUnmount(() => {
    // Don't remove listeners — they're shared singleton
  })

  return {
    canInstall,
    isInstalled,
    dismissed,
    promptInstall,
    dismissBanner,
  }
}
