import { useNavigate } from "@tanstack/react-router";

import { Avatar } from "@/components/Avatar";
import { BackIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";
import { B2 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import { routerPaths } from "@/routes/_paths";
import type { IChat } from "@/types/chats.types";
import { formatContactHandle } from "@/utils/helpers/contactFormat";

import { SBackButton, SHeader, SHeaderText, SHeaderTitle } from "./_styles";

/** Диаметр аватара в шапке; плейсхолдер на время поиска чата того же размера. */
const AVATAR_SIZE = 42;

interface IChatHeaderProps {
  /** Чат собеседника; `undefined` — чат ещё ищут, вместо аватара и имени показываются плейсхолдеры. */
  chat: IChat | undefined;
}

/**
 * Шапка чата: аватар, имя и `@username` или телефон собеседника; на узком экране — кнопка возврата к списку.
 *
 * Возврат заменяет запись истории: системная кнопка «назад» после него не открывает чат снова.
 */
export function ChatHeader({ chat }: IChatHeaderProps) {
  const l = useI18nSelector(({ l }) => ({ backButton: l.chat.backButton }));

  const navigate = useNavigate();

  const subtitle = chat === undefined ? null : formatContactHandle(chat);

  return (
    <SHeader>
      <SBackButton
        aria-label={l.backButton}
        onClick={() => navigate({ to: routerPaths.home, replace: true })}
      >
        <BackIcon />
      </SBackButton>

      {chat === undefined ? (
        <>
          <Skeleton width={`${AVATAR_SIZE}px`} height={`${AVATAR_SIZE}px`} />
          <Skeleton width="min(160px, 50%)" height="14px" />
        </>
      ) : (
        <>
          <Avatar
            chatId={chat.chatId}
            name={chat.name}
            avatarUrl={chat.avatarUrl}
            size={AVATAR_SIZE}
          />

          <SHeaderText>
            <SHeaderTitle forwardedAs="h2">{chat.name}</SHeaderTitle>
            {subtitle !== null && <B2 color="textMuted">{subtitle}</B2>}
          </SHeaderText>
        </>
      )}
    </SHeader>
  );
}
