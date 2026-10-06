import styled from "styled-components";

export const SButton = styled.button`
  min-height: 48px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.item};
  color: ${({ theme }) => theme.palette.onPrimary};
  background: ${({ theme }) => theme.palette.primary};
  cursor: pointer;

  /* Своего оттенка наведения в палитре нет — затемняется сам основной цвет. */
  &:hover:enabled {
    filter: brightness(0.92);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary};
    outline-offset: 2px;
  }
`;
