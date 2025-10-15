export const COLORS = {
  // Backgrounds
  background: "#0f0f23",
  backgroundSecondary: "#1a1a2e",
  backgroundTertiary: "#252540",

  // Accents
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  secondary: "#a855f7",

  // Status
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#aaaaaa",
  textTertiary: "#666666",

  // Borders
  border: "#333333",
  borderLight: "#444444",
  borderFocus: "#6366f1",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

export const ANIMATIONS = {
  fast: 200,
  medium: 300,
  slow: 500,
};
