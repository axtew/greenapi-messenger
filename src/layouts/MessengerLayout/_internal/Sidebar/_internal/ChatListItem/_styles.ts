import { createLink } from "@tanstack/react-router";
import styled, { css } from "styled-components";

import { B1, H3 } from "@/components/Typography";

/** Выбранный чат — заливка `primary` и белый текст; остальные подсвечиваются при наведении. */
const SAnchor = styled.a<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 9px;
  border-radius: ${({ theme }) => theme.radii.item};
  color: ${({ $isSelected, theme }) => ($isSelected ? theme.palette.onPrimary : theme.palette.text)};
  text-decoration: none;
  background: ${({ $isSelected, theme }) => ($isSelected ? theme.palette.primary : "transparent")};

  &:hover {
    background: ${({ $isSelected, theme }) =>
      $isSelected ? theme.palette.primary : theme.palette.surfaceMuted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.palette.primary};
    outline-offset: 2px;
  }
`;

/** Типизированная ссылка роутера (`to`, `params`) с разметкой строки списка. */
export const SLink = createLink(SAnchor);

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

/** Превью последнего сообщения; курсивом — заглушка удалённого. */
export const SPreview = styled(B1)<{ $isItalic: boolean }>`
  ${ellipsis}
  font-style: ${({ $isItalic }) => ($isItalic ? "italic" : "normal")};
`;

export const SBadge = styled.span`
  flex-shrink: 0;
  min-width: 22px;
  padding: 1px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  text-align: center;
  background: ${({ theme }) => theme.palette.unreadBadge};
`;
