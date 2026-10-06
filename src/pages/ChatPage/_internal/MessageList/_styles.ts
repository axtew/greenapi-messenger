import styled from "styled-components";

import { TAIL_WIDTH } from "./_constants";

/** Прокручиваемая область ленты: занимает всё место между шапкой и полем ввода. */
export const SScroller = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

/** Содержимое ленты прижато к низу: короткая переписка стоит над полем ввода, а не под шапкой. */
export const SContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100%;
  padding: 8px 0;
`;

export const SDateRow = styled.div`
  display: flex;
  justify-content: center;
  margin: 8px 0;
`;

export const SCentered = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`;

/** Плейсхолдер пузыря: входящие у левого края, исходящие у правого, с тем же отступом под хвостик, что у пузырей. */
export const SSkeletonRow = styled.div<{ $isOutgoing: boolean }>`
  display: flex;
  justify-content: ${({ $isOutgoing }) => ($isOutgoing ? "flex-end" : "flex-start")};
  margin-bottom: 8px;
  padding: 0 ${TAIL_WIDTH}px;
`;

export const SError = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: ${({ theme }) => theme.radii.panel};
  background: ${({ theme }) => theme.palette.surface};
`;
