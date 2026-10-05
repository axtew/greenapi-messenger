import { useChatsQuery } from "@/api/queries/chats.queries";
import { B1, Caption, H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { AccountMenu } from "./_internal/AccountMenu";
import { ChatListItem } from "./_internal/ChatListItem";
import {
  SBody,
  SEmpty,
  SHeader,
  SList,
  SRoot,
  SSkeletonAvatar,
  SSkeletonLine,
  SSkeletonLines,
  SSkeletonRow,
  SSyncError,
} from "./_styles";

const SKELETON_ROWS_COUNT = 3;

/** Левая панель мессенджера: шапка с меню аккаунта и список чатов. */
export function Sidebar() {
  const l = useI18nSelector(({ l }) => l.sidebar);
  const { data: chats, isFetching, isError } = useChatsQuery();

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
              <SSkeletonAvatar />
              <SSkeletonLines>
                <SSkeletonLine $width="45%" />
                <SSkeletonLine $width="75%" />
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
    </SRoot>
  );
}
