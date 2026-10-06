import type { z } from "zod";

import { EGreenApiMethod, EHttpMethod, greenApiRequest } from "@/api/greenApi";
import {
  chatHistorySchema,
  EChatHistoryEntryType,
  EStatusMessage,
  ETypeMessage,
  sendMessageSchema,
} from "@/api/schemas/messages.schema";
import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

/**
 * Текст записи истории; `null` — нетекстовое сообщение или запись удаления.
 *
 * Запись удаления несёт текст удалённого сообщения — он отбрасывается здесь, чтобы не попасть ни в ленту, ни в превью списка.
 */
function getHistoryText(entry: z.infer<typeof chatHistorySchema>[number]): string | null {
  if (entry.isDeleted === true) {
    return null;
  }

  switch (entry.typeMessage) {
    case ETypeMessage.TEXT_MESSAGE:
      return entry.textMessage ?? null;
    case ETypeMessage.EXTENDED_TEXT_MESSAGE:
      return entry.textMessage ?? entry.extendedTextMessage?.text ?? null;
    default:
      return null;
  }
}

/** Последние `count` сообщений чата по возрастанию времени, включая записи правок и удалений (у записи удаления текста нет). */
export async function getChatHistory(chatId: string, count: number): Promise<IMessage[]> {
  const entries = await greenApiRequest({
    method: EGreenApiMethod.GET_CHAT_HISTORY,
    httpMethod: EHttpMethod.POST,
    schema: chatHistorySchema,
    body: { chatId, count },
  });

  // API отдаёт историю от новых к старым; разворот до сортировки сохраняет порядок поступления
  // у сообщений с одинаковым временем (сортировка стабильная).
  return entries
    .toReversed()
    .map((entry): IMessage => ({
      id: entry.idMessage,
      chatId,
      direction:
        entry.type === EChatHistoryEntryType.INCOMING
          ? EMessageDirection.INCOMING
          : EMessageDirection.OUTGOING,
      text: getHistoryText(entry),
      timestamp: entry.timestamp,
      status:
        entry.statusMessage === EStatusMessage.FAILED ? EMessageStatus.FAILED : EMessageStatus.SENT,
      failReason: null,
      replacesId: entry.editedMessageId || entry.deletedMessageId || null,
      deletedMessageId: entry.deletedMessageId || null,
      isDeleted: entry.isDeleted ?? false,
    }))
    .toSorted((a, b) => a.timestamp - b.timestamp);
}

/**
 * Отправляет текст в чат и возвращает `idMessage`.
 *
 * Успешный ответ не означает доставку: неудача приходит позже уведомлением о статусе сообщения.
 */
export async function sendMessage(chatId: string, text: string): Promise<string> {
  const { idMessage } = await greenApiRequest({
    method: EGreenApiMethod.SEND_MESSAGE,
    httpMethod: EHttpMethod.POST,
    schema: sendMessageSchema,
    body: { chatId, message: text },
  });

  return idMessage;
}
