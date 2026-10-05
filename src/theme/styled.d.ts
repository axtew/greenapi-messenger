import type { theme } from "./_theme";

type TTheme = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme {
    palette: TTheme["palette"];
    typography: TTheme["typography"];
    radii: TTheme["radii"];
    breakpoints: TTheme["breakpoints"];
  }
}
