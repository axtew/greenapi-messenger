import styled, { keyframes } from "styled-components";

/** Пульсация плейсхолдеров на время загрузки. */
export const skeletonPulse = keyframes`
  50% {
    opacity: 0.5;
  }
`;

/** Левая панель: на широком экране — карточка с отступом от краёв окна, на узком — весь экран. */
export const SRoot = styled.aside`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 420px;
  min-height: 0;
  margin: 18px;
  margin-right: 0;
  border-radius: ${({ theme }) => theme.radii.panel};
  background: ${({ theme }) => theme.palette.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    width: 100%;
    margin: 0;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
    border-radius: 0;
  }
`;

export const SHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
`;

/** Прокручиваемая область под шапкой: список чатов или его состояния. */
export const SBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 8px 8px;
  overflow-y: auto;
`;

export const SSyncError = styled.div`
  padding: 4px 9px 8px;
`;

export const SList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** Плейсхолдер строки списка — повторяет раскладку `ChatListItem`. */
export const SSkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 9px;
`;

const SSkeletonShape = styled.div`
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.surfaceMuted};
  animation: ${skeletonPulse} 1.5s ease-in-out infinite;
`;

export const SSkeletonAvatar = styled(SSkeletonShape)`
  flex-shrink: 0;
  width: 54px;
  height: 54px;
`;

export const SSkeletonLines = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
`;

export const SSkeletonLine = styled(SSkeletonShape)<{ $width: string }>`
  width: ${({ $width }) => $width};
  height: 14px;
`;

export const SEmpty = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 24px;
`;
