export interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  glowA: string;
  glowB: string;
  gridColor: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentText: string;
  cardBg: string;
  cardBorder: string;
}

export const THEMES: Record<string, ThemePalette> = {
  editorial_dark: {
    bgPrimary: "#0A0C10",
    bgSecondary: "#121722",
    glowA: "rgba(217, 119, 6, 0.22)",
    glowB: "rgba(59, 130, 246, 0.14)",
    gridColor: "rgba(255, 255, 255, 0.04)",
    textPrimary: "#F8FAFC",
    textMuted: "#94A3B8",
    accent: "#F59E0B",
    accentText: "#0A0C10",
    cardBg: "rgba(15, 23, 42, 0.65)",
    cardBorder: "rgba(248, 250, 252, 0.12)",
  },
  parchment_modern: {
    bgPrimary: "#16120E",
    bgSecondary: "#231B14",
    glowA: "rgba(212, 175, 55, 0.20)",
    glowB: "rgba(180, 83, 9, 0.18)",
    gridColor: "rgba(245, 222, 179, 0.05)",
    textPrimary: "#FAF3E0",
    textMuted: "#C8B89A",
    accent: "#EAB308",
    accentText: "#16120E",
    cardBg: "rgba(35, 27, 20, 0.72)",
    cardBorder: "rgba(234, 179, 8, 0.22)",
  },
  kinetic_bold: {
    bgPrimary: "#09090B",
    bgSecondary: "#18181B",
    glowA: "rgba(239, 68, 68, 0.24)",
    glowB: "rgba(249, 115, 22, 0.16)",
    gridColor: "rgba(255, 255, 255, 0.045)",
    textPrimary: "#FFFFFF",
    textMuted: "#A1A1AA",
    accent: "#EF4444",
    accentText: "#FFFFFF",
    cardBg: "rgba(24, 24, 27, 0.72)",
    cardBorder: "rgba(255, 255, 255, 0.14)",
  },
};

export function getTheme(name: string): ThemePalette {
  return THEMES[name] ?? THEMES.editorial_dark;
}
