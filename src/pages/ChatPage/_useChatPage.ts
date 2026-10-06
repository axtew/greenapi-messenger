import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { resetUnread, updateChats } from "@/api/cache/chats.cache";
import { useChatsQuery } from "@/api/queries/chats.queries";
import { getSession } from "@/api/session";
import { routerPaths } from "@/routes/_paths";
import { EKeyboardKey } from "@/types/common.types";

/**
 * Чат из списка по `chatId` адреса и признак того, что его ещё ищут.
 *
 * Чата нет и синхронизация списка не идёт — переход на главную с заменой записи истории. Пока синхронизация идёт,
 * переход откладывается (`isChatPending`): открытый по ссылке чат может появиться в списке после неё.
 * У открытого чата обнуляется счётчик непрочитанных.
 *
 * `Escape` закрывает чат так же, как кнопка «назад». Слушатель стоит на `document`, чтобы клавиша срабатывала при любом
 * фокусе. Меню или панель, внутри которых фокус, закрываются первыми: их обработчик отменяет событие (`preventDefault`),
 * и такое `Escape` чат не закрывает. Автоповтор удерживаемой клавиши пропускается, чтобы одно нажатие не закрыло
 * сначала меню или панель, а следом и чат. Во время IME-ввода клавиша принадлежит вводу и тоже пропускается.
 */
export function useChatPage(chatId: string) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: chats, isFetching } = useChatsQuery();

  const chat = chats.find((item) => item.chatId === chatId);
  const isChatPending = chat === undefined && isFetching;
  const isMissing = chat === undefined && !isFetching;
  const hasUnread = chat !== undefined && chat.unreadCount > 0;

  useEffect(() => {
    if (isMissing) {
      navigate({ to: routerPaths.home, replace: true });
    }
  }, [isMissing, navigate]);

  useEffect(() => {
    const session = getSession();

    if (hasUnread && session !== null) {
      updateChats(queryClient, session.idInstance, (current) => resetUnread(current, chatId));
    }
  }, [hasUnread, chatId, queryClient]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === EKeyboardKey.ESCAPE &&
        !event.defaultPrevented &&
        !event.isComposing &&
        !event.repeat
      ) {
        navigate({ to: routerPaths.home, replace: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return { chat, isChatPending };
}
