import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useEffect } from "react";

import { enrichChat } from "@/api/mutations/chats.mutations";
import { applyNotification, startPoller } from "@/api/poller";
import { ESignOutReason, getSession, signOut } from "@/api/session";
import { useLatest } from "@/hooks/useLatest.hook";

/**
 * Состояние каркаса мессенджера и получение уведомлений, пока каркас на экране.
 *
 * Открытый чат читается обработчиком уведомлений через ref: смена чата не перезапускает цикл получения.
 */
export function useMessengerLayout() {
  const queryClient = useQueryClient();
  const { chatId } = useParams({ strict: false });

  const activeChatIdRef = useLatest(chatId ?? null);

  const idInstance = getSession()?.idInstance;

  useEffect(() => {
    if (idInstance === undefined) {
      return;
    }

    return startPoller({
      idInstance,
      onNotification: (notification) =>
        applyNotification(notification, {
          queryClient,
          idInstance,
          activeChatId: activeChatIdRef.current,
          enrichChat: (newChatId) => void enrichChat(queryClient, idInstance, newChatId),
        }),
      onUnauthorized: () => signOut(ESignOutReason.EXPIRED),
    });
  }, [queryClient, idInstance, activeChatIdRef]);

  return { isChatOpen: chatId !== undefined };
}
