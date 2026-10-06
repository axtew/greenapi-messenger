import styled, { css } from "styled-components";

import { TAIL_WIDTH } from "../../_constants";

/** Строка ленты с одним пузырём: входящие — у левого края, исходящие — у правого. */
export const SRow = styled.div<{ $isOutgoing: boolean; $isLastInGroup: boolean }>`
  display: flex;
  justify-content: ${({ $isOutgoing }) => ($isOutgoing ? "flex-end" : "flex-start")};
  padding: 0 ${TAIL_WIDTH}px;
  margin-bottom: ${({ $isLastInGroup }) => ($isLastInGroup ? "8px" : "2px")};
`;

/**
 * Пузырь сообщения.
 *
 * `flow-root` удерживает внутри плавающее время: оно встаёт в последнюю строку текста, если там хватает места, иначе — под ней.
 * Хвостик — псевдоэлемент у нижнего угла со стороны отправителя; на этом углу скругления нет.
 */
export const SBubble = styled.div<{ $isOutgoing: boolean; $isLastInGroup: boolean }>`
  position: relative;
  display: flow-root;
  max-width: 70%;
  padding: 6px 8px 6px 10px;
  border-radius: ${({ theme }) => theme.radii.bubble};
  color: ${({ theme }) => theme.palette.text};
  background: ${({ $isOutgoing, theme }) =>
    $isOutgoing ? theme.palette.bubbleOutgoing : theme.palette.surface};
  white-space: pre-wrap;
  word-break: break-word;

  ${({ $isLastInGroup, $isOutgoing }) =>
    $isLastInGroup &&
    css`
      ${$isOutgoing ? "border-bottom-right-radius" : "border-bottom-left-radius"}: 0;

      &::before {
        content: "";
        position: absolute;
        bottom: 0;
        ${$isOutgoing ? "right" : "left"}: -${TAIL_WIDTH - 1}px;
        width: ${TAIL_WIDTH}px;
        height: 16px;
        background: inherit;
        clip-path: ${
          $isOutgoing
            ? `path("M 0 0 C 0 9 3 14 9 16 L 0 16 Z")`
            : `path("M 9 0 C 9 9 6 14 0 16 L 9 16 Z")`
        };
      }
    `}
`;

export const SUnsupported = styled.span`
  font-style: italic;
`;

export const SLink = styled.a`
  color: ${({ theme }) => theme.palette.primary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

/**
 * Время или пометка о недоставке в правом нижнем углу пузыря.
 *
 * Отрицательный нижний отступ опускает подпись к нижнему краю строки текста, не увеличивая высоту пузыря.
 */
export const SMeta = styled.span<{ $isPending: boolean }>`
  float: right;
  margin: 7px 0 -6px 12px;
  opacity: ${({ $isPending }) => ($isPending ? 0.5 : 1)};
`;
