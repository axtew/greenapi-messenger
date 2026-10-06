import styled from "styled-components";

export const SButton = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.palette.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover,
  &[aria-expanded="true"] {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary};
    outline-offset: -2px;
  }
`;
