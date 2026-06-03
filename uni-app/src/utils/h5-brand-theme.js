const PRESETS = {
  blue: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryDeeper: '#1e40af',
    primaryMuted: 'rgba(37, 99, 235, 0.14)',
    primarySurface: '#eff6ff',
    primaryGlow: '#f5f9ff',
    shadowPrimarySm: '0 2px 8px color-mix(in srgb, #2563eb 28%, transparent)',
  },
  orange: {
    primary: '#ff6600',
    primaryDark: '#ea580c',
    primaryDeeper: '#c2410c',
    primaryMuted: 'rgba(255, 102, 0, 0.12)',
    primarySurface: '#fff4eb',
    primaryGlow: '#fffaf5',
    shadowPrimarySm: '0 2px 10px rgba(255, 102, 0, 0.28)',
  },
  green: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryDeeper: '#166534',
    primaryMuted: 'rgba(22, 163, 74, 0.14)',
    primarySurface: '#f0fdf4',
    primaryGlow: '#f7fef9',
    shadowPrimarySm: '0 2px 8px color-mix(in srgb, #16a34a 28%, transparent)',
  },
}

const DEFAULT_PRESET = PRESETS.orange

function hexToRgbChannels(hex) {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return '255 102 0'
  const n = Number.parseInt(h, 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function applyPresetToTarget(target, preset) {
  if (!target?.style) return
  const s = target.style
  s.setProperty('--primary', preset.primary)
  s.setProperty('--primary-rgb', hexToRgbChannels(preset.primary))
  s.setProperty('--primary-dark', preset.primaryDark)
  s.setProperty('--primary-deeper', preset.primaryDeeper)
  s.setProperty('--primary-muted', preset.primaryMuted)
  s.setProperty('--primary-surface', preset.primarySurface)
  s.setProperty('--primary-glow', preset.primaryGlow)
  s.setProperty('--shadow-primary-sm', preset.shadowPrimarySm)
  s.setProperty('--user-bubble-bg', preset.primary)
  s.setProperty('--user-bubble-shadow', `0 2px 8px rgba(${hexToRgbChannels(preset.primary)}, 0.22)`)
}

export function applyH5BrandTheme(branding) {
  const key = (branding?.themeColor ?? '').trim().toLowerCase()
  const preset = PRESETS[key] ?? DEFAULT_PRESET
  // #ifdef H5
  if (typeof document !== 'undefined') {
    applyPresetToTarget(document.documentElement, preset)
  }
  // #endif
  return preset
}

export function brandThemeStyle(preset) {
  const p = preset || DEFAULT_PRESET
  return {
    '--primary': p.primary,
    '--primary-rgb': hexToRgbChannels(p.primary),
    '--primary-dark': p.primaryDark,
    '--primary-deeper': p.primaryDeeper,
    '--primary-muted': p.primaryMuted,
    '--primary-surface': p.primarySurface,
    '--primary-glow': p.primaryGlow,
    '--shadow-primary-sm': p.shadowPrimarySm,
    '--user-bubble-bg': p.primary,
  }
}
