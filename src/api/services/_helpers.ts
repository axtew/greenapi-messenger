/** Пустая строка или отсутствующее поле ответа → `null`. */
export function toNullable(value: string | undefined): string | null {
  return value ? value : null;
}

/** Имя пользователя Telegram без ведущего `@`; пустое → `null`. */
export function toUsername(value: string | undefined): string | null {
  return toNullable(value?.replace(/^@/, ""));
}

/** Чат с одним собеседником; у групп и каналов chatId отрицательный. */
export function isPersonalChatId(chatId: string): boolean {
  return Number(chatId) > 0;
}

/** Номер телефона строкой цифр; `0`, пустая строка и отсутствие поля (номер скрыт) → `null`. */
export function toPhone(value: number | string | undefined): string | null {
  return value ? String(value) : null;
}
