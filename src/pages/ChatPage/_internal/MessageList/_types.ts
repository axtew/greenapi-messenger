import type { IMessage } from "@/types/messages.types";

export enum EListItemKind {
  DATE = "date",
  MESSAGE = "message",
}

/** Элемент ленты: разделитель дня или сообщение. */
export type TListItem =
  | { kind: EListItemKind.DATE; key: string; label: string }
  | {
      kind: EListItemKind.MESSAGE;
      message: IMessage;
      /** Следующее сообщение — от другого отправителя или другого дня (либо его нет). */
      isLastInGroup: boolean;
    };

export interface IMessageListProps {
  chatId: string;
}
