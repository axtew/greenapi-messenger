import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryStorage } from "@/__tests__/_memoryStorage";
import { getChatsQueryKey, readStoredChats } from "@/api/cache/chats.cache";
import { getChatIds, getContact } from "@/api/services/chats.service";
import { getChatHistory } from "@/api/services/messages.service";
import type { IChat, IContact } from "@/types/chats.types";
import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

import { getChatsQueryOptions } from "../chats.queries";

vi.mock("@/api/services/chats.service", () => ({
  getChatIds: vi.fn(),
  getContact: vi.fn(),
}));

vi.mock("@/api/services/messages.service", () => ({
  getChatHistory: vi.fn(),
}));

const getChatIdsMock = vi.mocked(getChatIds);
const getContactMock = vi.mocked(getContact);
const getChatHistoryMock = vi.mocked(getChatHistory);

const ID_INSTANCE = "4100000001";
const STORAGE_KEY = `greenapi-messenger:chats:${ID_INSTANCE}`;

function makeContact(chatId: string): IContact {
  return { chatId, name: `Имя ${chatId}`, phone: null, username: null, avatarUrl: null };
}

function makeChat(chatId: string, overrides: Partial<IChat> = {}): IChat {
  return {
    ...makeContact(chatId),
    lastMessage: null,
    unreadCount: 0,
    isProfileLoaded: true,
    ...overrides,
  };
}

function makeMessage(
  chatId: string,
  timestamp: number,
  overrides: Partial<IMessage> = {},
): IMessage {
  return {
    id: `id-${chatId}-${timestamp}`,
    chatId,
    direction: EMessageDirection.INCOMING,
    text: `текст ${chatId}`,
    timestamp,
    status: EMessageStatus.SENT,
    failReason: null,
    replacesId: null,
    deletedMessageId: null,
    isDeleted: false,
    ...overrides,
  };
}

function storeChats(chats: IChat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

let queryClient: QueryClient;

/** Подписывает наблюдателя на запрос списка чатов, как это делает смонтированный `useChatsQuery`. */
function subscribe() {
  const observer = new QueryObserver(queryClient, getChatsQueryOptions(ID_INSTANCE));
  const unsubscribe = observer.subscribe(() => {});

  return { observer, unsubscribe };
}

async function waitForSync({ observer }: ReturnType<typeof subscribe>) {
  await vi.waitFor(() => expect(observer.getCurrentResult().fetchStatus).toBe("idle"));
}

/** Монтирует и снимает одного наблюдателя; возвращает его результат после синхронизации. */
async function runSync() {
  const subscription = subscribe();
  await waitForSync(subscription);
  subscription.unsubscribe();

  return subscription.observer.getCurrentResult();
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  getChatHistoryMock.mockResolvedValue([]);
  getContactMock.mockImplementation((chatId) => Promise.resolve(makeContact(chatId)));
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("getChatsQueryOptions — когда идёт синхронизация", () => {
  it("список из localStorage виден сразу, а синхронизация запускается при первом наблюдателе", async () => {
    storeChats([makeChat("1")]);
    getChatIdsMock.mockResolvedValue(["1"]);

    const subscription = subscribe();
    const initial = subscription.observer.getCurrentResult();

    expect(initial.data).toEqual([makeChat("1")]);
    expect(initial.fetchStatus).toBe("fetching");

    await waitForSync(subscription);
    subscription.unsubscribe();

    expect(getChatIdsMock).toHaveBeenCalledTimes(1);
  });

  it("синхронизация запускается и при пустом хранилище", async () => {
    getChatIdsMock.mockResolvedValue(["1"]);

    const result = await runSync();

    expect(getChatIdsMock).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([makeChat("1")]);
  });

  it("второй наблюдатель после синхронизации её не повторяет", async () => {
    getChatIdsMock.mockResolvedValue(["1"]);

    const first = subscribe();
    await waitForSync(first);

    const second = subscribe();

    expect(second.observer.getCurrentResult().fetchStatus).toBe("idle");

    first.unsubscribe();
    second.unsubscribe();

    expect(getChatIdsMock).toHaveBeenCalledTimes(1);
  });
});

describe("синхронизация списка чатов", () => {
  it("запрашивает профиль только у новых чатов и чатов с временным профилем", async () => {
    storeChats([makeChat("1"), makeChat("2", { name: "2", isProfileLoaded: false })]);
    getChatIdsMock.mockResolvedValue(["1", "2", "3"]);

    await runSync();

    expect(getContactMock.mock.calls.map(([chatId]) => chatId)).toEqual(["2", "3"]);
    expect(readStoredChats(ID_INSTANCE).every(({ isProfileLoaded }) => isProfileLoaded)).toBe(true);
  });

  it("сбой профиля — чат с chatId вместо имени и признаком временного профиля", async () => {
    getChatIdsMock.mockResolvedValue(["1"]);
    getContactMock.mockRejectedValue(new Error("quota"));

    const result = await runSync();

    expect(result.data).toEqual([makeChat("1", { name: "1", isProfileLoaded: false })]);
  });

  it("сбой профиля у известного чата с временным профилем оставляет его имя, phone и username", async () => {
    const known = makeChat("1", {
      name: "@ivan",
      phone: "79001234567",
      username: "ivan",
      isProfileLoaded: false,
    });
    storeChats([known]);
    getChatIdsMock.mockResolvedValue(["1"]);
    getContactMock.mockRejectedValue(new Error("quota"));

    const result = await runSync();

    expect(getContactMock).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([known]);
    expect(readStoredChats(ID_INSTANCE)).toEqual([known]);
  });

  it("берёт первые 10 чатов и последнюю запись истории, включая удаление; сбой истории синхронизацию не прерывает", async () => {
    const chatIds = Array.from({ length: 12 }, (_, index) => String(index + 1));
    getChatIdsMock.mockResolvedValue(chatIds);
    getChatHistoryMock.mockImplementation((chatId) => {
      if (chatId === "1") {
        return Promise.resolve([makeMessage(chatId, 100)]);
      }

      if (chatId === "2") {
        return Promise.resolve([
          makeMessage(chatId, 200, { text: null, replacesId: "orig", isDeleted: true }),
        ]);
      }

      return Promise.reject(new Error("network"));
    });

    const result = await runSync();

    const chats = result.data ?? [];

    expect(chats).toHaveLength(10);
    expect(getChatHistoryMock.mock.calls.every(([, count]) => count === 1)).toBe(true);
    expect(chats.slice(0, 2).map(({ chatId }) => chatId)).toEqual(["2", "1"]);
    expect(chats.find(({ chatId }) => chatId === "1")).toMatchObject({
      lastMessage: {
        text: "текст 1",
        timestamp: 100,
        direction: EMessageDirection.INCOMING,
        isDeleted: false,
      },
    });
    expect(chats.find(({ chatId }) => chatId === "2")?.lastMessage).toEqual({
      text: null,
      timestamp: 200,
      direction: EMessageDirection.INCOMING,
      isDeleted: true,
    });
  });

  it("сливает результат с кэшем на момент окончания и сохраняет локальные чаты", async () => {
    storeChats([
      makeChat("local", {
        lastMessage: {
          text: "x",
          timestamp: 50,
          direction: EMessageDirection.OUTGOING,
          isDeleted: false,
        },
      }),
    ]);
    getChatIdsMock.mockResolvedValue(["1"]);
    getChatHistoryMock.mockImplementation((chatId) => {
      // Пока идёт синхронизация, другой источник успевает записать в список свой чат с непрочитанным.
      queryClient.setQueryData(getChatsQueryKey(ID_INSTANCE), (chats: IChat[] = []) => [
        ...chats,
        makeChat("incoming", { unreadCount: 1 }),
      ]);

      return Promise.resolve([makeMessage(chatId, 100)]);
    });

    const result = await runSync();

    expect(result.data?.map(({ chatId }) => chatId)).toEqual(["1", "local", "incoming"]);
    expect(readStoredChats(ID_INSTANCE)).toEqual(result.data);
  });

  it("ошибка списка чатов оставляет сохранённый список", async () => {
    storeChats([makeChat("1")]);
    getChatIdsMock.mockRejectedValue(new Error("network"));

    const result = await runSync();

    expect(result).toMatchObject({ isError: true, data: [makeChat("1")] });
  });
});
