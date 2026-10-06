import { type KeyboardEvent, useRef, useState } from "react";

import { useChatsQuery } from "@/api/queries/chats.queries";
import { IconButton } from "@/components/IconButton";
import { PencilIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";
import { B1, Caption, H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import { EKeyboardKey } from "@/types/common.types";

import { AccountMenu } from "./_internal/AccountMenu";
import { ChatListItem } from "./_internal/ChatListItem";
import { NewChatPanel } from "./_internal/NewChatPanel";
import {
  SBody,
  SEmpty,
  SHeader,
  SList,
  SNewChatButtonSlot,
  SRoot,
  SSkeletonLines,
  SSkeletonRow,
  SSyncError,
} from "./_styles";

const SKELETON_ROWS_COUNT = 3;

/** Что показывает левая панель. */
enum ESidebarView {
  LIST = "list",
  NEW_CHAT = "newChat",
}

/**
 * Левая панель мессенджера: шапка с меню аккаунта и список чатов либо панель «Новый чат».
 *
 * Список чатов запрашивается при любом виде: запрос должен существовать с первого рендера каркаса.
 * Панель «Новый чат» закрывается кнопкой «назад» или `Escape` при фокусе внутри панели; после закрытия фокус
 * возвращается на кнопку, которая её открыла.
 */
export function Sidebar() {
  const l = useI18nSelector(({ l }) => l.sidebar);

  const [view, setView] = useState(ESidebarView.LIST);
  const isNewChatClosedRef = useRef(false);

  const { data: chats, isFetching, isError } = useChatsQuery();

  const closeNewChat = () => {
    isNewChatClosedRef.current = true;
    setView(ESidebarView.LIST);
  };

  /**
   * `Escape` в панели «Новый чат» закрывает её. Событие отменяется: открытый рядом чат на это нажатие не закрывается.
   * Во время IME-ввода номера клавиша принадлежит вводу.
   */
  const onNewChatKeyDown = (event: KeyboardEvent) => {
    if (event.key === EKeyboardKey.ESCAPE && !event.nativeEvent.isComposing) {
      event.preventDefault();
      closeNewChat();
    }
  };

  /**
   * Возвращает фокус на кнопку нового чата после закрытия панели «Новый чат».
   *
   * Ref-callback, а не эффект: кнопка монтируется заново при каждом возврате к списку.
   */
  const focusAfterNewChat = (button: HTMLButtonElement | null) => {
    if (button !== null && isNewChatClosedRef.current) {
      isNewChatClosedRef.current = false;
      button.focus();
    }
  };

  if (view === ESidebarView.NEW_CHAT) {
    return (
      <SRoot onKeyDown={onNewChatKeyDown}>
        <NewChatPanel onClose={closeNewChat} />
      </SRoot>
    );
  }

  return (
    <SRoot>
      <SHeader>
        <AccountMenu />
        <H3 as="h2">{l.title}</H3>
      </SHeader>

      <SBody>
        {isError && (
          <SSyncError role="alert">
            <Caption color="danger">{l.syncError}</Caption>
          </SSyncError>
        )}

        {chats.length > 0 && (
          <SList>
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <ChatListItem chat={chat} />
              </li>
            ))}
          </SList>
        )}

        {chats.length === 0 &&
          isFetching &&
          Array.from({ length: SKELETON_ROWS_COUNT }, (_, index) => (
            <SSkeletonRow key={index}>
              <Skeleton width="54px" height="54px" />
              <SSkeletonLines>
                <Skeleton width="45%" height="14px" />
                <Skeleton width="75%" height="14px" />
              </SSkeletonLines>
            </SSkeletonRow>
          ))}

        {chats.length === 0 && !isFetching && !isError && (
          <SEmpty>
            <H3 textAlign="center">{l.emptyTitle}</H3>
            <B1 color="textMuted" textAlign="center">
              {l.emptyHint}
            </B1>
          </SEmpty>
        )}
      </SBody>

      <SNewChatButtonSlot>
        <IconButton
          ref={focusAfterNewChat}
          variant="primary"
          size="lg"
          aria-label={l.newChatButton}
          onClick={() => setView(ESidebarView.NEW_CHAT)}
        >
          <PencilIcon />
        </IconButton>
      </SNewChatButtonSlot>
    </SRoot>
  );
}
