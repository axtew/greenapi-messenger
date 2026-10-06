import { z } from "zod";

/** Направление записи истории чата. */
export enum EChatHistoryEntryType {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

/**
 * Значения `typeMessage`, которые проверяет код; остальные типы (стикер, фото…) схема пропускает как строку.
 *
 * Правка и удаление бывают таким типом только в уведомлениях: в истории это отдельные записи со ссылкой на исходное сообщение.
 */
export enum ETypeMessage {
  TEXT_MESSAGE = "textMessage",
  EXTENDED_TEXT_MESSAGE = "extendedTextMessage",
  EDITED_MESSAGE = "editedMessage",
  DELETED_MESSAGE = "deletedMessage",
}

/** Значения `statusMessage` исходящего сообщения, которые проверяет код; остальные схема пропускает как строку. */
export enum EStatusMessage {
  FAILED = "failed",
}

/**
 * Записи истории чата, от новых к старым.
 *
 * Правка и удаление приходят отдельными записями со ссылкой на исходное сообщение в `editedMessageId` /
 * `deletedMessageId` (пустая строка — ссылки нет). `statusMessage` есть только у исходящих.
 */
export const chatHistorySchema = z.array(
  z.object({
    type: z.enum(EChatHistoryEntryType),
    idMessage: z.string(),
    timestamp: z.number(),
    typeMessage: z.string(),
    textMessage: z.string().optional(),
    extendedTextMessage: z.object({ text: z.string().optional() }).optional(),
    statusMessage: z.string().optional(),
    isDeleted: z.boolean().optional(),
    editedMessageId: z.string().optional(),
    deletedMessageId: z.string().optional(),
  }),
);

export const sendMessageSchema = z.object({
  idMessage: z.string(),
});
