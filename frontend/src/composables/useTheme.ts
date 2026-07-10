export type ThemeMode = 'light' | 'dark' | 'midnight'

export type ThemeSettings = {
  mode: ThemeMode
  primary: string
  primaryAlpha: number
  surfaceMode: 'light' | 'dark'
}

type ThemePreset = {
  id: string
  label: string
  mode: ThemeMode
  primary: string
  surfaceMode: 'light' | 'dark'
}

const STORAGE_KEY = 'finance-theme-settings'

export const themePresets: ThemePreset[] = [
  { id: 'ocean-light', label: 'Ocean Light', mode: 'light', primary: '#2563eb', surfaceMode: 'light' },
  { id: 'forest-light', label: 'Forest Light', mode: 'light', primary: '#15803d', surfaceMode: 'light' },
  { id: 'sunset-light', label: 'Sunset Light', mode: 'light', primary: '#ea580c', surfaceMode: 'light' },
  { id: 'midnight-blue', label: 'Midnight Blue', mode: 'midnight', primary: '#4f46e5', surfaceMode: 'dark' },
  { id: 'graphite-dark', label: 'Graphite Dark', mode: 'dark', primary: '#0f766e', surfaceMode: 'dark' },
  { id: 'ruby-dark', label: 'Ruby Dark', mode: 'dark', primary: '#dc2626', surfaceMode: 'dark' },
]

const fallbackTheme: ThemeSettings = {
  mode: 'light',
  primary: '#2563eb',
  primaryAlpha: 1,
  surfaceMode: 'light',
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalizeHex = (value: string) => {
  const trimmed = value.trim().replace('#', '')
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed.split('').map((part) => `${part}${part}`).join('').toLowerCase()}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`
  }
  return fallbackTheme.primary
}

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).slice(1)
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

const hexToRgbString = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  return `${r} ${g} ${b}`
}

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, '0')).join('')}`

const mixHex = (base: string, target: string, weight: number) => {
  const from = hexToRgb(base)
  const to = hexToRgb(target)
  return rgbToHex({
    r: from.r + (to.r - from.r) * weight,
    g: from.g + (to.g - from.g) * weight,
    b: from.b + (to.b - from.b) * weight,
  })
}

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = (value: number) => {
    const normalized = value / 255
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  }
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

export const getContrastColor = (hex: string) => (luminance(hex) > 0.45 ? '#0f172a' : '#f8fafc')

export const getThemeSettings = (): ThemeSettings => {
  if (typeof window === 'undefined') return fallbackTheme

  const legacyTheme = window.localStorage.getItem('finance-theme') as ThemeMode | null
  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    if (legacyTheme === 'dark' || legacyTheme === 'midnight') {
      return {
        mode: legacyTheme,
        primary: legacyTheme === 'midnight' ? '#4f46e5' : '#0f766e',
        primaryAlpha: 1,
        surfaceMode: 'dark',
      }
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        return {
          mode: 'dark',
          primary: '#0f766e',
          primaryAlpha: 1,
          surfaceMode: 'dark',
        }
      }
    }
    return fallbackTheme
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>
    return {
      mode: parsed.mode === 'dark' || parsed.mode === 'midnight' ? parsed.mode : 'light',
      primary: normalizeHex(parsed.primary || fallbackTheme.primary),
      primaryAlpha:
        typeof parsed.primaryAlpha === 'number' ? clamp(parsed.primaryAlpha, 0, 1) : fallbackTheme.primaryAlpha,
      surfaceMode: parsed.surfaceMode === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return fallbackTheme
  }
}

export const saveThemeSettings = (settings: ThemeSettings) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.localStorage.setItem('finance-theme', settings.mode)
}

export const applyThemeSettings = (settings: ThemeSettings) => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const primary = normalizeHex(settings.primary)
  const primaryAlpha = clamp(settings.primaryAlpha, 0, 1)
  const primaryContrast = getContrastColor(primary)
  const surfaceMode = settings.surfaceMode
  const isDarkSurface = surfaceMode === 'dark'
  const heroAccent = mixHex(primary, isDarkSurface ? '#a5b4fc' : '#ffffff', isDarkSurface ? 0.12 : 0.2)
  const sidebarBg = isDarkSurface ? mixHex('#020617', primary, 0.18) : mixHex('#0f172a', primary, 0.2)
  const sidebarAccent = isDarkSurface ? mixHex('#111827', primary, 0.42) : mixHex('#1e293b', primary, 0.32)

  root.setAttribute('data-theme', settings.mode)
  root.setAttribute('data-surface-mode', surfaceMode)
  root.style.setProperty('--primary', primary)
  root.style.setProperty('--primary-rgb', hexToRgbString(primary))
  root.style.setProperty('--primary-alpha', String(primaryAlpha))
  root.style.setProperty('--primary-contrast', primaryContrast)
  root.style.setProperty('--primary-soft', mixHex(primary, isDarkSurface ? '#0f172a' : '#ffffff', isDarkSurface ? 0.7 : 0.84))
  root.style.setProperty('--primary-muted', mixHex(primary, isDarkSurface ? '#94a3b8' : '#e2e8f0', 0.72))
  root.style.setProperty('--hero-accent', heroAccent)
  root.style.setProperty('--sidebar-bg', sidebarBg)
  root.style.setProperty('--sidebar-accent', sidebarAccent)
  root.style.setProperty('--sidebar-text', getContrastColor(sidebarAccent))
  root.style.setProperty('--success', isDarkSurface ? '#4ade80' : '#16a34a')
  root.style.setProperty('--danger', isDarkSurface ? '#f87171' : '#dc2626')
  root.style.setProperty('--danger-soft', mixHex('#ef4444', isDarkSurface ? '#111827' : '#ffffff', isDarkSurface ? 0.74 : 0.86))
  root.style.setProperty('--danger-text', isDarkSurface ? '#fecaca' : '#b91c1c')
}

export const dispatchThemeChange = (settings: ThemeSettings) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('theme-preference-changed', { detail: settings }))
}

export const resolveThemePreset = (presetId: string) => themePresets.find((item) => item.id === presetId)

export const normalizeThemeInput = (settings: ThemeSettings): ThemeSettings => ({
  mode: settings.mode,
  primary: normalizeHex(settings.primary),
  primaryAlpha: clamp(settings.primaryAlpha, 0, 1),
  surfaceMode: settings.surfaceMode,
})
