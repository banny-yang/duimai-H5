import type { H5Branding } from "@/api/runner-api";

type ThemePreset = {
  primary: string;
  primaryDark: string;
  primaryDeeper: string;
  primaryMuted: string;
  primarySurface: string;
  primaryGlow: string;
};

/** 与主办控制台 themeColor 选项一致 */
const PRESETS: Record<string, ThemePreset> = {
  blue: {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryDeeper: "#1e40af",
    primaryMuted: "rgba(37, 99, 235, 0.14)",
    primarySurface: "#eff6ff",
    primaryGlow: "#f5f9ff",
  },
  orange: {
    primary: "#ea580c",
    primaryDark: "#c2410c",
    primaryDeeper: "#9a3412",
    primaryMuted: "rgba(234, 88, 12, 0.14)",
    primarySurface: "#fff7ed",
    primaryGlow: "#fffaf5",
  },
  green: {
    primary: "#16a34a",
    primaryDark: "#15803d",
    primaryDeeper: "#166534",
    primaryMuted: "rgba(22, 163, 74, 0.14)",
    primarySurface: "#f0fdf4",
    primaryGlow: "#f7fef9",
  },
};

const DEFAULT_PRESET: ThemePreset = {
  primary: "#06b6d4",
  primaryDark: "#0891b2",
  primaryDeeper: "#0e7490",
  primaryMuted: "rgba(6, 182, 212, 0.14)",
  primarySurface: "#f0f9fa",
  primaryGlow: "#f4fbfb",
};

function hexToRgbChannels(hex: string): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return "6 182 212";
  const n = Number.parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function applyPreset(root: HTMLElement, preset: ThemePreset): void {
  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--primary-rgb", hexToRgbChannels(preset.primary));
  root.style.setProperty("--primary-dark", preset.primaryDark);
  root.style.setProperty("--primary-deeper", preset.primaryDeeper);
  root.style.setProperty("--primary-muted", preset.primaryMuted);
  root.style.setProperty("--primary-surface", preset.primarySurface);
  root.style.setProperty("--primary-glow", preset.primaryGlow);
  root.style.setProperty(
    "--shadow-primary-sm",
    `0 2px 8px color-mix(in srgb, ${preset.primary} 28%, transparent)`,
  );
}

export function applyH5BrandTheme(branding: H5Branding | null | undefined): void {
  const key = (branding?.themeColor ?? "").trim().toLowerCase();
  const preset = PRESETS[key] ?? DEFAULT_PRESET;
  applyPreset(document.documentElement, preset);
}

export function resetH5BrandTheme(): void {
  applyPreset(document.documentElement, DEFAULT_PRESET);
}
