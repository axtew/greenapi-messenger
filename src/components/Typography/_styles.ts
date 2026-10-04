import type { CSSProperties } from "react";
import styled, { type DefaultTheme } from "styled-components";

/** Ключи палитры, допустимые как цвет текста. */
export type TTextColor = keyof Pick<
  DefaultTheme["palette"],
  "text" | "textMuted" | "primary" | "danger" | "onPrimary" | "metaOutgoing"
>;

/** Общая база текста: без внешних отступов, цвет из палитры (по умолчанию — наследуется) и выравнивание. */
const SBaseText = styled.p<{
  $color?: TTextColor;
  $textAlign?: CSSProperties["textAlign"];
}>`
  margin: 0;
  color: ${({ $color, theme }) => ($color === undefined ? "inherit" : theme.palette[$color])};
  text-align: ${({ $textAlign = "inherit" }) => $textAlign};
`;

export const SH1 = styled(SBaseText)`
  font-size: ${({ theme }) => theme.typography.fontSizes.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  line-height: 1.25;
`;

export const SH3 = styled(SBaseText)`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  line-height: 1.35;
`;

export const SB1 = styled(SBaseText)`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.regular};
  line-height: 1.4;
`;

export const SB2 = styled(SBaseText)`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.regular};
  line-height: 1.4;
`;

export const SCaption = styled(SBaseText)`
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeights.regular};
  line-height: 1.35;
`;
