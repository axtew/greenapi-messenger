import {
  EGreenApiErrorKind,
  EGreenApiMethod,
  EHttpMethod,
  GreenApiError,
  greenApiRequest,
} from "@/api/greenApi";
import {
  chatsSchema,
  checkAccountSchema,
  contactInfoSchema,
  ECheckAccountFailReason,
} from "@/api/schemas/chats.schema";
import type { IContact, TCheckAccountResult } from "@/types/chats.types";
import { formatContactHandle } from "@/utils/helpers/contactFormat";

import { isPersonalChatId, toNullable, toPhone, toUsername } from "./_helpers";

/**
 * Ищет Telegram-аккаунт по номеру; `phone` — только цифры.
 *
 * Отказ сервера в теле ответа 200 (`status: false`) становится `GreenApiError`: лимит проверок номеров — `RATE_LIMITED`,
 * прочие отказы — `INVALID_RESPONSE`.
 */
export async function checkAccount(phone: string): Promise<TCheckAccountResult> {
  const result = await greenApiRequest({
    method: EGreenApiMethod.CHECK_ACCOUNT,
    httpMethod: EHttpMethod.POST,
    schema: checkAccountSchema,
    body: { phoneNumber: Number(phone) },
  });

  if ("status" in result) {
    throw new GreenApiError(
      result.data?.reason === ECheckAccountFailReason.RATE_LIMIT_EXCEEDED
        ? EGreenApiErrorKind.RATE_LIMITED
        : EGreenApiErrorKind.INVALID_RESPONSE,
      EGreenApiMethod.CHECK_ACCOUNT,
      200,
    );
  }

  if (!result.exist) {
    return { exists: false };
  }

  return {
    exists: true,
    chatId: result.chatId,
    phone: toPhone(result.phoneNumber),
    username: toUsername(result.username),
  };
}

/**
 * Профиль собеседника личного чата.
 *
 * Имя — первое непустое из: имя в Telegram, имя в телефонной книге, `@username`, `+телефон`, chatId.
 */
export async function getContact(chatId: string): Promise<IContact> {
  const { name, contactName, username, phoneNumber, avatar } = await greenApiRequest({
    method: EGreenApiMethod.GET_CONTACT_INFO,
    httpMethod: EHttpMethod.POST,
    schema: contactInfoSchema,
    body: { chatId },
  });

  const handle = { username: toUsername(username), phone: toPhone(phoneNumber) };

  return {
    chatId,
    name: toNullable(name) ?? toNullable(contactName) ?? formatContactHandle(handle) ?? chatId,
    ...handle,
    avatarUrl: toNullable(avatar),
  };
}

/** chatId личных чатов аккаунта в порядке ответа сервера; группы и каналы (отрицательные id) отброшены. */
export async function getChatIds(): Promise<string[]> {
  const chats = await greenApiRequest({
    method: EGreenApiMethod.GET_CHATS,
    httpMethod: EHttpMethod.GET,
    schema: chatsSchema,
  });

  return chats.map(({ chatId }) => chatId).filter(isPersonalChatId);
}
