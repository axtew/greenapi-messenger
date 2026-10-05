import { Avatar } from "@/components/Avatar";
import { B2, Caption } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import type { IChat } from "@/types/chats.types";
import { formatChatListTime } from "@/utils/helpers/dateFormat";

import { SBadge, SContent, SName, SPreview, SRoot, SRow } from "./_styles";

/** Больше этого числа бейдж показывает `99+`. */
const MAX_BADGE_COUNT = 99;

interface IChatListItemProps {
  chat: IChat;
}

/** Строка списка чатов: аватар, имя, превью последнего сообщения, время и число непрочитанных. */
export function ChatListItem({ chat }: IChatListItemProps) {
  const l = useI18nSelector(({ l }) => ({ unsupportedMessage: l.chat.unsupportedMessage }));
  const { chatId, name, avatarUrl, lastMessage, unreadCount } = chat;

  return (
    <SRoot>
      <Avatar chatId={chatId} name={name} avatarUrl={avatarUrl} size={54} />

      <SContent>
        <SRow>
          <SName forwardedAs="span">{name}</SName>
          {lastMessage !== null && (
            <Caption as="span" color="textMuted">
              {formatChatListTime(lastMessage.timestamp, new Date())}
            </Caption>
          )}
        </SRow>

        <SRow>
          <SPreview forwardedAs="span" color="textMuted">
            {lastMessage === null ? null : (lastMessage.text ?? l.unsupportedMessage)}
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
    </SRoot>
  );
}
