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

/** Результат поиска Telegram-аккаунта по номеру телефона. */
export type TCheckAccountResult =
  | { exists: false }
  | { exists: true; chatId: string; phone: string | null; username: string | null };
