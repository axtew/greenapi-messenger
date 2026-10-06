import styled, { css } from "styled-components";

import type { TIconButtonSize, TIconButtonVariant } from "./_types";

const SIZE_PX: Record<TIconButtonSize, number> = {
  md: 44,
  lg: 56,
};

const ghost = css`
  color: ${({ theme }) => theme.palette.textMuted};
  background: transparent;

  &:hover,
  &[aria-expanded="true"] {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }

  &:focus-visible {
    outline-offset: -2px;
  }
`;

const primary = css`
  color: ${({ theme }) => theme.palette.onPrimary};
  background: ${({ theme }) => theme.palette.primary};

  /* Своего оттенка наведения в палитре нет — затемняется сам основной цвет. */
  &:hover:enabled {
    filter: brightness(0.92);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  /* Снаружи кнопки: внутри обводка основного цвета слилась бы с заливкой. */
  &:focus-visible {
    outline-offset: 2px;
  }
`;

export const SButton = styled.button<{
  $variant: TIconButtonVariant;
  $size: TIconButtonSize;
}>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => SIZE_PX[$size]}px;
  height: ${({ $size }) => SIZE_PX[$size]}px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.pill};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary};
  }

  ${({ $variant }) => ($variant === "primary" ? primary : ghost)}
`;
