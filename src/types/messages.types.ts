export enum EMessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

export enum EMessageStatus {
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

export interface IMessage {
  /** `idMessage` из GREEN-API; у сообщения, ещё не принятого сервером, — `local-<uuid>`. */
  id: string;
  chatId: string;
  direction: EMessageDirection;
  /** `null` — неподдерживаемый тип сообщения (стикер, фото…) или запись удаления. */
  text: string | null;
  /** Unix-время в секундах, как в API. */
  timestamp: number;
  status: EMessageStatus;
  failReason: string | null;
  /** id сообщения, которое эта запись правит или удаляет. */
  replacesId: string | null;
  /** Запись удаления: в ленте и в превью списка — заглушка «Сообщение удалено». */
  isDeleted: boolean;
}
