const PRESETS = {
  blue: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryDeeper: '#1e40af',
    primaryMuted: 'rgba(37, 99, 235, 0.14)',
    primarySurface: '#eff6ff',
    primaryGlow: '#f5f9ff',
    shadowPrimarySm: '0 2px 8px color-mix(in srgb, #2563eb 28%, transparent)',
    primaryFocusRing: 'rgba(37, 99, 235, 0.18)',
    primaryBorder: 'rgba(37, 99, 235, 0.2)',
    verifySubmitText: '#ffffff',
    verifyBannerBg: '#eff6ff',
    verifyBannerBorder: '#bfdbfe',
    verifyBannerIconBg: '#dbeafe',
    verifyBannerIconColor: '#1d4ed8',
    verifyBannerTitleColor: '#1e3a5f',
    verifyBannerDescColor: 'rgba(30, 58, 95, 0.85)',
    shortcutInfoBg: '#dbeafe',
    shortcutInfoColor: '#2563eb',
    shortcutMapBg: '#dbeafe',
    shortcutMapColor: '#2563eb',
    shortcutShuttleBg: '#dbeafe',
    shortcutShuttleColor: '#2563eb',
  },
  orange: {
    primary: '#ff6600',
    primaryDark: '#ea580c',
    primaryDeeper: '#c2410c',
    primaryMuted: 'rgba(255, 102, 0, 0.12)',
    primarySurface: '#fff4eb',
    primaryGlow: '#fffaf5',
    shadowPrimarySm: '0 2px 10px rgba(255, 102, 0, 0.28)',
    primaryFocusRing: 'rgba(255, 102, 0, 0.15)',
    primaryBorder: 'rgba(255, 102, 0, 0.2)',
    verifySubmitText: '#ffffff',
    verifyBannerBg: '#fff4eb',
    verifyBannerBorder: '#fed7aa',
    verifyBannerIconBg: '#ffedd5',
    verifyBannerIconColor: '#ea580c',
    verifyBannerTitleColor: '#78350f',
    verifyBannerDescColor: 'rgba(120, 53, 15, 0.85)',
    shortcutInfoBg: '#ffedd5',
    shortcutInfoColor: '#ea580c',
    shortcutMapBg: '#ffedd5',
    shortcutMapColor: '#ea580c',
    shortcutShuttleBg: '#ffedd5',
    shortcutShuttleColor: '#ea580c',
  },
  green: {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryDeeper: '#166534',
    primaryMuted: 'rgba(22, 163, 74, 0.14)',
    primarySurface: '#f0fdf4',
    primaryGlow: '#f7fef9',
    shadowPrimarySm: '0 2px 8px color-mix(in srgb, #16a34a 28%, transparent)',
    primaryFocusRing: 'rgba(22, 163, 74, 0.18)',
    primaryBorder: 'rgba(22, 163, 74, 0.2)',
    verifySubmitText: '#ffffff',
    verifyBannerBg: '#f0fdf4',
    verifyBannerBorder: '#bbf7d0',
    verifyBannerIconBg: '#dcfce7',
    verifyBannerIconColor: '#16a34a',
    verifyBannerTitleColor: '#14532d',
    verifyBannerDescColor: 'rgba(20, 83, 45, 0.85)',
    shortcutInfoBg: '#dcfce7',
    shortcutInfoColor: '#16a34a',
    shortcutMapBg: '#dcfce7',
    shortcutMapColor: '#16a34a',
    shortcutShuttleBg: '#dcfce7',
    shortcutShuttleColor: '#16a34a',
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
  s.setProperty('--primary-focus-ring', preset.primaryFocusRing)
  s.setProperty('--primary-border', preset.primaryBorder)
  s.setProperty('--verify-submit-text', preset.verifySubmitText)
  s.setProperty('--verify-banner-bg', preset.verifyBannerBg)
  s.setProperty('--verify-banner-border', preset.verifyBannerBorder)
  s.setProperty('--verify-banner-icon-bg', preset.verifyBannerIconBg)
  s.setProperty('--verify-banner-icon-color', preset.verifyBannerIconColor)
  s.setProperty('--verify-banner-title-color', preset.verifyBannerTitleColor)
  s.setProperty('--verify-banner-desc-color', preset.verifyBannerDescColor)
  s.setProperty('--shortcut-info-bg', preset.shortcutInfoBg)
  s.setProperty('--shortcut-info-color', preset.shortcutInfoColor)
  s.setProperty('--shortcut-map-bg', preset.shortcutMapBg)
  s.setProperty('--shortcut-map-color', preset.shortcutMapColor)
  s.setProperty('--shortcut-shuttle-bg', preset.shortcutShuttleBg)
  s.setProperty('--shortcut-shuttle-color', preset.shortcutShuttleColor)
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
    '--primary-focus-ring': p.primaryFocusRing,
    '--primary-border': p.primaryBorder,
    '--verify-submit-text': p.verifySubmitText,
    '--verify-banner-bg': p.verifyBannerBg,
    '--verify-banner-border': p.verifyBannerBorder,
    '--verify-banner-icon-bg': p.verifyBannerIconBg,
    '--verify-banner-icon-color': p.verifyBannerIconColor,
    '--verify-banner-title-color': p.verifyBannerTitleColor,
    '--verify-banner-desc-color': p.verifyBannerDescColor,
    '--shortcut-info-bg': p.shortcutInfoBg,
    '--shortcut-info-color': p.shortcutInfoColor,
    '--shortcut-map-bg': p.shortcutMapBg,
    '--shortcut-map-color': p.shortcutMapColor,
    '--shortcut-shuttle-bg': p.shortcutShuttleBg,
    '--shortcut-shuttle-color': p.shortcutShuttleColor,
  }
}
