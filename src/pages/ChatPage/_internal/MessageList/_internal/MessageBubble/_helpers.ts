import type { I18n } from "@/types/i18n.types";
import type { ESendFailReason } from "@/types/messages.types";

import { ETextPartKind, type ITextPart } from "./_types";

/**
 * Адрес `http(s)://` до пробела; первый символ после схемы — не знак препинания.
 *
 * Других схем нет намеренно: `javascript:`, `data:` и т. п. остаются текстом.
 */
const LINK_REGEX = /https?:\/\/[^\s.,!?)]\S*/gi;

/** Знаки препинания в конце адреса, которые относятся к предложению, а не к ссылке. */
const TRAILING_PUNCTUATION_REGEX = /[.,!?)]+$/;

/** Делит текст сообщения на обычный текст и ссылки `http(s)://`; конечная пунктуация `.,!?)` остаётся текстом. */
export function splitTextWithLinks(text: string): ITextPart[] {
  const parts: ITextPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK_REGEX)) {
    const link = match[0].replace(TRAILING_PUNCTUATION_REGEX, "");

    if (match.index > cursor) {
      parts.push({ kind: ETextPartKind.TEXT, value: text.slice(cursor, match.index) });
    }

    parts.push({ kind: ETextPartKind.LINK, value: link });
    cursor = match.index + link.length;
  }

  if (cursor < text.length) {
    parts.push({ kind: ETextPartKind.TEXT, value: text.slice(cursor) });
  }

  return parts;
}

/** Подпись недоставленного сообщения: «Не доставлено» и причина, если она известна. */
export function getFailedLabel(
  failReason: ESendFailReason | null,
  l: { failedLabel: string; sendErrors: I18n["sendErrors"] },
): string {
  if (failReason === null) {
    return l.failedLabel;
  }

  return `${l.failedLabel}: ${l.sendErrors[failReason]}`;
}
