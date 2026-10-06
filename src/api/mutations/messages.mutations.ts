import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyLastMessage, updateChats } from "@/api/cache/chats.cache";
import { mergeMessages, updateMessages } from "@/api/cache/messages.cache";
import { EGreenApiErrorKind, GreenApiError } from "@/api/greenApi";
import { sendMessage } from "@/api/services/messages.service";
import { getSession } from "@/api/session";
import {
  EMessageDirection,
  EMessageStatus,
  ESendFailReason,
  type IMessage,
} from "@/types/messages.types";

/** Статус ответа GREEN-API, когда исчерпан лимит тарифа инстанса. */
const QUOTA_EXCEEDED_STATUS = 466;

/** Сообщение, которое показывается в ленте сразу, до ответа сервера; `id` — временный `local-<uuid>`. */
export function createLocalMessage(chatId: string, text: string, now: number): IMessage {
  return {
    id: `local-${crypto.randomUUID()}`,
    chatId,
    direction: EMessageDirection.OUTGOING,
    text,
    timestamp: Math.floor(now / 1000),
    status: EMessageStatus.SENDING,
    failReason: null,
    replacesId: null,
    isDeleted: false,
  };
}

/**
 * Помечает локальное сообщение принятым сервером: `id` становится `idMessage`, статус — отправлено.
 *
 * Если запись с этим `idMessage` уже есть в ленте (эхо отправки из очереди уведомлений), остаётся она,
 * а локальная убирается — дубля нет.
 */
export function confirmLocalMessage(
  messages: IMessage[],
  localId: string,
  idMessage: string,
): IMessage[] {
  if (messages.some(({ id }) => id === idMessage)) {
    return messages.filter(({ id }) => id !== localId);
  }

  return messages.map((message) =>
    message.id === localId ? { ...message, id: idMessage, status: EMessageStatus.SENT } : message,
  );
}

/** Помечает локальное сообщение недоставленным с причиной. */
export function failLocalMessage(
  messages: IMessage[],
  localId: string,
  failReason: ESendFailReason,
): IMessage[] {
  return messages.map((message) =>
    message.id === localId ? { ...message, status: EMessageStatus.FAILED, failReason } : message,
  );
}

/** Причина неудачной отправки по ошибке запроса. */
export function getSendFailReason(error: Error): ESendFailReason {
  if (error instanceof GreenApiError) {
    if (error.kind === EGreenApiErrorKind.NETWORK) {
      return ESendFailReason.NETWORK;
    }

    if (error.kind === EGreenApiErrorKind.HTTP && error.status === QUOTA_EXCEEDED_STATUS) {
      return ESendFailReason.QUOTA;
    }
  }

  return ESendFailReason.GENERIC;
}

/**
 * Отправка текста в чат: сообщение сразу появляется в ленте и в превью списка, после ответа получает `idMessage`,
 * при ошибке помечается недоставленным с причиной. Повторной отправки нет.
 *
 * Отправки одного чата выполняются по очереди (`scope`), чтобы сообщения уходили в том порядке, в каком их написали;
 * в ленту каждое попадает сразу. `networkMode: "always"` — без сети запрос не ставится на паузу до её появления,
 * а сразу завершается ошибкой, и сообщение помечается недоставленным.
 */
export function useSendMessageMutation(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => sendMessage(chatId, text),
    scope: { id: `sendMessage:${chatId}` },
    networkMode: "always",
    onMutate: (text) => {
      const message = createLocalMessage(chatId, text, Date.now());
      const session = getSession();

      updateMessages(queryClient, chatId, (messages) => mergeMessages(messages, [message]));

      if (session !== null) {
        updateChats(queryClient, session.idInstance, (chats) =>
          applyLastMessage(
            chats,
            chatId,
            {
              text,
              timestamp: message.timestamp,
              direction: EMessageDirection.OUTGOING,
              isDeleted: false,
            },
            { incrementUnread: false },
          ),
        );
      }

      return { localId: message.id };
    },
    onSuccess: (idMessage, _text, context) => {
      updateMessages(queryClient, chatId, (messages) =>
        confirmLocalMessage(messages, context.localId, idMessage),
      );
    },
    onError: (error, _text, context) => {
      if (context !== undefined) {
        updateMessages(queryClient, chatId, (messages) =>
          failLocalMessage(messages, context.localId, getSendFailReason(error)),
        );
      }
    },
  });
}
