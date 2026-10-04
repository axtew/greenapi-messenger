const palette = {
  primary: "#3390ec",
  surface: "#ffffff",
  surfaceMuted: "#f4f4f5",
  text: "#000000",
  textMuted: "#707579",
  border: "#dadce0",
  bubbleOutgoing: "#eeffde",
  metaOutgoing: "#4fae4e",
  unreadBadge: "#4fae4e",
  datePill: "#72a664",
  danger: "#e53935",
  onPrimary: "#ffffff",
  chatBackground: "linear-gradient(135deg, #b2c99e 0%, #a9c59f 50%, #98bd90 100%)",
  /** Фоны аватаров с инициалами: красный, оранжевый, фиолетовый, зелёный, бирюзовый, синий, розовый. */
  avatarColors: ["#e17076", "#faa774", "#a695e7", "#7bc862", "#6ec9cb", "#65aadd", "#ee7aae"],
} as const;

const typography = {
  fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "20px",
    xl: "24px",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
  },
} as const;

const radii = {
  pill: "9999px",
  panel: "24px",
  item: "12px",
  bubble: "15px",
} as const;

const breakpoints = {
  /** Ширина, до которой включительно приложение показывает одну колонку вместо двух. */
  mobileMax: "767px",
} as const;

/** Единственный источник цветов, шрифтов, радиусов и брейкпоинтов приложения. */
export const theme = {
  palette,
  typography,
  radii,
  breakpoints,
};

declare module "styled-components" {
  export interface DefaultTheme {
    palette: typeof palette;
    typography: typeof typography;
    radii: typeof radii;
    breakpoints: typeof breakpoints;
  }
}
