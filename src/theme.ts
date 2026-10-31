export const colors = {
  background: "#FBF7F2",
  surface: "#FFFFFF",
  ink: "#1F1A17",
  muted: "#7A6F66",
  faint: "#B3A89E",
  placeholder: "#746A61",
  border: "#EFE6DC",
  primary: "#D9480F",
  primarySoft: "#FFE8DC",
  onPrimary: "#FFFFFF",
  success: "#2B8A3E",
  successSoft: "#E3F5E6",
  danger: "#C92A2A",
  dangerSoft: "#FDE5E5",
  warning: "#B7791F",
  warningSoft: "#FFF3D6",
  // Darker text for small labels on the matching soft backgrounds (≥ 4.5:1).
  primaryInk: "#B23A0A",
  successInk: "#237A35",
  dangerInk: "#B02525",
  warningInk: "#8A5A12",
  mutedInk: "#5F564F",
} as const;

export const fonts = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
  black: "Cairo_900Black",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export function formatPrice(amount: number) {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(2)}\u00A0ج.م`;
}

export const stackScreenOptions = {
  contentStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTitleStyle: { fontFamily: fonts.bold, color: colors.ink },
  headerTintColor: colors.ink,
  headerBackButtonDisplayMode: "minimal",
} as const;
