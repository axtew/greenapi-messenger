import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { IChat, IChatLastMessage, IContact } from "@/types/chats.types";
import { EMessageDirection } from "@/types/messages.types";
import { getLSItem, setLSItem } from "@/utils/helpers/localStorage";

const CHATS_STORAGE_KEY_PREFIX = "greenapi-messenger:chats:";

const storedChatsSchema: z.ZodType<IChat[]> = z.array(
  z.object({
    chatId: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    username: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    lastMessage: z
      .object({
        text: z.string().nullable(),
        timestamp: z.number(),
        direction: z.enum(EMessageDirection),
      })
      .nullable(),
    unreadCount: z.number().int().nonnegative(),
    isProfileLoaded: z.boolean(),
  }),
);

function getStorageKey(idInstance: string): string {
  return CHATS_STORAGE_KEY_PREFIX + idInstance;
}

/** Ключ запроса списка чатов инстанса. */
export function getChatsQueryKey(idInstance: string) {
  return ["chats", idInstance] as const;
}

/** Список чатов инстанса из localStorage; пустой, если записи нет или она повреждена. */
export function readStoredChats(idInstance: string): IChat[] {
  return getLSItem(getStorageKey(idInstance), storedChatsSchema) ?? [];
}

/**
 * Единственная точка записи списка чатов: применяет `updater` к текущему кэшу запроса, сортирует результат
 * и сохраняет его и в кэш, и в localStorage.
 */
export function updateChats(
  queryClient: QueryClient,
  idInstance: string,
  updater: (chats: IChat[]) => IChat[],
): IChat[] {
  const current =
    queryClient.getQueryData<IChat[]>(getChatsQueryKey(idInstance)) ?? readStoredChats(idInstance);
  const next = sortChats(updater(current));

  queryClient.setQueryData(getChatsQueryKey(idInstance), next);
  setLSItem(getStorageKey(idInstance), next);

  return next;
}

/**
 * Добавляет чат с собеседником или обновляет его профиль; последнее сообщение и непрочитанные сохраняются.
 *
 * Временный профиль (`isProfileLoaded: false`) не заменяет уже загруженный — у чата остаётся настоящее имя и аватар.
 */
export function upsertContact(
  chats: IChat[],
  contact: IContact,
  { isProfileLoaded }: { isProfileLoaded: boolean },
): IChat[] {
  const existing = chats.find(({ chatId }) => chatId === contact.chatId);

  if (existing === undefined) {
    return [...chats, { ...contact, lastMessage: null, unreadCount: 0, isProfileLoaded }];
  }

  if (existing.isProfileLoaded && !isProfileLoaded) {
    return chats;
  }

  return chats.map((chat) =>
    chat === existing
      ? {
          ...contact,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount,
          isProfileLoaded,
        }
      : chat,
  );
}

/**
 * Записывает новое сообщение чата: снимок последнего сообщения меняется, только если новое не старее текущего;
 * при `incrementUnread` счётчик непрочитанных растёт на 1. Чата нет в списке — список не меняется.
 */
export function applyLastMessage(
  chats: IChat[],
  chatId: string,
  lastMessage: IChatLastMessage,
  { incrementUnread }: { incrementUnread: boolean },
): IChat[] {
  return chats.map((chat) => {
    if (chat.chatId !== chatId) {
      return chat;
    }

    const isNotOlder =
      chat.lastMessage === null || lastMessage.timestamp >= chat.lastMessage.timestamp;

    return {
      ...chat,
      lastMessage: isNotOlder ? lastMessage : chat.lastMessage,
      unreadCount: incrementUnread ? chat.unreadCount + 1 : chat.unreadCount,
    };
  });
}

/** Обнуляет счётчик непрочитанных чата. */
export function resetUnread(chats: IChat[], chatId: string): IChat[] {
  return chats.map((chat) => (chat.chatId === chatId ? { ...chat, unreadCount: 0 } : chat));
}

/** Чаты по времени последнего сообщения, новые сверху; чаты без сообщений — в конце в прежнем порядке. */
export function sortChats(chats: IChat[]): IChat[] {
  return chats.toSorted((a, b) => {
    if (a.lastMessage === null || b.lastMessage === null) {
      return Number(a.lastMessage === null) - Number(b.lastMessage === null);
    }

    return b.lastMessage.timestamp - a.lastMessage.timestamp;
  });
}
