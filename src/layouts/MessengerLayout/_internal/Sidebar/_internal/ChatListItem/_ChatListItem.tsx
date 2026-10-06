import { useParams } from "@tanstack/react-router";

import { Avatar } from "@/components/Avatar";
import { B2, Caption } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import { routerPaths } from "@/routes/_paths";
import type { IChat } from "@/types/chats.types";
import { formatChatListTime } from "@/utils/helpers/dateFormat";

import { SBadge, SContent, SLink, SName, SPreview, SRow } from "./_styles";

/** Больше этого числа бейдж показывает `99+`. */
const MAX_BADGE_COUNT = 99;

interface IChatListItemProps {
  chat: IChat;
}

/** Строка списка чатов — ссылка на чат: аватар, имя, превью последнего сообщения, время и число непрочитанных. */
export function ChatListItem({ chat }: IChatListItemProps) {
  const l = useI18nSelector(({ l }) => ({
    unsupportedMessage: l.chat.unsupportedMessage,
    deletedMessage: l.chat.deletedMessage,
  }));
  const { chatId, name, avatarUrl, lastMessage, unreadCount } = chat;
  const isSelected = useParams({ strict: false }).chatId === chatId;
  const mutedColor = isSelected ? "onPrimary" : "textMuted";
  const isDeleted = lastMessage !== null && lastMessage.isDeleted;

  return (
    <SLink to={routerPaths.chat} params={{ chatId }} $isSelected={isSelected}>
      <Avatar chatId={chatId} name={name} avatarUrl={avatarUrl} size={54} />

      <SContent>
        <SRow>
          <SName forwardedAs="span">{name}</SName>
          {lastMessage !== null && (
            <Caption as="span" color={mutedColor}>
              {formatChatListTime(lastMessage.timestamp, new Date())}
            </Caption>
          )}
        </SRow>

        <SRow>
          <SPreview forwardedAs="span" color={mutedColor} $isItalic={isDeleted}>
            {lastMessage !== null &&
              (isDeleted ? l.deletedMessage : (lastMessage.text ?? l.unsupportedMessage))}
          </SPreview>
          {unreadCount > 0 && (
            <SBadge>
              <B2 as="span" color="onPrimary">
                {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
              </B2>
            </SBadge>
          )}
        </SRow>
      </SContent>
    </SLink>
  );
}
