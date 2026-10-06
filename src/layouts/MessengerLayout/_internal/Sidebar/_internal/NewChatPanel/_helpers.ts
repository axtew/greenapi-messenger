import { EGreenApiErrorKind, GreenApiError } from "@/api/greenApi";
import { ChatNotFoundError } from "@/api/mutations/chats.mutations";
import type { I18n } from "@/types/i18n.types";

/** Длина номера в международном формате (E.164) — без `+`, с кодом страны. */
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

/** Цифры номера: пробелы, скобки, дефисы и `+` отбрасываются. */
export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "");
}

/** Текст ошибки поля номера; `null` — номер подходит. */
export function validatePhone(value: string, l: I18n["newChat"]): string | null {
  const { length } = normalizePhone(value);

  return length >= PHONE_MIN_DIGITS && length <= PHONE_MAX_DIGITS ? null : l.phoneError;
}

/** Текст ошибки создания чата под кнопкой. */
export function getSubmitErrorText(error: Error, l: I18n["newChat"]): string {
  if (error instanceof ChatNotFoundError) {
    return l.notFoundError;
  }

  if (error instanceof GreenApiError) {
    if (error.kind === EGreenApiErrorKind.RATE_LIMITED) {
      return l.rateLimitError;
    }

    if (error.kind === EGreenApiErrorKind.HTTP && error.status === 469) {
      return l.searchRestrictedError;
    }
  }

  return l.genericError;
}
