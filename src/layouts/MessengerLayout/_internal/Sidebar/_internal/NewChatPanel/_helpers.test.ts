import { describe, expect, it } from "vitest";

import { EGreenApiErrorKind, EGreenApiMethod, GreenApiError } from "@/api/greenApi";
import { ChatNotFoundError } from "@/api/mutations/chats.mutations";
import type { I18n } from "@/types/i18n.types";

import { getSubmitErrorText, normalizePhone, validatePhone } from "./_helpers";

const l: I18n["newChat"] = {
  title: "title",
  backButton: "backButton",
  phoneLabel: "phoneLabel",
  phonePlaceholder: "phonePlaceholder",
  submitButton: "submitButton",
  phoneError: "phoneError",
  notFoundError: "notFoundError",
  rateLimitError: "rateLimitError",
  searchRestrictedError: "searchRestrictedError",
  genericError: "genericError",
};

describe("normalizePhone", () => {
  it("оставляет только цифры", () => {
    expect(normalizePhone("+7 (999) 123-45-67")).toBe("79991234567");
  });
});

describe("validatePhone", () => {
  it.each(["+7 999 123-45-67", "1234567890", "123456789012345"])("%s — подходит", (value) => {
    expect(validatePhone(value, l)).toBeNull();
  });

  it.each(["123", "", "+7 999 123", "1234567890123456"])("%s — ошибка", (value) => {
    expect(validatePhone(value, l)).toBe("phoneError");
  });
});

describe("getSubmitErrorText", () => {
  const method = EGreenApiMethod.CHECK_ACCOUNT;

  it.each([
    { error: new ChatNotFoundError(), text: "notFoundError" },
    {
      error: new GreenApiError(EGreenApiErrorKind.RATE_LIMITED, method, 200),
      text: "rateLimitError",
    },
    {
      error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 469),
      text: "searchRestrictedError",
    },
    { error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 500), text: "genericError" },
    {
      error: new GreenApiError(EGreenApiErrorKind.INVALID_RESPONSE, method, 200),
      text: "genericError",
    },
    { error: new GreenApiError(EGreenApiErrorKind.NETWORK, method, null), text: "genericError" },
    { error: new Error("boom"), text: "genericError" },
  ])("$error.message → $text", ({ error, text }) => {
    expect(getSubmitErrorText(error, l)).toBe(text);
  });
});
