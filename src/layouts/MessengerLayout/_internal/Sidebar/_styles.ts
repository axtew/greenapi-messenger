import styled from "styled-components";

import { SLayout } from "../../_styles";

/** Левая панель: на широком экране — карточка с отступом от краёв окна, на узком — весь экран. */
export const SRoot = styled.aside`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: clamp(280px, 28vw, 380px);
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

    /* Открыт чат — на узком экране видна только его колонка. */
    ${SLayout}[data-chat-open="true"] > & {
      display: none;
    }
  }
`;

export const SHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
`;

/**
 * Прокручиваемая область под шапкой: список чатов или его состояния.
 *
 * Нижний отступ — под кнопку нового чата: она лежит поверх списка и иначе закрывала бы последний чат.
 */
export const SBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 8px 88px;
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

export const SSkeletonLines = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
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

/** Место круглой кнопки нового чата: правый нижний угол панели, поверх списка. */
export const SNewChatButtonSlot = styled.div`
  position: absolute;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
`;
