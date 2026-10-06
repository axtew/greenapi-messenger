import styled, { keyframes } from "styled-components";

/** Пульсация плейсхолдера на время загрузки. */
const pulse = keyframes`
  50% {
    opacity: 0.5;
  }
`;

export const SRoot = styled.div<{ $width: string; $height: string }>`
  flex-shrink: 0;
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;
