import { ZodError } from "zod";

import { getSession } from "@/api/session";
import { getEntries } from "@/utils/helpers/objectGetters";

import { EGreenApiErrorKind, type EGreenApiMethod, type IGreenApiRequestOptions } from "./_types";

const GREEN_API_HOST = "https://api.green-api.com";

/**
 * Ошибка запроса к GREEN-API: HTTP-статус не 200, сбой сети, ответ не той формы или лимит, о котором сервер сообщил в теле ответа.
 *
 * `message` — отладочная строка из кодов: `GREEN-API <method>: <kind>` и HTTP-статус через пробел, если он есть
 * (`GREEN-API getStateInstance: http 401`, `GREEN-API getChats: network`). Тексты для пользователя выбираются по `kind` и `status`,
 * а не по `message`. URL запроса в `message` не попадает, потому что в URL лежит `apiTokenInstance`.
 */
export class GreenApiError extends Error {
  readonly kind: EGreenApiErrorKind;
  /** HTTP-статус; `null` — ответа не было (сбой сети). */
  readonly status: number | null;
  readonly method: EGreenApiMethod;

  constructor(
    kind: EGreenApiErrorKind,
    method: EGreenApiMethod,
    status: number | null,
    options?: ErrorOptions,
  ) {
    super(`GREEN-API ${method}: ${kind}${status === null ? "" : ` ${status}`}`, options);
    this.name = "GreenApiError";
    this.kind = kind;
    this.status = status;
    this.method = method;
  }
}

/**
 * Выполняет запрос к GREEN-API и возвращает тело ответа, проверенное схемой.
 *
 * Без сессии запрос не отправляется: бросается `GreenApiError` со статусом 401, как при отозванном токене.
 * Прерывание через `signal` пробрасывается исходной ошибкой (`AbortError`), а не `GreenApiError`.
 */
export async function greenApiRequest<T>({
  method,
  httpMethod,
  schema,
  body,
  query,
  pathSuffix = "",
  signal,
  credentials = getSession() ?? undefined,
}: IGreenApiRequestOptions<T>): Promise<T> {
  if (credentials === undefined) {
    throw new GreenApiError(EGreenApiErrorKind.HTTP, method, 401);
  }

  const { idInstance, apiTokenInstance } = credentials;
  const search = query
    ? `?${new URLSearchParams(getEntries(query).map(([key, value]) => [key, String(value)]))}`
    : "";
  const url = `${GREEN_API_HOST}/waInstance${idInstance}/${method}/${apiTokenInstance}${pathSuffix}${search}`;

  let responseText: string;
  let status: number;

  try {
    const response = await fetch(url, {
      method: httpMethod,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    status = response.status;
    responseText = await response.text();
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    // Исходная ошибка не прикладывается как `cause`: её текст может содержать адрес запроса с токеном.
    throw new GreenApiError(EGreenApiErrorKind.NETWORK, method, null);
  }

  if (status !== 200) {
    throw new GreenApiError(EGreenApiErrorKind.HTTP, method, status);
  }

  try {
    return schema.parse(JSON.parse(responseText));
  } catch (error) {
    // `cause` — только ошибка схемы: текст `SyntaxError` из `JSON.parse` содержит фрагмент тела ответа.
    throw new GreenApiError(
      EGreenApiErrorKind.INVALID_RESPONSE,
      method,
      status,
      error instanceof ZodError ? { cause: error } : undefined,
    );
  }
}
