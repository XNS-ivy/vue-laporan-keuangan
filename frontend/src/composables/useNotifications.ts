import { ref, onMounted } from 'vue'
import { useUi } from './useUi'

export type ReminderInterval = 'daily' | 'weekly' | 'monthly' | 'off'

const INTERVAL_KEY = 'finance_reminder_interval'
const LAST_REMINDE_KEY = 'finance_last_reminded_date'

const reminderInterval = ref<ReminderInterval>('off')
const lastRemindedDate = ref<string>('')
const notificationPermission = ref<NotificationPermission>('default')

// Simple IndexedDB helper for sharing state with Service Worker
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'))
      return
    }
    const request = indexedDB.open('finance-flow-db', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function writeDbSetting(key: string, value: any) {
  try {
    const db = await openDB()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite')
      const store = tx.objectStore('settings')
      store.put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn('Failed to write setting to IndexedDB:', err)
  }
}

export function useNotifications() {
  const { pushToast } = useUi()

  const loadSettings = async () => {
    if (typeof window === 'undefined') return
    reminderInterval.value = (localStorage.getItem(INTERVAL_KEY) as ReminderInterval) || 'off'
    lastRemindedDate.value = localStorage.getItem(LAST_REMINDE_KEY) || ''
    
    // Sync to IndexedDB for Service Worker accessibility
    await writeDbSetting(INTERVAL_KEY, reminderInterval.value)
    await writeDbSetting(LAST_REMINDE_KEY, lastRemindedDate.value)

    if ('Notification' in window) {
      notificationPermission.value = Notification.permission
    }
  }

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      pushToast('Browser Anda tidak mendukung Web Notification', 'error')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
      if (permission === 'granted') {
        pushToast('Izin notifikasi diberikan', 'success')
        // Automatically register periodic sync if reminders are active
        if (reminderInterval.value !== 'off') {
          configurePeriodicSync(reminderInterval.value)
        }
        return true
      } else {
        pushToast('Izin notifikasi ditolak', 'warning')
        return false
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      return false
    }
  }

  const configurePeriodicSync = async (interval: ReminderInterval) => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if ('periodicSync' in registration) {
          const pSync = (registration as any).periodicSync
          if (interval !== 'off' && Notification.permission === 'granted') {
            await pSync.register('daily-reminder', {
              minInterval: 24 * 60 * 60 * 1000 // check daily
            })
          } else {
            await pSync.unregister('daily-reminder')
          }
        }
      } catch (err) {
        console.warn('Failed to configure periodicSync:', err)
      }
    }
  }

  const setReminderInterval = async (interval: ReminderInterval) => {
    if (typeof window === 'undefined') return
    reminderInterval.value = interval
    localStorage.setItem(INTERVAL_KEY, interval)
    await writeDbSetting(INTERVAL_KEY, interval)
    await configurePeriodicSync(interval)

    pushToast(`Pengingat diatur ke: ${interval === 'off' ? 'Nonaktif' : interval === 'daily' ? 'Harian' : interval === 'weekly' ? 'Mingguan' : 'Bulanan'}`, 'success')
  }

  const sendNotification = async (title: string, options: NotificationOptions = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const defaultOptions: any = {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: window.location.origin,
        ...(options.data || {})
      },
      ...options
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        registration.showNotification(title, defaultOptions)
        return
      } catch (err) {
        console.warn('Could not send notification via service worker, falling back to window Notification:', err)
      }
    }

    try {
      const notification = new Notification(title, defaultOptions)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (err) {
      console.error('Failed to create standard Notification:', err)
    }
  }

  const triggerImmediateTestNotification = () => {
    if (notificationPermission.value !== 'granted') {
      pushToast('Harap aktifkan izin notifikasi terlebih dahulu', 'warning')
      return
    }

    sendNotification('Tes Notifikasi MyFinanceFlow 🔔', {
      body: 'Halo! Ini adalah notifikasi pengingat uji coba. Aplikasi siap mengirim pengingat pencatatan secara berkala.',
    })
  }

  const checkAndTriggerReminder = () => {
    if (typeof window === 'undefined') return
    if (reminderInterval.value === 'off') return
    if (Notification.permission !== 'granted') return

    const today = new Date().toISOString().slice(0, 10)
    
    if (lastRemindedDate.value === today) return

    if (!lastRemindedDate.value) {
      lastRemindedDate.value = today
      localStorage.setItem(LAST_REMINDE_KEY, today)
      writeDbSetting(LAST_REMINDE_KEY, today)
      sendNotification('Selamat Datang di Pengingat MyFinanceFlow 🔔', {
        body: 'Pengingat pencatatan laporan keuangan Anda telah aktif. Yuk catat pengeluaran/pemasukan Anda sekarang!'
      })
      return
    }

    let shouldRemind = false
    const timeDiff = new Date(today).getTime() - new Date(lastRemindedDate.value).getTime()
    const diffInDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    if (reminderInterval.value === 'daily' && diffInDays >= 1) {
      shouldRemind = true
    } else if (reminderInterval.value === 'weekly' && diffInDays >= 7) {
      shouldRemind = true
    } else if (reminderInterval.value === 'monthly' && diffInDays >= 30) {
      shouldRemind = true
    }

    if (shouldRemind) {
      lastRemindedDate.value = today
      localStorage.setItem(LAST_REMINDE_KEY, today)
      writeDbSetting(LAST_REMINDE_KEY, today)
      sendNotification('Waktunya Catat Keuangan Anda! 📊', {
        body: `Sudah waktunya mencatat mutasi pengeluaran dan pemasukan Anda. Jaga pengeluaran tetap terkontrol!`,
        tag: 'finance-reminder'
      })
    }
  }

  onMounted(() => {
    loadSettings()
  })

  return {
    reminderInterval,
    lastRemindedDate,
    notificationPermission,
    requestPermission,
    setReminderInterval,
    triggerImmediateTestNotification,
    checkAndTriggerReminder
  }
}
