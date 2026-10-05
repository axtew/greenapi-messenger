/** Учётные данные инстанса GREEN-API, с которыми вошёл пользователь. */
export interface ISession {
  idInstance: string;
  apiTokenInstance: string;
}

/** Подключённый к инстансу Telegram-аккаунт. */
export interface IAccount {
  /** Цифры номера без `+`. */
  phone: string | null;
  /** Без ведущего `@`. */
  username: string | null;
  avatarUrl: string | null;
}

/** Настройки инстанса, от которых зависит получение сообщений через HTTP API. */
export interface IInstanceSettings {
  webhookUrl: string;
  isIncomingEnabled: boolean;
}
