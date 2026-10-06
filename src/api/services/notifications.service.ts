import type { z } from "zod";

import { EGreenApiMethod, EHttpMethod, GreenApiError, greenApiRequest } from "@/api/greenApi";
import { EStatusMessage, ETypeMessage } from "@/api/schemas/messages.schema";
import {
  deleteNotificationSchema,
  EOutgoingStatusDescription,
  ETypeWebhook,
  messageWebhookSchema,
  notificationBodySchema,
  receiveNotificationSchema,
} from "@/api/schemas/notifications.schema";
import { EMessageDirection, EMessageStatus, ESendFailReason } from "@/types/messages.types";
import {
  ENotificationKind,
  type IReceivedNotification,
  type TNotification,
} from "@/types/notifications.types";

import { isPersonalChatId, toNullable } from "./_helpers";

/** Статус, которым GREEN-API (nginx) отвечает на `receiveNotification`, если очередь осталась пустой: тело пустое. */
const EMPTY_QUEUE_TIMEOUT_STATUS = 408;

/** Текст сообщения или правки; `null` — нетекстовое сообщение или удаление. */
function getMessageText({ messageData }: z.infer<typeof messageWebhookSchema>): string | null {
  switch (messageData.typeMessage) {
    case ETypeMessage.TEXT_MESSAGE:
      return messageData.textMessageData?.textMessage ?? null;
    case ETypeMessage.EXTENDED_TEXT_MESSAGE:
      return messageData.extendedTextMessageData?.text ?? null;
    case ETypeMessage.EDITED_MESSAGE:
      return messageData.editedMessageData?.textMessage ?? null;
    default:
      return null;
  }
}

function toMessageNotification(body: z.infer<typeof messageWebhookSchema>): TNotification {
  const { chatId, chatName, senderName } = body.senderData;
  const { editedMessageData, deletedMessageData } = body.messageData;
  const deletedMessageId = deletedMessageData?.stanzaId ?? null;

  return {
    kind: ENotificationKind.MESSAGE,
    message: {
      id: body.idMessage,
      chatId,
      direction:
        body.typeWebhook === ETypeWebhook.INCOMING_MESSAGE_RECEIVED
          ? EMessageDirection.INCOMING
          : EMessageDirection.OUTGOING,
      text: getMessageText(body),
      timestamp: body.timestamp,
      status: EMessageStatus.SENT,
      failReason: null,
      replacesId: editedMessageData?.stanzaId ?? deletedMessageId,
      deletedMessageId,
      isDeleted: body.messageData.typeMessage === ETypeMessage.DELETED_MESSAGE,
    },
    chatName: toNullable(chatName) ?? toNullable(senderName) ?? chatId,
  };
}

/**
 * Уведомление в типах проекта.
 *
 * Группы и каналы пропускаются, как и при синхронизации списка: приложение показывает только личные чаты.
 * Из статусов отправленного сообщения разбирается только недоставка; причина известна для `peer flood`.
 */
function toNotification(body: z.infer<typeof notificationBodySchema> | null): TNotification {
  if (body === null) {
    return { kind: ENotificationKind.IGNORED };
  }

  if (body.typeWebhook === ETypeWebhook.OUTGOING_MESSAGE_STATUS) {
    if (body.status !== EStatusMessage.FAILED || !isPersonalChatId(body.chatId)) {
      return { kind: ENotificationKind.IGNORED };
    }

    return {
      kind: ENotificationKind.MESSAGE_FAILED,
      chatId: body.chatId,
      messageId: body.idMessage,
      failReason:
        body.description === EOutgoingStatusDescription.PEER_FLOOD
          ? ESendFailReason.PEER_FLOOD
          : null,
    };
  }

  if (!isPersonalChatId(body.senderData.chatId)) {
    return { kind: ENotificationKind.IGNORED };
  }

  return toMessageNotification(body);
}

/**
 * Ждёт уведомление из очереди до `receiveTimeout` секунд (GREEN-API допускает 5–60); `null` — очередь пуста.
 *
 * Пустую очередь сервер сообщает телом `null` при статусе 200 или статусом 408 с пустым телом — второе тоже `null`, а не ошибка.
 * Пока уведомление не удалено `deleteNotification`, очередь отдаёт его снова.
 */
export async function receiveNotification(
  receiveTimeout: number,
  signal: AbortSignal,
): Promise<IReceivedNotification | null> {
  const response = await greenApiRequest({
    method: EGreenApiMethod.RECEIVE_NOTIFICATION,
    httpMethod: EHttpMethod.GET,
    schema: receiveNotificationSchema,
    query: { receiveTimeout },
    signal,
  }).catch((error: unknown) => {
    if (error instanceof GreenApiError && error.status === EMPTY_QUEUE_TIMEOUT_STATUS) {
      return null;
    }

    throw error;
  });

  if (response === null) {
    return null;
  }

  return { receiptId: response.receiptId, notification: toNotification(response.body) };
}

/** Удаляет обработанное уведомление из очереди. */
export async function deleteNotification(receiptId: number): Promise<void> {
  await greenApiRequest({
    method: EGreenApiMethod.DELETE_NOTIFICATION,
    httpMethod: EHttpMethod.DELETE,
    schema: deleteNotificationSchema,
    pathSuffix: `/${receiptId}`,
  });
}
