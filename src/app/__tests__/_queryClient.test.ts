import { describe, expect, it } from "vitest";

import { EGreenApiErrorKind, EGreenApiMethod, GreenApiError } from "@/api/greenApi";

import { queryClient } from "../_queryClient";

const method = EGreenApiMethod.GET_CHAT_HISTORY;

/** Правило повтора запросов из настроек кэша по умолчанию. */
function getRetry() {
  const retry = queryClient.getDefaultOptions().queries?.retry;

  if (typeof retry !== "function") {
    throw new Error("retry по умолчанию — не функция");
  }

  return retry;
}

describe("queryClient: повтор запросов", () => {
  it.each([
    { name: "сбой сети", error: new GreenApiError(EGreenApiErrorKind.NETWORK, method, null) },
    { name: "ответ 500", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 500) },
    { name: "ответ 503", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 503) },
    { name: "ответ 429", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 429) },
    { name: "ошибка не от GREEN-API", error: new Error("boom") },
  ])("$name — повторяется", ({ error }) => {
    expect(getRetry()(0, error)).toBe(true);
  });

  it.each([
    { name: "ответ 400", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 400) },
    { name: "ответ 401", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 401) },
    { name: "ответ 403", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 403) },
    { name: "ответ 466", error: new GreenApiError(EGreenApiErrorKind.HTTP, method, 466) },
    {
      name: "тело неожиданной формы при 200",
      error: new GreenApiError(EGreenApiErrorKind.INVALID_RESPONSE, method, 200),
    },
  ])("$name — не повторяется", ({ error }) => {
    expect(getRetry()(0, error)).toBe(false);
  });

  it("не больше двух повторов", () => {
    const error = new GreenApiError(EGreenApiErrorKind.HTTP, method, 429);

    expect(getRetry()(1, error)).toBe(true);
    expect(getRetry()(2, error)).toBe(false);
  });
});
