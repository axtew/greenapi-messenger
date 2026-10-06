import type { QueryClient } from "@tanstack/react-query";

import {
  applyLastMessage,
  getChatsQueryKey,
  updateChats,
  upsertContact,
} from "@/api/cache/chats.cache";
import {
  getMessagesQueryKey,
  markMessageFailed,
  mergeMessages,
  updateMessages,
} from "@/api/cache/messages.cache";
import type { IChat } from "@/types/chats.types";
import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";
import { ENotificationKind, type TNotification } from "@/types/notifications.types";

interface IApplyNotificationContext {
  queryClient: QueryClient;
  idInstance: string;
  /** Чат, открытый сейчас на экране; входящие в нём не считаются непрочитанными. */
  activeChatId: string | null;
  /** Загружает профиль собеседника чата, только что созданного из уведомления; результат не ждут. */
  enrichChat: (chatId: string) => void;
}

/**
 * Есть ли у ленты чата данные: запись до первой загрузки создала бы их сама — скелетон и ошибка загрузки истории
 * с «Повторить» пропали бы.
 */
function hasMessages(queryClient: QueryClient, chatId: string): boolean {
  return queryClient.getQueryData<IMessage[]>(getMessagesQueryKey(chatId)) !== undefined;
}

/**
 * Сообщение из уведомления — в список чатов и в ленту чата.
 *
 * Список меняется, только когда его запрос уже создан: запись в кэш до этого создала бы запрос со свежими данными,
 * и синхронизация списка при входе не запустилась бы. Неизвестный чат добавляется с временным именем из уведомления,
 * профиль догружается отдельно. Непрочитанным считается только новое входящее (не правка и не удаление) в неоткрытом чате.
 *
 * Эхо уже показанного сообщения (тот же `id`) заменяет запись в ленте, но пометку о недоставке сохраняет:
 * статус `failed` мог прийти раньше эха.
 */
function applyMessage(
  message: IMessage,
  chatName: string,
  { queryClient, idInstance, activeChatId, enrichChat }: IApplyNotificationContext,
): void {
  const { chatId } = message;
  const chats = queryClient.getQueryData<IChat[]>(getChatsQueryKey(idInstance));

  if (chats !== undefined) {
    const isNewChat = !chats.some((chat) => chat.chatId === chatId);
    const isNewIncoming =
      message.direction === EMessageDirection.INCOMING && message.replacesId === null;

    updateChats(queryClient, idInstance, (current) => {
      const withChat = isNewChat
        ? upsertContact(
            current,
            { chatId, name: chatName, phone: null, username: null, avatarUrl: null },
            { isProfileLoaded: false },
          )
        : current;

      return applyLastMessage(
        withChat,
        chatId,
        {
          text: message.text,
          timestamp: message.timestamp,
          direction: message.direction,
          isDeleted: message.isDeleted,
        },
        { incrementUnread: isNewIncoming && chatId !== activeChatId },
      );
    });

    if (isNewChat) {
      enrichChat(chatId);
    }
  }

  if (hasMessages(queryClient, chatId)) {
    updateMessages(queryClient, chatId, (messages) => {
      const known = messages.find(({ id }) => id === message.id);
      const next =
        known?.status === EMessageStatus.FAILED
          ? { ...message, status: known.status, failReason: known.failReason }
          : message;

      return mergeMessages(messages, [next]);
    });
  }
}

/** Применяет уведомление из очереди к кэшу запросов: списку чатов и ленте чата. */
export function applyNotification(
  notification: TNotification,
  context: IApplyNotificationContext,
): void {
  switch (notification.kind) {
    case ENotificationKind.MESSAGE:
      applyMessage(notification.message, notification.chatName, context);
      return;
    case ENotificationKind.MESSAGE_FAILED: {
      const { queryClient } = context;
      const { chatId, messageId, failReason } = notification;

      if (hasMessages(queryClient, chatId)) {
        updateMessages(queryClient, chatId, (messages) =>
          markMessageFailed(messages, messageId, failReason),
        );
      }
      return;
    }
    case ENotificationKind.IGNORED:
      return;
  }
}
