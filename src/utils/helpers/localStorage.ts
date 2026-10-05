import type { ZodType } from "zod";

/**
 * Значение из `localStorage`, проверенное схемой; `null`, если записи нет, она повреждена или хранилище недоступно.
 *
 * Вместо прямого `localStorage.getItem` + `JSON.parse`: в приватном режиме Safari и при запрете хранилища доступ к нему бросает
 * исключение, а запись могла остаться от прежней версии приложения — без проверки схемой её форма не гарантирована.
 */
export function getLSItem<T>(key: string, schema: ZodType<T>): T | null {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return null;
    }

    const parsed = schema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Записывает значение в `localStorage` как JSON.
 *
 * Вместо прямого `localStorage.setItem`: недоступное или переполненное хранилище бросает исключение — здесь оно только логируется.
 * Значение в лог не попадает: в нём могут быть учётные данные.
 */
export function setLSItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Не удалось записать «${key}» в localStorage`, error);
  }
}

/** Удаляет запись из `localStorage`; вместо прямого `localStorage.removeItem`, который бросает при недоступном хранилище. */
export function removeLSItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Не удалось удалить «${key}» из localStorage`, error);
  }
}
