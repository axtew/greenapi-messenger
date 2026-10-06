import type { IContact } from "@/types/chats.types";

/**
 * Как показать собеседника или аккаунт без имени: `@username`, иначе `+телефон`; `null`, если нет ни того, ни другого.
 *
 * Поля хранятся без префиксов (`username` без `@`, `phone` — только цифры), префиксы добавляются здесь.
 */
export function formatContactHandle({
  username,
  phone,
}: Pick<IContact, "username" | "phone">): string | null {
  if (username !== null) {
    return `@${username}`;
  }

  return phone === null ? null : `+${phone}`;
}
