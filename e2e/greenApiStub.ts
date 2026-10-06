import type { Page, Request, Route } from "@playwright/test";

// Мимо barrel и алиаса `@/`: barrel потянул бы в Node клиент и сессию, а в `_types.ts` из `@/` только `import type`, он стирается.
import { EGreenApiMethod } from "../src/api/greenApi/_types";

/** Учётные данные, которые стаб считает верными; к реальному инстансу отношения не имеют. */
export const STUB_CREDENTIALS = {
  idInstance: "1100000001",
  apiTokenInstance: "e2e-valid-token",
};

/** Собеседник, которого стаб находит по номеру. */
export const STUB_CONTACT = {
  phone: "79991234567",
  chatId: "500000001",
  name: "Иван Петров",
  username: "ivan_e2e",
};

const GREEN_API_ORIGIN = "https://api.green-api.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Запись `getChatHistory` в том виде, в каком её отдаёт GREEN-API. */
interface IHistoryEntry {
  type: "incoming" | "outgoing";
  idMessage: string;
  timestamp: number;
  typeMessage: "textMessage";
  chatId: string;
  textMessage: string;
  statusMessage?: string;
}

/** Уведомление `incomingMessageReceived` в том виде, в каком его отдаёт `receiveNotification`. */
interface IIncomingMessageNotification {
  receiptId: number;
  body: {
    typeWebhook: "incomingMessageReceived";
    instanceData: { idInstance: number; wid: string; typeInstance: string };
    timestamp: number;
    idMessage: string;
    senderData: {
      chatId: string;
      chatType: string;
      sender: string;
      chatName: string;
      senderName: string;
      senderType: string;
      senderContactName: string;
      senderPhoneNumber: number;
    };
    messageData: {
      typeMessage: "textMessage";
      textMessageData: { textMessage: string; forwardingScore: number; isForwarded: boolean };
    };
  };
}

/** Поля тел POST-запросов, которые шлют сервисы приложения в сценарии; у каждого метода — своё подмножество. */
interface IRequestBody {
  chatId?: string;
  count?: number;
  phoneNumber?: number;
  message?: string;
}

interface IGreenApiStub {
  /** Кладёт в очередь уведомлений входящее текстовое сообщение от собеседника. */
  pushIncoming: (chatId: string, text: string) => void;
  /** Запросы, на которые у стаба нет ответа (неизвестный метод, чужой хост); тест ожидает пустой список. */
  unexpectedRequests: string[];
}

/** Секунды Unix, как в `timestamp` GREEN-API. */
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Тело POST-запроса приложения; у GET и DELETE его нет. */
function readBody(request: Request): IRequestBody {
  const body: unknown = request.postDataJSON();

  // Тело шлёт само приложение, его форма известна по сервисам — стаб её не валидирует.
  return typeof body === "object" && body !== null ? (body as IRequestBody) : {};
}

function fulfillJson(route: Route, json: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
}

/**
 * Подменяет GREEN-API в браузере страницы: отвечает из состояния в памяти на методы, которые вызывает сценарий входа, нового чата,
 * отправки и получения сообщений.
 *
 * Запрос к любому другому внешнему адресу и неизвестный метод GREEN-API обрываются и попадают в `unexpectedRequests` —
 * так ни один запрос не уходит в сеть. Верными считаются только `STUB_CREDENTIALS`, иначе — 401, как у реального сервера.
 * Пустая очередь уведомлений отвечает `null` сразу, без ожидания `receiveTimeout`.
 */
export async function installGreenApiStub(page: Page, appOrigin: string): Promise<IGreenApiStub> {
  const unexpectedRequests: string[] = [];
  const chatIds: string[] = [];
  const histories = new Map<string, IHistoryEntry[]>();
  const queue: IIncomingMessageNotification[] = [];
  let lastReceiptId = 0;
  let lastMessageId = 0;

  const nextMessageId = () => `E2E${String(++lastMessageId).padStart(8, "0")}`;

  const addToHistory = (entry: IHistoryEntry) => {
    histories.set(entry.chatId, [entry, ...(histories.get(entry.chatId) ?? [])]);

    if (!chatIds.includes(entry.chatId)) {
      chatIds.push(entry.chatId);
    }
  };

  const respond = (route: Route, method: string, httpMethod: string, pathSuffix: string[]) => {
    const body = readBody(route.request());

    switch (`${httpMethod} ${method}`) {
      case `GET ${EGreenApiMethod.GET_STATE_INSTANCE}`:
        return fulfillJson(route, { stateInstance: "authorized" });

      case `GET ${EGreenApiMethod.GET_SETTINGS}`:
        return fulfillJson(route, {
          wid: `${STUB_CREDENTIALS.idInstance}@c.us`,
          typeInstance: "telegram",
          webhookUrl: "",
          incomingWebhook: "yes",
          outgoingWebhook: "yes",
          outgoingMessageWebhook: "yes",
          outgoingAPIMessageWebhook: "yes",
        });

      case `GET ${EGreenApiMethod.GET_ACCOUNT_SETTINGS}`:
        return fulfillJson(route, { phone: "79990000000", username: "@e2e_owner", avatar: "" });

      case `GET ${EGreenApiMethod.GET_CHATS}`:
        return fulfillJson(
          route,
          chatIds.map((chatId) => ({ chatId, name: "", phoneNumber: 0, username: "" })),
        );

      case `POST ${EGreenApiMethod.CHECK_ACCOUNT}`:
        return fulfillJson(
          route,
          body.phoneNumber === Number(STUB_CONTACT.phone)
            ? {
                exist: true,
                chatId: STUB_CONTACT.chatId,
                username: `@${STUB_CONTACT.username}`,
                phoneNumber: Number(STUB_CONTACT.phone),
                fromCache: false,
              }
            : { exist: false },
        );

      case `POST ${EGreenApiMethod.GET_CONTACT_INFO}`:
        return fulfillJson(route, {
          avatar: "",
          name: body.chatId === STUB_CONTACT.chatId ? STUB_CONTACT.name : "",
          contactName: "",
          chatId: body.chatId ?? "",
          chatType: "user",
          phoneNumber: body.chatId === STUB_CONTACT.chatId ? Number(STUB_CONTACT.phone) : 0,
          username: body.chatId === STUB_CONTACT.chatId ? `@${STUB_CONTACT.username}` : "",
        });

      case `POST ${EGreenApiMethod.GET_CHAT_HISTORY}`:
        return fulfillJson(route, (histories.get(body.chatId ?? "") ?? []).slice(0, body.count));

      case `POST ${EGreenApiMethod.SEND_MESSAGE}`: {
        const idMessage = nextMessageId();
        addToHistory({
          type: "outgoing",
          idMessage,
          timestamp: nowSeconds(),
          typeMessage: "textMessage",
          chatId: body.chatId ?? "",
          textMessage: body.message ?? "",
          statusMessage: "sent",
        });

        return fulfillJson(route, { idMessage });
      }

      case `GET ${EGreenApiMethod.RECEIVE_NOTIFICATION}`:
        return fulfillJson(route, queue[0] ?? null);

      case `DELETE ${EGreenApiMethod.DELETE_NOTIFICATION}`: {
        const index = queue.findIndex(({ receiptId }) => String(receiptId) === pathSuffix[0]);

        if (index !== -1) {
          queue.splice(index, 1);
        }

        return fulfillJson(route, { result: index !== -1, reason: "" });
      }

      default:
        unexpectedRequests.push(`${httpMethod} ${method}`);

        return route.abort();
    }
  };

  // Маршрут, зарегистрированный позже, проверяется первым: сначала — запрет любых внешних адресов, поверх него — GREEN-API.
  await page.route(
    (url) => url.origin !== appOrigin,
    (route) => {
      unexpectedRequests.push(
        `${route.request().method()} ${new URL(route.request().url()).origin}`,
      );

      return route.abort();
    },
  );

  await page.route(`${GREEN_API_ORIGIN}/**`, (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }

    // Путь: /waInstance<idInstance>/<метод>/<токен>[/<продолжение>]
    const [, instanceSegment, method, token, ...pathSuffix] = new URL(request.url()).pathname.split(
      "/",
    );

    if (
      instanceSegment !== `waInstance${STUB_CREDENTIALS.idInstance}` ||
      token !== STUB_CREDENTIALS.apiTokenInstance
    ) {
      return route.fulfill({ status: 401, headers: CORS_HEADERS, body: "" });
    }

    return respond(route, method, request.method(), pathSuffix);
  });

  return {
    unexpectedRequests,
    pushIncoming: (chatId, text) => {
      const idMessage = nextMessageId();
      const timestamp = nowSeconds();

      addToHistory({
        type: "incoming",
        idMessage,
        timestamp,
        typeMessage: "textMessage",
        chatId,
        textMessage: text,
      });

      queue.push({
        receiptId: ++lastReceiptId,
        body: {
          typeWebhook: "incomingMessageReceived",
          instanceData: {
            idInstance: Number(STUB_CREDENTIALS.idInstance),
            wid: `${STUB_CREDENTIALS.idInstance}@c.us`,
            typeInstance: "telegram",
          },
          timestamp,
          idMessage,
          senderData: {
            chatId,
            chatType: "user",
            sender: chatId,
            chatName: STUB_CONTACT.name,
            senderName: STUB_CONTACT.name,
            senderType: "user",
            senderContactName: "",
            senderPhoneNumber: Number(STUB_CONTACT.phone),
          },
          messageData: {
            typeMessage: "textMessage",
            textMessageData: { textMessage: text, forwardingScore: 0, isForwarded: false },
          },
        },
      });
    },
  };
}
