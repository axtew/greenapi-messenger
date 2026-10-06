import { z } from "zod";

/** Значения `typeWebhook`, которые разбирает код; уведомления остальных типов пропускаются. */
export enum ETypeWebhook {
  INCOMING_MESSAGE_RECEIVED = "incomingMessageReceived",
  /** Сообщение, отправленное с телефона. */
  OUTGOING_MESSAGE_RECEIVED = "outgoingMessageReceived",
  /** Эхо сообщения, отправленного через API: тот же `idMessage`, что вернул `sendMessage`. */
  OUTGOING_API_MESSAGE_RECEIVED = "outgoingAPIMessageReceived",
  OUTGOING_MESSAGE_STATUS = "outgoingMessageStatus",
}

/** Значения `description` в статусе `failed`, которые различает код; остальные схема пропускает как строку. */
export enum EOutgoingStatusDescription {
  PEER_FLOOD = "peer flood",
}

/**
 * Уведомление о сообщении в чате.
 *
 * У исходящих `senderData` описывает собеседника, а не отправителя. Правка и удаление приходят отдельными уведомлениями
 * со своим `idMessage` и ссылкой на исходное сообщение в `stanzaId`.
 */
export const messageWebhookSchema = z.object({
  typeWebhook: z.enum([
    ETypeWebhook.INCOMING_MESSAGE_RECEIVED,
    ETypeWebhook.OUTGOING_MESSAGE_RECEIVED,
    ETypeWebhook.OUTGOING_API_MESSAGE_RECEIVED,
  ]),
  idMessage: z.string(),
  timestamp: z.number(),
  senderData: z.object({
    chatId: z.string(),
    chatName: z.string().optional(),
    senderName: z.string().optional(),
  }),
  messageData: z.object({
    typeMessage: z.string(),
    textMessageData: z.object({ textMessage: z.string().optional() }).optional(),
    extendedTextMessageData: z.object({ text: z.string().optional() }).optional(),
    editedMessageData: z
      .object({ textMessage: z.string().optional(), stanzaId: z.string() })
      .optional(),
    deletedMessageData: z.object({ stanzaId: z.string() }).optional(),
  }),
});

/** Статус отправленного сообщения: `delivered`, `read`, `failed` с причиной в `description` и другие. */
const statusWebhookSchema = z.object({
  typeWebhook: z.literal(ETypeWebhook.OUTGOING_MESSAGE_STATUS),
  chatId: z.string(),
  idMessage: z.string(),
  status: z.string(),
  description: z.string().optional(),
});

/** Тело уведомления, которое разбирает код. */
export const notificationBodySchema = z.union([messageWebhookSchema, statusWebhookSchema]);

/**
 * Ответ `receiveNotification`: уведомление из очереди или `null`, если за время ожидания очередь осталась пустой.
 *
 * Тело неразбираемого вида (другой `typeWebhook`, не та форма) становится `null`, а не ошибкой ответа: такое уведомление
 * всё равно нужно удалить по `receiptId`, иначе очередь встанет на нём.
 */
export const receiveNotificationSchema = z
  .object({
    receiptId: z.number(),
    body: notificationBodySchema.nullable().catch(null),
  })
  .nullable();

export const deleteNotificationSchema = z.object({
  result: z.boolean(),
});
