import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { createMemoryStorage } from "@/__tests__/_memoryStorage";
import {
  EGreenApiErrorKind,
  EGreenApiMethod,
  EHttpMethod,
  GreenApiError,
  greenApiRequest,
} from "@/api/greenApi";
import { stateInstanceSchema } from "@/api/schemas/account.schema";
import {
  checkInstanceAuthorized,
  getAccount,
  getInstanceSettings,
} from "@/api/services/account.service";
import { checkAccount, getChatIds, getContact } from "@/api/services/chats.service";
import { getChatHistory, sendMessage } from "@/api/services/messages.service";
import { ESignOutReason, getSession, saveSession, signOut } from "@/api/session";
import { EMessageDirection, EMessageStatus } from "@/types/messages.types";

const SESSION = { idInstance: "4100000001", apiTokenInstance: "secret-token-abc" };
const SESSION_KEY = "greenapi-messenger:session";

const fetchMock = vi.fn<typeof fetch>();
const assignMock = vi.fn<(url: string) => void>();

function respondWith(body: string, status = 200) {
  fetchMock.mockResolvedValueOnce(new Response(body, { status }));
}

function respondJson(body: unknown, status = 200) {
  respondWith(JSON.stringify(body), status);
}

function lastRequest(): { url: string; init: RequestInit | undefined } {
  const [input, init] = fetchMock.mock.lastCall ?? [];

  return { url: String(input), init };
}

async function catchError(promise: Promise<unknown>): Promise<GreenApiError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );

  if (!(error instanceof GreenApiError)) {
    throw new Error("Ожидалась GreenApiError");
  }

  return error;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("localStorage", createMemoryStorage());
  vi.stubGlobal("window", { location: { assign: assignMock } });
  saveSession(SESSION);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  assignMock.mockReset();
});

describe("session", () => {
  it("возвращает сохранённую сессию", () => {
    expect(getSession()).toEqual(SESSION);
  });

  it("битый JSON → null", () => {
    localStorage.setItem(SESSION_KEY, "{not json");

    expect(getSession()).toBeNull();
  });

  it("JSON не той формы → null", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ idInstance: 1 }));

    expect(getSession()).toBeNull();
  });

  it("signOut чистит сессию и уходит на вход с причиной", () => {
    signOut(ESignOutReason.EXPIRED);

    expect(getSession()).toBeNull();
    expect(assignMock).toHaveBeenCalledWith("/login?reason=expired");
  });

  it("signOut без причины уходит на чистый /login", () => {
    signOut();

    expect(assignMock).toHaveBeenCalledWith("/login");
  });
});

describe("greenApiRequest", () => {
  it("собирает URL из сессии, query и pathSuffix", async () => {
    respondJson({ stateInstance: "authorized" });

    await greenApiRequest({
      method: EGreenApiMethod.GET_STATE_INSTANCE,
      httpMethod: EHttpMethod.GET,
      schema: stateInstanceSchema,
      query: { receiveTimeout: 20 },
      pathSuffix: "/7",
    });

    const { url, init } = lastRequest();

    expect(url).toBe(
      "https://api.green-api.com/waInstance4100000001/getStateInstance/secret-token-abc/7?receiveTimeout=20",
    );
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
  });

  it("явные credentials важнее сессии", async () => {
    localStorage.removeItem(SESSION_KEY);
    respondJson({ stateInstance: "authorized" });

    await checkInstanceAuthorized({ idInstance: "1101", apiTokenInstance: "other" });

    expect(lastRequest().url).toBe(
      "https://api.green-api.com/waInstance1101/getStateInstance/other",
    );
  });

  it("без сессии — 401 без запроса", async () => {
    localStorage.removeItem(SESSION_KEY);

    const error = await catchError(getAccount());

    expect(error.kind).toBe(EGreenApiErrorKind.HTTP);
    expect(error.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("401 → GreenApiError http/401", async () => {
    respondWith("", 401);

    const error = await catchError(getAccount());

    expect(error.kind).toBe(EGreenApiErrorKind.HTTP);
    expect(error.status).toBe(401);
    expect(error.method).toBe(EGreenApiMethod.GET_ACCOUNT_SETTINGS);
  });

  it("сбой fetch → network со статусом null", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError(`Failed to fetch ${SESSION.apiTokenInstance}`));

    const error = await catchError(getAccount());

    expect(error.kind).toBe(EGreenApiErrorKind.NETWORK);
    expect(error.status).toBeNull();
    expect(error.cause).toBeUndefined();
  });

  it("прерывание пробрасывается как есть", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("aborted", "AbortError");

    controller.abort();
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(
      greenApiRequest({
        method: EGreenApiMethod.GET_STATE_INSTANCE,
        httpMethod: EHttpMethod.GET,
        schema: stateInstanceSchema,
        signal: controller.signal,
      }),
    ).rejects.toBe(abortError);
  });

  it("ответ не той формы → invalidResponse", async () => {
    respondJson({ unexpected: true });

    const error = await catchError(getInstanceSettings());

    expect(error.kind).toBe(EGreenApiErrorKind.INVALID_RESPONSE);
    expect(error.method).toBe(EGreenApiMethod.GET_SETTINGS);
  });

  it("не-JSON при 200 → invalidResponse без cause", async () => {
    respondWith("<html>");

    const error = await catchError(getChatIds());

    expect(error.kind).toBe(EGreenApiErrorKind.INVALID_RESPONSE);
    expect(error.cause).toBeUndefined();
  });

  it("ответ не той формы → cause — ошибка схемы", async () => {
    respondJson({ unexpected: true });

    const error = await catchError(getChatIds());

    expect(error.cause).toBeInstanceOf(ZodError);
  });

  it("message — коды метода, вида и статуса; токен в него не попадает", async () => {
    respondWith("", 401);
    fetchMock.mockRejectedValueOnce(new TypeError(SESSION.apiTokenInstance));
    respondJson({ unexpected: true });
    respondJson({ status: false, data: { status: "fail", reason: "rate_limit_exceeded" } });

    const errors = [
      await catchError(getChatIds()),
      await catchError(getChatIds()),
      await catchError(getChatIds()),
      await catchError(checkAccount("79881234567")),
    ];

    expect(errors.map((error) => error.kind)).toEqual([
      EGreenApiErrorKind.HTTP,
      EGreenApiErrorKind.NETWORK,
      EGreenApiErrorKind.INVALID_RESPONSE,
      EGreenApiErrorKind.RATE_LIMITED,
    ]);
    expect(errors[0]?.message).toBe("GREEN-API getChats: http 401");
    expect(errors[1]?.message).toBe("GREEN-API getChats: network");

    for (const error of errors) {
      expect(error.message).not.toContain(SESSION.apiTokenInstance);
    }
  });
});

describe("account.service", () => {
  it("checkInstanceAuthorized — только authorized", async () => {
    respondJson({ stateInstance: "authorized" });
    respondJson({ stateInstance: "notAuthorized" });

    expect(await checkInstanceAuthorized(SESSION)).toBe(true);
    expect(await checkInstanceAuthorized(SESSION)).toBe(false);
  });

  it("getInstanceSettings переводит incomingWebhook в boolean", async () => {
    respondJson({ wid: "", webhookUrl: "https://hook", incomingWebhook: "no" });

    expect(await getInstanceSettings()).toEqual({
      webhookUrl: "https://hook",
      isIncomingEnabled: false,
    });
  });

  it("getAccount: пустые строки → null, @ отрезается", async () => {
    respondJson({ phone: "79876543210", username: "@vasilisa", avatar: "" });

    expect(await getAccount()).toEqual({
      phone: "79876543210",
      username: "vasilisa",
      avatarUrl: null,
    });
  });
});

describe("chats.service", () => {
  it("checkAccount отправляет номер числом", async () => {
    respondJson({ exist: true, chatId: "334346886", username: "@user", phoneNumber: 79881234567 });

    expect(await checkAccount("79881234567")).toEqual({
      exists: true,
      chatId: "334346886",
      phone: "79881234567",
      username: "user",
    });

    const { url, init } = lastRequest();

    expect(url).toBe(
      "https://api.green-api.com/waInstance4100000001/checkAccount/secret-token-abc",
    );
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(init?.body).toBe(JSON.stringify({ phoneNumber: 79881234567 }));
  });

  it("checkAccount: exist false", async () => {
    respondJson({ exist: false, chatId: "" });

    expect(await checkAccount("79881234567")).toEqual({ exists: false });
  });

  it("checkAccount: rate_limit_exceeded в ответе 200 → rateLimited", async () => {
    respondJson({
      status: false,
      data: { status: "fail", reason: "rate_limit_exceeded", retryAfter: 7200 },
    });

    const error = await catchError(checkAccount("79881234567"));

    expect(error.kind).toBe(EGreenApiErrorKind.RATE_LIMITED);
    expect(error.status).toBe(200);
    expect(error.method).toBe(EGreenApiMethod.CHECK_ACCOUNT);
  });

  it("checkAccount: другой status false → invalidResponse", async () => {
    respondJson({ status: false, reason: "instance is starting or not authorized" });

    const error = await catchError(checkAccount("79881234567"));

    expect(error.kind).toBe(EGreenApiErrorKind.INVALID_RESPONSE);
    expect(error.status).toBe(200);
  });

  it("checkAccount: HTTP 469 → http/469", async () => {
    respondJson({ status: false, reason: "Rate limited by messenger" }, 469);

    const error = await catchError(checkAccount("79881234567"));

    expect(error.kind).toBe(EGreenApiErrorKind.HTTP);
    expect(error.status).toBe(469);
  });

  it("getChatIds отбрасывает группы и каналы, порядок сохраняется", async () => {
    respondJson([
      { chatId: "334346886", name: "", phoneNumber: 79881234567, username: "" },
      { chatId: "-10000000000000", name: "Группа", type: "supergroup" },
      { chatId: "10000000" },
    ]);

    expect(await getChatIds()).toEqual(["334346886", "10000000"]);
  });

  it.each([
    [{ name: "Василиса", contactName: "Василиса П.", username: "@v", phoneNumber: 7 }, "Василиса"],
    [{ name: "", contactName: "Василиса П.", username: "@v", phoneNumber: 7 }, "Василиса П."],
    [{ name: "", contactName: "", username: "@v", phoneNumber: 7 }, "@v"],
    [{ name: "", contactName: "", username: "", phoneNumber: 79876543210 }, "+79876543210"],
    [{ name: "", contactName: "", username: "", phoneNumber: 0 }, "100000000"],
  ])("getContact собирает имя по цепочке: %o → %s", async (response, expectedName) => {
    respondJson({ chatId: "100000000", avatar: "", ...response });

    expect((await getContact("100000000")).name).toBe(expectedName);
  });

  it("getContact: phone 0 → null, поля профиля", async () => {
    respondJson({
      chatId: "100000000",
      name: "Василиса",
      contactName: "",
      username: "",
      phoneNumber: 0,
      avatar: "https://4100.api.green-api.com/download/avatar/1.jpg",
    });

    expect(await getContact("100000000")).toEqual({
      chatId: "100000000",
      name: "Василиса",
      phone: null,
      username: null,
      avatarUrl: "https://4100.api.green-api.com/download/avatar/1.jpg",
    });
    expect(lastRequest().init?.body).toBe(JSON.stringify({ chatId: "100000000" }));
  });
});

describe("messages.service", () => {
  const base = { chatId: "10000000", chatType: "user", isForwarded: false, forwardingScore: 0 };

  it("getChatHistory маппит записи и упорядочивает по возрастанию времени", async () => {
    respondJson([
      {
        ...base,
        type: "incoming",
        idMessage: "del",
        timestamp: 400,
        typeMessage: "textMessage",
        textMessage: "старый текст",
        isDeleted: true,
        deletedMessageId: "orig",
        editedMessageId: "",
      },
      {
        ...base,
        type: "outgoing",
        idMessage: "edit",
        timestamp: 300,
        typeMessage: "textMessage",
        textMessage: "исправлено",
        statusMessage: "read",
        editedMessageId: "orig",
        deletedMessageId: "",
        isDeleted: false,
      },
      {
        ...base,
        type: "outgoing",
        idMessage: "fail",
        timestamp: 200,
        typeMessage: "textMessage",
        textMessage: "не дошло",
        statusMessage: "failed",
      },
      {
        ...base,
        type: "incoming",
        idMessage: "sticker",
        timestamp: 100,
        typeMessage: "stickerMessage",
      },
      {
        ...base,
        type: "incoming",
        idMessage: "ext",
        timestamp: 100,
        typeMessage: "extendedTextMessage",
        extendedTextMessage: { text: "https://green-api.com" },
      },
    ]);

    const messages = await getChatHistory("10000000", 100);

    expect(messages.map((message) => message.id)).toEqual([
      "ext",
      "sticker",
      "fail",
      "edit",
      "del",
    ]);
    expect(messages[0]).toEqual({
      id: "ext",
      chatId: "10000000",
      direction: EMessageDirection.INCOMING,
      text: "https://green-api.com",
      timestamp: 100,
      status: EMessageStatus.SENT,
      failReason: null,
      replacesId: null,
      isDeleted: false,
    });
    expect(messages[1].text).toBeNull();
    expect(messages[2]).toMatchObject({
      direction: EMessageDirection.OUTGOING,
      status: EMessageStatus.FAILED,
    });
    expect(messages[3]).toMatchObject({ text: "исправлено", replacesId: "orig", isDeleted: false });
    expect(messages[4]).toMatchObject({ replacesId: "orig", isDeleted: true });
    expect(lastRequest().init?.body).toBe(JSON.stringify({ chatId: "10000000", count: 100 }));
  });

  it("sendMessage возвращает idMessage", async () => {
    respondJson({ idMessage: "1769676078000" });

    expect(await sendMessage("10000000", "привет")).toBe("1769676078000");
    expect(lastRequest().init?.body).toBe(
      JSON.stringify({ chatId: "10000000", message: "привет" }),
    );
  });
});
