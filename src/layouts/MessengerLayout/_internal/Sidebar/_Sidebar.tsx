import { useRef, useState } from "react";

import { useChatsQuery } from "@/api/queries/chats.queries";
import { PencilIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";
import { B1, Caption, H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { AccountMenu } from "./_internal/AccountMenu";
import { ChatListItem } from "./_internal/ChatListItem";
import { NewChatPanel } from "./_internal/NewChatPanel";
import {
  SBody,
  SEmpty,
  SHeader,
  SList,
  SNewChatButton,
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
 * После закрытия панели «Новый чат» фокус возвращается на кнопку, которая её открыла.
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
      <SRoot>
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

      <SNewChatButton
        ref={focusAfterNewChat}
        type="button"
        aria-label={l.newChatButton}
        onClick={() => setView(ESidebarView.NEW_CHAT)}
      >
        <PencilIcon />
      </SNewChatButton>
    </SRoot>
  );
}
