import type { ZodType } from "zod";

import type { ISession } from "@/types/account.types";

/** Причина `GreenApiError`. */
export enum EGreenApiErrorKind {
  /** HTTP-статус ответа не 200 или нет сессии (статус 401). */
  HTTP = "http",
  /** Ответа не было: сбой сети. */
  NETWORK = "network",
  /** Тело ответа не JSON, не прошло схему или содержит отказ сервера. */
  INVALID_RESPONSE = "invalidResponse",
  /** Сервер сообщил о превышении лимита в теле ответа 200. */
  RATE_LIMITED = "rateLimited",
}

/** Методы GREEN-API, которые вызывает приложение; значение — имя метода в URL запроса. */
export enum EGreenApiMethod {
  GET_STATE_INSTANCE = "getStateInstance",
  GET_SETTINGS = "getSettings",
  GET_ACCOUNT_SETTINGS = "getAccountSettings",
  CHECK_ACCOUNT = "checkAccount",
  GET_CONTACT_INFO = "getContactInfo",
  GET_CHATS = "getChats",
  GET_CHAT_HISTORY = "getChatHistory",
  SEND_MESSAGE = "sendMessage",
}

export enum EHttpMethod {
  GET = "GET",
  POST = "POST",
}

export interface IGreenApiRequestOptions<T> {
  method: EGreenApiMethod;
  httpMethod: EHttpMethod;
  /** Схема тела успешного ответа; тело `null` (пустая очередь уведомлений) схема должна допускать сама. */
  schema: ZodType<T>;
  /** Тело POST-запроса, сериализуется в JSON. */
  body?: Record<string, string | number>;
  query?: Record<string, string | number>;
  /** Продолжение пути после токена, например `/<receiptId>`. */
  pathSuffix?: string;
  signal?: AbortSignal;
  /** Учётные данные запроса; по умолчанию — текущая сессия. */
  credentials?: ISession;
}
