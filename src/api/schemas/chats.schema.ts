import { z } from "zod";

/** Значения `data.reason` в отказе `checkAccount` (`status: false`), которые различает код. */
export enum ECheckAccountFailReason {
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
}

/**
 * Ответ `checkAccount` со статусом 200.
 *
 * `exist: false` — аккаунта нет или номер скрыт настройками приватности; `chatId` тогда пустой, остальные поля не используются.
 * `status: false` — проверка не выполнена: `data.reason` `rate_limit_exceeded` — превышен лимит проверок номеров,
 * `reason` на верхнем уровне — например, инстанс не готов.
 */
export const checkAccountSchema = z.union([
  z.object({ exist: z.literal(false) }),
  z.object({
    exist: z.literal(true),
    chatId: z.string(),
    username: z.string().optional(),
    phoneNumber: z.number().optional(),
  }),
  z.object({
    status: z.literal(false),
    data: z.object({ reason: z.string().optional() }).optional(),
  }),
]);

/** `phoneNumber: 0` — номер скрыт; пустые строки означают отсутствие значения. */
export const contactInfoSchema = z.object({
  name: z.string().optional(),
  contactName: z.string().optional(),
  username: z.string().optional(),
  phoneNumber: z.number().optional(),
  avatar: z.string().optional(),
});

/**
 * Из записей `getChats` берётся только `chatId`: поле `type` реальный инстанс присылал не всегда, а личный чат и так
 * отличается от группы знаком `chatId`.
 */
export const chatsSchema = z.array(z.object({ chatId: z.string() }));
