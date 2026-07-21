import { ref, watch, computed } from 'vue'

export type CurrencyType = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY' | 'GBP'
export type AppModeType = 'simple' | 'advance'
export type LanguageType = 'id' | 'en' | 'ja' | 'es'
export type ContentScaleType = 'normal' | 'large' | 'xlarge'

const settingsKey = 'finance-flow-user-preferences'

export const getDefaultSystemLanguage = (): LanguageType => {
  if (typeof navigator === 'undefined') return 'id'
  const sysLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase()
  if (sysLang.startsWith('en')) return 'en'
  if (sysLang.startsWith('ja')) return 'ja'
  if (sysLang.startsWith('es')) return 'es'
  if (sysLang.startsWith('id')) return 'id'
  return 'id'
}

export const currency = ref<CurrencyType>('IDR')
export const appMode = ref<AppModeType>('advance')
export const language = ref<LanguageType>(getDefaultSystemLanguage())
export const contentScale = ref<ContentScaleType>('normal')

export const currencySymbol = computed(() => {
  switch (currency.value) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'SGD': return 'S$'
    case 'JPY': return '¥'
    case 'GBP': return '£'
    case 'IDR':
    default: return 'Rp'
  }
})

export const exchangeRates = ref<Record<CurrencyType, number>>({
  IDR: 1,
  USD: 16000,
  EUR: 17500,
  SGD: 12000,
  JPY: 105,
  GBP: 20500,
})

export const exchangeRateLastUpdated = ref<string | null>(null)
export const isFetchingRates = ref(false)

const ratesStorageKey = 'finance-flow-live-exchange-rates'

export const loadCachedRates = () => {
  try {
    const raw = localStorage.getItem(ratesStorageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.rates) {
        exchangeRates.value = { ...exchangeRates.value, ...parsed.rates }
      }
      if (parsed.lastUpdated) {
        exchangeRateLastUpdated.value = parsed.lastUpdated
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached exchange rates', e)
  }
}

export const updateExchangeRate = (key: CurrencyType, value: number) => {
  const num = Math.max(0, Number(value) || 0)
  if (num > 0) {
    exchangeRates.value = {
      ...exchangeRates.value,
      [key]: num
    }
    const timestamp = 'Manual (' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ')'
    exchangeRateLastUpdated.value = timestamp
    localStorage.setItem(ratesStorageKey, JSON.stringify({
      rates: exchangeRates.value,
      lastUpdated: timestamp
    }))
  }
}

export const resetExchangeRates = () => {
  const defaultRates: Record<CurrencyType, number> = {
    IDR: 1,
    USD: 16000,
    EUR: 17500,
    SGD: 12000,
    JPY: 105,
    GBP: 20500,
  }
  exchangeRates.value = defaultRates
  exchangeRateLastUpdated.value = 'Default'
  localStorage.setItem(ratesStorageKey, JSON.stringify({
    rates: defaultRates,
    lastUpdated: 'Default'
  }))
}

export const fetchRealtimeRates = async () => {
  isFetchingRates.value = true
  try {
    let data: any = null

    // Attempt 1: Localhost Vite Proxy (server-side proxy, bypasses browser CORS)
    try {
      const res = await fetch('/api-fx/v6/latest/USD')
      if (res.ok) data = await res.json()
    } catch {
      // Ignored, try next mirror
    }

    // Attempt 2: jsdelivr CDN (CORS open, highly reliable globally)
    if (!data || (!data.rates && !data.usd)) {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')
        if (res.ok) data = await res.json()
      } catch {
        // Ignored, try next mirror
      }
    }

    // Attempt 3: Direct Open ER API
    if (!data || (!data.rates && !data.usd)) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (res.ok) data = await res.json()
      } catch {
        // Ignored, try next mirror
      }
    }

    // Attempt 4: Direct ExchangeRate-API
    if (!data || (!data.rates && !data.usd)) {
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        if (res.ok) data = await res.json()
      } catch {
        // Ignored
      }
    }

    let parsedRates: Record<CurrencyType, number> | null = null

    if (data && data.rates && data.rates.IDR) {
      const idrRate = Number(data.rates.IDR)
      parsedRates = {
        IDR: 1,
        USD: Math.round(idrRate),
        EUR: data.rates.EUR ? Math.round(idrRate / Number(data.rates.EUR)) : exchangeRates.value.EUR,
        SGD: data.rates.SGD ? Math.round(idrRate / Number(data.rates.SGD)) : exchangeRates.value.SGD,
        JPY: data.rates.JPY ? Math.round(idrRate / Number(data.rates.JPY)) : exchangeRates.value.JPY,
        GBP: data.rates.GBP ? Math.round(idrRate / Number(data.rates.GBP)) : exchangeRates.value.GBP,
      }
    } else if (data && data.usd && (data.usd.idr || data.usd.IDR)) {
      const idrRate = Number(data.usd.idr || data.usd.IDR)
      parsedRates = {
        IDR: 1,
        USD: Math.round(idrRate),
        EUR: data.usd.eur ? Math.round(idrRate / Number(data.usd.eur)) : exchangeRates.value.EUR,
        SGD: data.usd.sgd ? Math.round(idrRate / Number(data.usd.sgd)) : exchangeRates.value.SGD,
        JPY: data.usd.jpy ? Math.round(idrRate / Number(data.usd.jpy)) : exchangeRates.value.JPY,
        GBP: data.usd.gbp ? Math.round(idrRate / Number(data.usd.gbp)) : exchangeRates.value.GBP,
      }
    }

    if (parsedRates) {
      exchangeRates.value = parsedRates
      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' (' + new Date().toLocaleDateString('id-ID') + ')'
      exchangeRateLastUpdated.value = timestamp
      localStorage.setItem(ratesStorageKey, JSON.stringify({
        rates: parsedRates,
        lastUpdated: timestamp
      }))
      return { success: true, rates: parsedRates }
    }
    return { success: false, error: 'Rates data unreadable' }
  } catch (err) {
    console.warn('Could not fetch real-time exchange rates, using cached/fallback rates:', err)
    return { success: false, error: err }
  } finally {
    isFetchingRates.value = false
  }
}

// Auto load cached rates and attempt live refresh
loadCachedRates()
fetchRealtimeRates()

export const convertCurrency = (
  amountInBase: number, 
  targetCurrency: CurrencyType = currency.value, 
  sourceCurrency: CurrencyType = 'IDR'
): number => {
  const sourceRate = exchangeRates.value[sourceCurrency] || 1
  const amountInIdr = sourceCurrency === 'IDR' ? amountInBase : amountInBase * sourceRate
  const targetRate = exchangeRates.value[targetCurrency] || 1
  return amountInIdr / targetRate
}

export const convertToIdr = (amountInSource: number, sourceCurrency: CurrencyType): number => {
  const rate = exchangeRates.value[sourceCurrency] || 1
  return amountInSource * rate
}

export const formatMoney = (
  amount: number | string, 
  sourceCurrency: CurrencyType = 'IDR',
  targetCurrency: CurrencyType = currency.value
): string => {
  const val = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0
  const converted = convertCurrency(val, targetCurrency, sourceCurrency)

  switch (targetCurrency) {
    case 'USD':
      return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    case 'EUR':
      return `€${converted.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    case 'SGD':
      return `S$${converted.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    case 'JPY':
      return `¥${converted.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    case 'GBP':
      return `£${converted.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    case 'IDR':
    default:
      return `Rp ${converted.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
}

export interface TranslationObject {
  id: string
  en: string
  ja?: string
  es?: string
}

export function t(translations: TranslationObject | string): string {
  if (typeof translations === 'string') {
    return translations
  }
  const lang = language.value
  return translations[lang] || translations['en'] || translations['id'] || ''
}

// Logic for dynamic nominal input stepping
export const getDynamicStep = (valStr: string | number): number => {
  const val = typeof valStr === 'string' ? parseFloat(valStr) || 0 : valStr || 0
  if (val <= 0) return 100
  const order = Math.floor(Math.log10(val))
  return Math.pow(10, Math.max(0, order - 1))
}

export const handleNominalKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  const target = e.target as HTMLInputElement
  const val = parseFloat(target.value) || 0
  const step = getDynamicStep(val)
  
  let newVal = val
  if (e.key === 'ArrowUp') {
    newVal = val + step
  } else if (e.key === 'ArrowDown') {
    newVal = Math.max(0, val - step)
  }
  
  target.value = String(newVal)
  target.dispatchEvent(new Event('input'))
}

// SVG Category Icons Dictionary
export const categoryIcons: Record<string, string> = {
  // Income-related
  salary: `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><rect x="2" y="10" width="20" height="8" rx="2"></rect>`,
  freelance: `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
  business: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
  investment: `<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>`,
  
  // Food & Drink
  food: `<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>`,
  coffee: `<path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"></path><path d="M6 2v2"></path><path d="M10 2v2"></path><path d="M14 2v2"></path>`,
  burger: `<path d="M2 12c0-5 4-9 10-9s10 4 10 9H2z"></path><path d="M2 12h20"></path><path d="M2 16h20"></path><path d="M3 20h18a1 1 0 0 0 1-1v-1H2v1a1 1 0 0 0 1 1z"></path>`,
  beer: `<path d="M6 12h10.5a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 6 12z"></path><path d="M18 12h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"></path><path d="M12 2v4"></path><path d="M8 3v3"></path><path d="M16 3v3"></path>`,
  
  // Transport & Travel
  car: `<rect x="1" y="11" width="22" height="8" rx="2"></rect><path d="M5 11V5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v6"></path><circle cx="6.5" cy="19.5" r="2.5"></circle><circle cx="17.5" cy="19.5" r="2.5"></circle>`,
  train: `<rect x="4" y="3" width="16" height="14" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="M6 17l-2 4"></path><path d="M18 17l2 4"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle>`,
  plane: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>`,
  ship: `<path d="M2 17l4 4h12l4-4M12 2v15"></path><path d="M12 2L8 7h8l-4-5z"></path>`,
  bike: `<circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="18.5" cy="17.5" r="3.5"></circle><path d="M15 6h5M12 12h3.5L18 9M5.5 17.5L12 12M12 12v5.5"></path>`,
  compass: `<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>`,
  
  // Bills & Finance
  electricity: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`,
  home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>`,
  wifi: `<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle>`,
  phone: `<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>`,
  receipt: `<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"></path><path d="M6 8h12M6 12h12M6 16h12"></path>`,
  creditcard: `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>`,
  
  // Shopping & Fun
  shopping: `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>`,
  cart: `<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>`,
  gift: `<polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>`,
  film: `<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line>`,
  gamepad: `<rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 12h4M8 10v4M15 11v.01M18 13v.01"></path>`,
  music: `<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>`,
  tv: `<rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline>`,
  camera: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>`,
  
  // Health & Safety
  health: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>`,
  medical: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`,
  stethoscope: `<path d="M3 3v10a6 6 0 0 0 12 0V3M12 14v4M12 18H8M12 18h4"></path><circle cx="3" cy="3" r="1"></circle><circle cx="15" cy="3" r="1"></circle>`,
  heart: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>`,
  pet: `<circle cx="12" cy="5" r="3"></circle><circle cx="5" cy="10" r="3"></circle><circle cx="19" cy="10" r="3"></circle><path d="M12 11c-3.3 0-6 2.7-6 6v3h12v-3c0-3.3-2.7-6-6-6z"></path>`,
  'life-buoy': `<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>`,
  umbrella: `<path d="M23 12a11.02 11.02 0 0 0-22 0zm-11 0v9a2 2 0 0 0 4 0"></path>`,
  
  // Work & Education
  education: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`,
  award: `<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>`,
  briefcase: `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>`,
  tool: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`,
  globe: `<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
  
  // Others
  tag: `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line>`,
  star: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>`,
  key: `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>`,
  lock: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
  unlock: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
  trash: `<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`,
  user: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`,
  percent: `<circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle><line x1="19" y1="5" x2="5" y2="19"></line>`,
  smile: `<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>`,
  frown: `<circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>`,
}

export interface CategoryExampleGroup {
  name: string
  nameTranslations: Record<string, string>
  icons: Array<{ key: string; label: string; labelTranslations: Record<string, string> }>
}

export const categoryExampleGroups: CategoryExampleGroup[] = [
  {
    name: 'Transport',
    nameTranslations: { id: 'Transport & Travel', en: 'Transport & Travel', ja: '交通と旅行', es: 'Transporte y Viaje' },
    icons: [
      { key: 'car', label: 'Mobil', labelTranslations: { id: 'Mobil', en: 'Car', ja: '車', es: 'Coche' } },
      { key: 'train', label: 'Kereta', labelTranslations: { id: 'Kereta', en: 'Train', ja: '電車', es: 'Tren' } },
      { key: 'plane', label: 'Pesawat', labelTranslations: { id: 'Pesawat', en: 'Plane', ja: '飛行機', es: 'Avión' } },
      { key: 'ship', label: 'Kapal', labelTranslations: { id: 'Kapal', en: 'Ship', ja: '船', es: 'Barco' } },
      { key: 'bike', label: 'Sepeda/Motor', labelTranslations: { id: 'Sepeda/Motor', en: 'Bike/Motorcycle', ja: '自転車/バイク', es: 'Bicicleta/Moto' } },
      { key: 'compass', label: 'Kompas/Navigasi', labelTranslations: { id: 'Kompas/Navigasi', en: 'Compass', ja: 'コンパス', es: 'Brújula' } }
    ]
  },
  {
    name: 'Makanan',
    nameTranslations: { id: 'Makanan & Minuman', en: 'Food & Beverage', ja: '飲食', es: 'Comida y Bebida' },
    icons: [
      { key: 'food', label: 'Makan', labelTranslations: { id: 'Makan', en: 'Food', ja: '食事', es: 'Comida' } },
      { key: 'coffee', label: 'Kopi/Kafe', labelTranslations: { id: 'Kopi/Kafe', en: 'Coffee/Cafe', ja: 'コーヒー/カフェ', es: 'Café' } },
      { key: 'burger', label: 'Burger', labelTranslations: { id: 'Burger', en: 'Burger', ja: 'バーガー', es: 'Hamburguesa' } },
      { key: 'beer', label: 'Minuman/Bar', labelTranslations: { id: 'Minuman/Bar', en: 'Beer/Drinks', ja: 'ビール/ドリンク', es: 'Cerveza/Bebidas' } }
    ]
  },
  {
    name: 'Tagihan',
    nameTranslations: { id: 'Tagihan & Keuangan', en: 'Bills & Finance', ja: '請求書と財務', es: 'Facturas y Finanzas' },
    icons: [
      { key: 'electricity', label: 'Listrik', labelTranslations: { id: 'Listrik', en: 'Electricity', ja: '電気', es: 'Electricidad' } },
      { key: 'home', label: 'Rumah/Sewa', labelTranslations: { id: 'Rumah/Sewa', en: 'Home/Rent', ja: '住宅/賃貸', es: 'Hogar/Alquiler' } },
      { key: 'wifi', label: 'Internet/Wifi', labelTranslations: { id: 'Internet/Wifi', en: 'Internet/Wifi', ja: 'インターネット/Wifi', es: 'Internet/Wifi' } },
      { key: 'phone', label: 'Telepon/Pulsa', labelTranslations: { id: 'Telepon/Pulsa', en: 'Phone/Mobile', ja: '電話/携帯', es: 'Teléfono/Móvil' } },
      { key: 'receipt', label: 'Nota/Struk', labelTranslations: { id: 'Nota/Struk', en: 'Receipt', ja: 'レシート', es: 'Recibo' } },
      { key: 'creditcard', label: 'Kartu Kredit', labelTranslations: { id: 'Kartu Kredit', en: 'Credit Card', ja: 'クレジットカード', es: 'Tarjeta de Crédito' } }
    ]
  },
  {
    name: 'Belanja',
    nameTranslations: { id: 'Belanja & Hiburan', en: 'Shopping & Entertainment', ja: '買い物と娯楽', es: 'Compras y Entretenimiento' },
    icons: [
      { key: 'shopping', label: 'Belanja', labelTranslations: { id: 'Belanja', en: 'Shopping', ja: '買い物', es: 'Compras' } },
      { key: 'cart', label: 'Keranjang', labelTranslations: { id: 'Keranjang', en: 'Cart', ja: 'カート', es: 'Carrito' } },
      { key: 'gift', label: 'Hadiah', labelTranslations: { id: 'Hadiah', en: 'Gift', ja: 'ギフト', es: 'Regalo' } },
      { key: 'film', label: 'Bioskop/Film', labelTranslations: { id: 'Bioskop/Film', en: 'Movie', ja: '映画', es: 'Película' } },
      { key: 'gamepad', label: 'Game', labelTranslations: { id: 'Game', en: 'Gaming', ja: 'ゲーム', es: 'Videojuegos' } },
      { key: 'music', label: 'Musik', labelTranslations: { id: 'Musik', en: 'Music', ja: '音楽', es: 'Música' } },
      { key: 'tv', label: 'Televisi', labelTranslations: { id: 'Televisi', en: 'Television', ja: 'テレビ', es: 'Televisión' } },
      { key: 'camera', label: 'Kamera', labelTranslations: { id: 'Kamera', en: 'Camera', ja: 'カメラ', es: 'Cámara' } }
    ]
  },
  {
    name: 'Kesehatan',
    nameTranslations: { id: 'Kesehatan & Keluarga', en: 'Health & Family', ja: '健康と家族', es: 'Salud y Familia' },
    icons: [
      { key: 'health', label: 'Kesehatan', labelTranslations: { id: 'Kesehatan', en: 'Health', ja: '健康', es: 'Salud' } },
      { key: 'medical', label: 'Medis/Centang', labelTranslations: { id: 'Medis/Centang', en: 'Medical Check', ja: '医療チェック', es: 'Chequeo Médico' } },
      { key: 'stethoscope', label: 'Stetoskop', labelTranslations: { id: 'Stetoskop', en: 'Stethoscope', ja: '聴診器', es: 'Estetoscopio' } },
      { key: 'heart', label: 'Kasih Sayang', labelTranslations: { id: 'Kasih Sayang', en: 'Heart/Love', ja: 'ハート', es: 'Corazón' } },
      { key: 'pet', label: 'Hewan Peliharaan', labelTranslations: { id: 'Hewan Peliharaan', en: 'Pet', ja: 'ペット', es: 'Mascota' } },
      { key: 'umbrella', label: 'Payung/Proteksi', labelTranslations: { id: 'Payung/Proteksi', en: 'Umbrella/Insurance', ja: '傘/保険', es: 'Paraguas/Seguro' } }
    ]
  },
  {
    name: 'Pekerjaan',
    nameTranslations: { id: 'Pekerjaan & Pendidikan', en: 'Work & Education', ja: '仕事と教育', es: 'Trabajo y Educación' },
    icons: [
      { key: 'education', label: 'Pendidikan', labelTranslations: { id: 'Pendidikan', en: 'Education', ja: '教育', es: 'Educación' } },
      { key: 'award', label: 'Medali/Prestasi', labelTranslations: { id: 'Medali/Prestasi', en: 'Award', ja: '実績', es: 'Logro' } },
      { key: 'briefcase', label: 'Koper Kerja', labelTranslations: { id: 'Koper Kerja', en: 'Briefcase', ja: 'ブリーフケース', es: 'Maletín' } },
      { key: 'tool', label: 'Perkakas/Peralatan', labelTranslations: { id: 'Perkakas/Peralatan', en: 'Tool', ja: '工具', es: 'Herramienta' } },
      { key: 'globe', label: 'Dunia/Internet', labelTranslations: { id: 'Dunia/Internet', en: 'Globe', ja: '地球', es: 'Globo' } }
    ]
  },
  {
    name: 'Pemasukan',
    nameTranslations: { id: 'Sumber Pendapatan', en: 'Income Sources', ja: '収入源', es: 'Fuentes de Ingresos' },
    icons: [
      { key: 'salary', label: 'Gaji', labelTranslations: { id: 'Gaji', en: 'Salary', ja: '給与', es: 'Salario' } },
      { key: 'freelance', label: 'Freelance', labelTranslations: { id: 'Freelance', en: 'Freelance', ja: 'フリーランス', es: 'Freelance' } },
      { key: 'business', label: 'Bisnis', labelTranslations: { id: 'Bisnis', en: 'Business', ja: 'ビジネス', es: 'Negocios' } },
      { key: 'investment', label: 'Investasi', labelTranslations: { id: 'Investasi', en: 'Investment', ja: '投資', es: 'Inversión' } }
    ]
  },
  {
    name: 'Lainnya',
    nameTranslations: { id: 'Lain-Lain', en: 'Others', ja: 'その他', es: 'Otros' },
    icons: [
      { key: 'tag', label: 'Label', labelTranslations: { id: 'Label', en: 'Label', ja: 'ラベル', es: 'Etiqueta' } },
      { key: 'star', label: 'Bintang', labelTranslations: { id: 'Bintang', en: 'Star', ja: 'スター', es: 'Estrella' } },
      { key: 'key', label: 'Kunci', labelTranslations: { id: 'Kunci', en: 'Key', ja: '鍵', es: 'Llave' } },
      { key: 'lock', label: 'Gembok Kunci', labelTranslations: { id: 'Gembok Kunci', en: 'Lock', ja: 'ロック', es: 'Candado' } },
      { key: 'unlock', label: 'Buka Gembok', labelTranslations: { id: 'Buka Gembok', en: 'Unlock', ja: 'アンロック', es: 'Abrir Candado' } },
      { key: 'shield', label: 'Perisai/Aman', labelTranslations: { id: 'Perisai/Aman', en: 'Shield', ja: 'シールド', es: 'Escudo' } },
      { key: 'trash', label: 'Sampah', labelTranslations: { id: 'Sampah', en: 'Trash', ja: 'ゴミ箱', es: 'Basura' } },
      { key: 'user', label: 'Profil Pengguna', labelTranslations: { id: 'Profil Pengguna', en: 'User Profile', ja: 'ユーザー', es: 'Perfil de Usuario' } },
      { key: 'percent', label: 'Persen/Diskon', labelTranslations: { id: 'Persen/Diskon', en: 'Percent', ja: 'パーセント', es: 'Porcentaje' } },
      { key: 'smile', label: 'Senang', labelTranslations: { id: 'Senang', en: 'Happy', ja: 'ハッピー', es: 'Feliz' } },
      { key: 'frown', label: 'Sedih/Rugi', labelTranslations: { id: 'Sedih/Rugi', en: 'Sad/Loss', ja: '悲しい', es: 'Triste' } }
    ]
  }
]

export function loadUserSettings() {
  const saved = localStorage.getItem(settingsKey)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.currency) currency.value = parsed.currency
      if (parsed.appMode) appMode.value = parsed.appMode
      if (parsed.language) language.value = parsed.language
      if (parsed.contentScale) contentScale.value = parsed.contentScale
    } catch (e) {
      console.error('Failed to parse user settings', e)
    }
  }
}

export function saveUserSettings() {
  localStorage.setItem(settingsKey, JSON.stringify({
    currency: currency.value,
    appMode: appMode.value,
    language: language.value,
    contentScale: contentScale.value
  }))
}

// Initialize on import
loadUserSettings()

watch([currency, appMode, language, contentScale], () => {
  saveUserSettings()
}, { deep: true })

if (typeof document !== 'undefined') {
  watch(contentScale, (newScale) => {
    document.documentElement.classList.remove('scale-normal', 'scale-large', 'scale-xlarge')
    document.documentElement.classList.add(`scale-${newScale}`)
  }, { immediate: true })
}
