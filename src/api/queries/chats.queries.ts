import { type QueryClient, queryOptions, useQuery } from "@tanstack/react-query";

import {
  applyLastMessage,
  getChatsQueryKey,
  readStoredChats,
  updateChats,
  upsertContact,
} from "@/api/cache/chats.cache";
import { getChatIds, getContact } from "@/api/services/chats.service";
import { getChatHistory } from "@/api/services/messages.service";
import { getSession } from "@/api/session";
import type { IChat, IChatLastMessage, IContact } from "@/types/chats.types";

/** Сколько первых чатов из `getChats` синхронизируется при входе. */
const CHATS_SYNC_LIMIT = 10;

/** Как долго синхронизированный список считается свежим: повторная синхронизация — не чаще. */
const CHATS_SYNC_INTERVAL_MS = 5 * 60 * 60 * 1000;

/** Профиль собеседника; `null`, если запрос не удался. */
async function fetchContact(chatId: string): Promise<IContact | null> {
  try {
    return await getContact(chatId);
  } catch {
    return null;
  }
}

/** Снимок последнего сообщения чата; `null`, если сообщений нет, последнее удалено или запрос не удался. */
async function fetchLastMessage(chatId: string): Promise<IChatLastMessage | null> {
  try {
    const [message] = await getChatHistory(chatId, 1);

    if (message === undefined || message.isDeleted) {
      return null;
    }

    return { text: message.text, timestamp: message.timestamp, direction: message.direction };
  } catch {
    return null;
  }
}

/**
 * Синхронизирует список чатов с сервером и возвращает обновлённый список.
 *
 * Запросы идут последовательно — у GREEN-API лимиты частоты. Профиль запрашивается только для новых чатов и чатов
 * с временным профилем: квота `getContactInfo` на тарифе мала. Сбой профиля или истории одного чата синхронизацию не прерывает:
 * чат, который уже есть в списке, остаётся с тем, что у него есть, а новый добавляется с chatId вместо имени.
 * Результат сливается с кэшем на момент окончания, а не на старте: список могли изменить, пока шли запросы.
 */
async function syncChats(queryClient: QueryClient, idInstance: string): Promise<IChat[]> {
  const chatIds = (await getChatIds()).slice(0, CHATS_SYNC_LIMIT);
  const knownChats = queryClient.getQueryData<IChat[]>(getChatsQueryKey(idInstance)) ?? [];

  const contacts: { chatId: string; contact: IContact | null }[] = [];

  for (const chatId of chatIds) {
    const known = knownChats.find((chat) => chat.chatId === chatId);

    if (known === undefined || !known.isProfileLoaded) {
      contacts.push({ chatId, contact: await fetchContact(chatId) });
    }
  }

  const lastMessages: { chatId: string; lastMessage: IChatLastMessage }[] = [];

  for (const chatId of chatIds) {
    const lastMessage = await fetchLastMessage(chatId);

    if (lastMessage !== null) {
      lastMessages.push({ chatId, lastMessage });
    }
  }

  return updateChats(queryClient, idInstance, (chats) => {
    const withContacts = contacts.reduce((acc, { chatId, contact }) => {
      if (contact !== null) {
        return upsertContact(acc, contact, { isProfileLoaded: true });
      }

      // Проверка — по списку на момент слияния: чат мог появиться, пока шли запросы.
      if (acc.some((chat) => chat.chatId === chatId)) {
        return acc;
      }

      const stub: IContact = { chatId, name: chatId, phone: null, username: null, avatarUrl: null };

      return upsertContact(acc, stub, { isProfileLoaded: false });
    }, chats);

    return lastMessages.reduce(
      (acc, { chatId, lastMessage }) =>
        applyLastMessage(acc, chatId, lastMessage, { incrementUnread: false }),
      withContacts,
    );
  });
}

/**
 * Опции запроса списка чатов.
 *
 * Список из localStorage виден сразу, но считается устаревшим (`initialDataUpdatedAt: 0`), поэтому первый наблюдатель
 * запускает синхронизацию. После неё список свеж `CHATS_SYNC_INTERVAL_MS`: новые наблюдатели и восстановление сети
 * синхронизацию в это время не повторяют.
 */
export function getChatsQueryOptions(idInstance: string) {
  return queryOptions({
    queryKey: getChatsQueryKey(idInstance),
    queryFn: ({ client }) => syncChats(client, idInstance),
    initialData: () => readStoredChats(idInstance),
    initialDataUpdatedAt: 0,
    staleTime: CHATS_SYNC_INTERVAL_MS,
  });
}

/** Список чатов текущего инстанса, отсортированный по последнему сообщению. */
export function useChatsQuery() {
  const session = getSession();

  if (session === null) {
    throw new Error("useChatsQuery вызван без сессии");
  }

  return useQuery(getChatsQueryOptions(session.idInstance));
}
