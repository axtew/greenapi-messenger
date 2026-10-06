export enum EMessageDirection {
  INCOMING = "incoming",
  OUTGOING = "outgoing",
}

export enum EMessageStatus {
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

/**
 * Почему сообщение не отправлено; текст для пользователя выбирает интерфейс.
 *
 * Значения совпадают с именами членов: это ключи словаря `sendErrors`.
 */
export enum ESendFailReason {
  /** Ответ 466: исчерпан лимит тарифа инстанса. */
  QUOTA = "QUOTA",
  /** Ответа от GREEN-API не было: сбой сети. */
  NETWORK = "NETWORK",
  GENERIC = "GENERIC",
  /** Сервер принял сообщение, но Telegram отказал в доставке: антиспам ограничил отправку с этого аккаунта. */
  PEER_FLOOD = "PEER_FLOOD",
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
  /** Причина неудачной отправки; `null` — сообщение не помечено недоставленным или причина неизвестна. */
  failReason: ESendFailReason | null;
  /** id сообщения, которое эта запись правит или удаляет. */
  replacesId: string | null;
  /**
   * id удалённого сообщения у записи удаления; у остальных записей — `null`.
   *
   * Отличается от `replacesId`, когда удалено отредактированное сообщение: тогда `replacesId` указывает на запись правки,
   * а это поле — на исходное сообщение.
   */
  deletedMessageId: string | null;
  /** Запись удаления: в ленте и в превью списка — заглушка «Сообщение удалено». */
  isDeleted: boolean;
}
