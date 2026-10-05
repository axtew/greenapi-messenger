import styled from "styled-components";

export const SRoot = styled.div<{ $size: number; $background: string }>`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  color: ${({ theme }) => theme.palette.onPrimary};
  background: ${({ $background }) => $background};
  user-select: none;
`;

export const SImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
