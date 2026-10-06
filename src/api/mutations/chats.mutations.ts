import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { getChatsQueryKey, updateChats, upsertContact } from "@/api/cache/chats.cache";
import { EGreenApiErrorKind, EGreenApiMethod, GreenApiError } from "@/api/greenApi";
import { checkAccount, getContact } from "@/api/services/chats.service";
import { getSession } from "@/api/session";
import type { IChat, IContact } from "@/types/chats.types";
import { formatContactHandle } from "@/utils/helpers/contactFormat";

/**
 * По номеру не найден аккаунт Telegram (или номер скрыт настройками приватности).
 *
 * `message` — отладочный код в формате `GreenApiError`; текст для пользователя форма выбирает по типу ошибки.
 */
export class ChatNotFoundError extends Error {
  constructor() {
    super(`GREEN-API ${EGreenApiMethod.CHECK_ACCOUNT}: notFound`);
    this.name = "ChatNotFoundError";
  }
}

/**
 * Находит собеседника по номеру и добавляет чат с ним в список; возвращает chatId.
 *
 * Чат, который уже есть в списке, не меняется и профиль повторно не запрашивается. Для нового чата профиль берётся
 * из `getContact`; если он не загрузился, чат добавляется с тем, что вернул `checkAccount`, и помечается временным
 * (`isProfileLoaded: false`): синхронизация списка перезапросит профиль, если чат окажется среди синхронизируемых.
 */
export async function createChat(
  queryClient: QueryClient,
  idInstance: string,
  phone: string,
): Promise<string> {
  const account = await checkAccount(phone);

  if (!account.exists) {
    throw new ChatNotFoundError();
  }

  const { chatId, username } = account;
  const chats = queryClient.getQueryData<IChat[]>(getChatsQueryKey(idInstance)) ?? [];

  if (chats.some((chat) => chat.chatId === chatId)) {
    return chatId;
  }

  try {
    const contact = await getContact(chatId);
    updateChats(queryClient, idInstance, (current) =>
      upsertContact(current, contact, { isProfileLoaded: true }),
    );
  } catch {
    const fallback: IContact = {
      chatId,
      name: formatContactHandle(account) ?? chatId,
      phone: account.phone,
      username,
      avatarUrl: null,
    };
    updateChats(queryClient, idInstance, (current) =>
      upsertContact(current, fallback, { isProfileLoaded: false }),
    );
  }

  return chatId;
}

/** Новый чат по номеру телефона (только цифры); результат — chatId чата в списке. */
export function useCreateChatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      const session = getSession();

      // Без сессии — как у клиента GREEN-API: ответ 401, общий обработчик выводит на вход.
      if (session === null) {
        throw new GreenApiError(EGreenApiErrorKind.HTTP, EGreenApiMethod.CHECK_ACCOUNT, 401);
      }

      return createChat(queryClient, session.idInstance, phone);
    },
  });
}
