import styled, { css } from "styled-components";

import { B1, H3 } from "@/components/Typography";

export const SRoot = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 9px;
  border-radius: ${({ theme }) => theme.radii.item};

  &:hover {
    background: ${({ theme }) => theme.palette.surfaceMuted};
  }
`;

export const SContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const SRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/**
 * Одна строка с многоточием на конце; растягивается и уступает место времени и бейджу.
 * Стоит на самом тексте: многоточие рисуется цветом и шрифтом того элемента, на котором задана обрезка.
 */
const ellipsis = css`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SName = styled(H3)`
  ${ellipsis}
`;

export const SPreview = styled(B1)`
  ${ellipsis}
`;

export const SBadge = styled.span`
  flex-shrink: 0;
  min-width: 22px;
  padding: 1px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  text-align: center;
  background: ${({ theme }) => theme.palette.unreadBadge};
`;
