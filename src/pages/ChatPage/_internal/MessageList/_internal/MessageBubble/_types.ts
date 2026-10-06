import type { IMessage } from "@/types/messages.types";

export enum ETextPartKind {
  TEXT = "text",
  LINK = "link",
}

/** Кусок текста сообщения: обычный текст или ссылка, которую можно открыть. */
export interface ITextPart {
  kind: ETextPartKind;
  value: string;
}

export interface IMessageBubbleProps {
  message: IMessage;
  /** Последнее сообщение подряд от одного отправителя в пределах дня — у пузыря есть хвостик. */
  isLastInGroup: boolean;
}
