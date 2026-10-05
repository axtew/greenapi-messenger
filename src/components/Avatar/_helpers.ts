/** Первая буква каждого слова: буква или цифра в начале строки или после символа, который не буква и не цифра. */
const WORD_START_REGEX = /(?<![\p{L}\p{N}])[\p{L}\p{N}]/gu;

/**
 * Инициалы для аватара: первые буквы первых двух слов в верхнем регистре (`"Иван Петров"` → `"ИП"`).
 *
 * Без `\b`: в JavaScript он считает буквами только латиницу и у кириллических слов начала не находит.
 */
export function getInitials(name: string): string {
  return (name.match(WORD_START_REGEX) ?? []).slice(0, 2).join("").toUpperCase();
}

/** Цвет фона аватара из палитры: один и тот же для одного chatId. */
export function getAvatarColor<TColor extends string>(
  chatId: string,
  colors: readonly TColor[],
): TColor {
  let hash = 0;

  for (const char of chatId) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 1_000_000_007;
  }

  return colors[hash % colors.length];
}
