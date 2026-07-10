import { ref, onMounted } from 'vue'
import { useUi } from './useUi'

export type ReminderInterval = 'daily' | 'weekly' | 'monthly' | 'off'

const INTERVAL_KEY = 'finance_reminder_interval'
const LAST_REMINDE_KEY = 'finance_last_reminded_date'

const reminderInterval = ref<ReminderInterval>('off')
const lastRemindedDate = ref<string>('')
const notificationPermission = ref<NotificationPermission>('default')

export function useNotifications() {
  const { pushToast } = useUi()

  const loadSettings = () => {
    if (typeof window === 'undefined') return
    reminderInterval.value = (localStorage.getItem(INTERVAL_KEY) as ReminderInterval) || 'off'
    lastRemindedDate.value = localStorage.getItem(LAST_REMINDE_KEY) || ''
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

  const setReminderInterval = (interval: ReminderInterval) => {
    if (typeof window === 'undefined') return
    reminderInterval.value = interval
    localStorage.setItem(INTERVAL_KEY, interval)
    pushToast(`Pengingat diatur ke: ${interval === 'off' ? 'Nonaktif' : interval === 'daily' ? 'Harian' : interval === 'weekly' ? 'Mingguan' : 'Bulanan'}`, 'success')
  }

  const sendNotification = async (title: string, options: NotificationOptions = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const defaultOptions: any = {
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      ...options
    }

    // Try sending through Service Worker first (PWA style)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        registration.showNotification(title, defaultOptions)
        return
      } catch (err) {
        console.warn('Could not send notification via service worker, falling back to window Notification:', err)
      }
    }

    // Fallback to standard window Notification
    new Notification(title, defaultOptions)
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

    const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
    
    // If we have already reminded today, skip
    if (lastRemindedDate.value === today) return

    // If there is no previous reminder date, initialize and send first reminder
    if (!lastRemindedDate.value) {
      lastRemindedDate.value = today
      localStorage.setItem(LAST_REMINDE_KEY, today)
      sendNotification('Selamat Datang di Pengingat MyFinanceFlow 🔔', {
        body: 'Pengingat pencatatan laporan keuangan Anda telah aktif. Yuk catat pengeluaran/pemasukan Anda sekarang!'
      })
      return
    }

    // Check if we should remind based on interval
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
