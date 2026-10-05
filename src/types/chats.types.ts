import type { EMessageDirection } from "@/types/messages.types";

/** Собеседник в личном чате. */
export interface IContact {
  chatId: string;
  name: string;
  /** Цифры номера без `+`; `null` — номер скрыт. */
  phone: string | null;
  /** Без ведущего `@`. */
  username: string | null;
  avatarUrl: string | null;
}

/** Снимок последнего сообщения чата для превью в списке. */
export interface IChatLastMessage {
  /** `null` — неподдерживаемый тип сообщения. */
  text: string | null;
  /** Unix-время в секундах, как в API. */
  timestamp: number;
  direction: EMessageDirection;
}

/** Чат в списке: собеседник, последнее сообщение и локальный счётчик непрочитанных. */
export interface IChat extends IContact {
  lastMessage: IChatLastMessage | null;
  unreadCount: number;
  /**
   * Профиль собеседника получен с сервера.
   *
   * `false` — имя и аватар временные (запрос профиля не удался или чат создан без него); такой профиль
   * запрашивается снова при следующей синхронизации списка.
   */
  isProfileLoaded: boolean;
}

/** Результат поиска Telegram-аккаунта по номеру телефона. */
export type TCheckAccountResult =
  | { exists: false }
  | { exists: true; chatId: string; phone: string | null; username: string | null };
