import styled, { keyframes } from "styled-components";

export const SRoot = styled.div`
  position: relative;
`;

const SBareButton = styled.button`
  border: none;
  color: inherit;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary};
    outline-offset: -2px;
  }
`;

export const SMenuButton = styled(SBareButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.palette.textMuted};

  &:hover,
  &[aria-expanded="true"] {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

/** Прозрачная подложка на весь экран под открытым меню: клик вне меню попадает в неё и закрывает меню. */
export const SBackdrop = styled(SBareButton)`
  position: fixed;
  inset: 0;
  z-index: 1;
  padding: 0;
  cursor: default;
`;

export const SDropdown = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-width: 240px;
  padding: 8px 0;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radii.item};
  background: ${({ theme }) => theme.palette.surface};

  /* Фокус получает при открытии программно, чтобы ловить Escape; в Tab-порядке его нет — рамка не нужна. */
  &:focus {
    outline: none;
  }
`;

export const SAccount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 16px 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border};
`;

const pulse = keyframes`
  50% {
    opacity: 0.5;
  }
`;

/** Плейсхолдер строки аккаунта на время загрузки — высотой с одну строку `B1`. */
export const SAccountSkeleton = styled.div`
  width: 60%;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export const SLogoutButton = styled(SBareButton)`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 44px;
  padding: 0 16px;
  text-align: left;

  & > svg {
    color: ${({ theme }) => theme.palette.textMuted};
  }

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;
