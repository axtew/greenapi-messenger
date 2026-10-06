import type { ESendFailReason, IMessage } from "@/types/messages.types";

/** Что сообщило уведомление из очереди GREEN-API. */
export enum ENotificationKind {
  /** Новое сообщение в личном чате, его правка или удаление. */
  MESSAGE = "message",
  /** Отправленное сообщение не доставлено. */
  MESSAGE_FAILED = "messageFailed",
  /** Уведомление, на которое приложение не реагирует; из очереди удаляется так же. */
  IGNORED = "ignored",
}

export type TNotification =
  | {
      kind: ENotificationKind.MESSAGE;
      message: IMessage;
      /** Имя чата из уведомления — временное имя, если такого чата ещё нет в списке. */
      chatName: string;
    }
  | {
      kind: ENotificationKind.MESSAGE_FAILED;
      chatId: string;
      messageId: string;
      /** `null` — причина неизвестна. */
      failReason: ESendFailReason | null;
    }
  | { kind: ENotificationKind.IGNORED };

/** Уведомление, полученное из очереди; `receiptId` нужен, чтобы удалить его оттуда. */
export interface IReceivedNotification {
  receiptId: number;
  notification: TNotification;
}
