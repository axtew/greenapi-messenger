import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryStorage } from "@/api/__tests__/_memoryStorage";
import type { IChat, IContact } from "@/types/chats.types";
import { EMessageDirection } from "@/types/messages.types";

import {
  applyLastMessage,
  getChatsQueryKey,
  readStoredChats,
  resetUnread,
  sortChats,
  updateChats,
  upsertContact,
} from "./chats.cache";

const ID_INSTANCE = "4100000001";
const STORAGE_KEY = `greenapi-messenger:chats:${ID_INSTANCE}`;

function makeChat(chatId: string, overrides: Partial<IChat> = {}): IChat {
  return {
    chatId,
    name: `Chat ${chatId}`,
    phone: null,
    username: null,
    avatarUrl: null,
    lastMessage: null,
    unreadCount: 0,
    isProfileLoaded: true,
    ...overrides,
  };
}

function makeLastMessage(timestamp: number, text: string | null = "text") {
  return { text, timestamp, direction: EMessageDirection.INCOMING };
}

const CONTACT: IContact = {
  chatId: "100",
  name: "Иван Петров",
  phone: "79990000000",
  username: "ivan",
  avatarUrl: "https://example.com/a.jpg",
};

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readStoredChats", () => {
  it("нет записи → []", () => {
    expect(readStoredChats(ID_INSTANCE)).toEqual([]);
  });

  it("битый JSON → []", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    expect(readStoredChats(ID_INSTANCE)).toEqual([]);
  });

  it("чужая форма → []", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ chatId: 1 }]));

    expect(readStoredChats(ID_INSTANCE)).toEqual([]);
  });

  it("список другого инстанса не читается", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeChat("1")]));

    expect(readStoredChats("4100000002")).toEqual([]);
  });
});

describe("updateChats", () => {
  it("пишет отсортированный результат в кэш и localStorage", () => {
    const queryClient = new QueryClient();
    const older = makeChat("1", { lastMessage: makeLastMessage(100) });
    const newer = makeChat("2", { lastMessage: makeLastMessage(200) });

    const result = updateChats(queryClient, ID_INSTANCE, () => [older, newer]);

    expect(result.map(({ chatId }) => chatId)).toEqual(["2", "1"]);
    expect(queryClient.getQueryData(getChatsQueryKey(ID_INSTANCE))).toEqual(result);
    expect(readStoredChats(ID_INSTANCE)).toEqual(result);
  });

  it("берёт текущий список из кэша, а без кэша — из localStorage", () => {
    const queryClient = new QueryClient();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([makeChat("1")]));

    const updater = vi.fn((chats: IChat[]) => chats);
    updateChats(queryClient, ID_INSTANCE, updater);

    expect(updater).toHaveBeenLastCalledWith([makeChat("1")]);

    queryClient.setQueryData(getChatsQueryKey(ID_INSTANCE), [makeChat("2")]);
    updateChats(queryClient, ID_INSTANCE, updater);

    expect(updater).toHaveBeenLastCalledWith([makeChat("2")]);
  });
});

describe("upsertContact", () => {
  it("добавляет новый чат без сообщений и непрочитанных", () => {
    expect(upsertContact([], CONTACT, { isProfileLoaded: true })).toEqual([
      { ...CONTACT, lastMessage: null, unreadCount: 0, isProfileLoaded: true },
    ]);
  });

  it("обновляет имя и аватар, сохраняя последнее сообщение и непрочитанные", () => {
    const lastMessage = makeLastMessage(100);
    const chats = [
      makeChat("100", { lastMessage, unreadCount: 3, isProfileLoaded: false }),
      makeChat("200"),
    ];

    const result = upsertContact(chats, CONTACT, { isProfileLoaded: true });

    expect(result[0]).toEqual({ ...CONTACT, lastMessage, unreadCount: 3, isProfileLoaded: true });
    expect(result[1]).toBe(chats[1]);
  });

  it("временный профиль не заменяет загруженный", () => {
    const chats = [makeChat("100", { name: "Иван" })];

    const result = upsertContact(
      chats,
      { ...CONTACT, name: "100", avatarUrl: null },
      { isProfileLoaded: false },
    );

    expect(result).toBe(chats);
  });

  it("временный профиль заменяет временный", () => {
    const chats = [makeChat("100", { isProfileLoaded: false })];

    const result = upsertContact(chats, CONTACT, { isProfileLoaded: false });

    expect(result[0]).toMatchObject({ name: CONTACT.name, isProfileLoaded: false });
  });
});

describe("applyLastMessage", () => {
  it("меняет снимок на более новое сообщение", () => {
    const chats = [makeChat("1", { lastMessage: makeLastMessage(100) })];

    const [chat] = applyLastMessage(chats, "1", makeLastMessage(200, "новое"), {
      incrementUnread: false,
    });

    expect(chat.lastMessage).toEqual(makeLastMessage(200, "новое"));
  });

  it("сообщение с тем же временем — не старее, снимок меняется", () => {
    const chats = [makeChat("1", { lastMessage: makeLastMessage(100, "старое") })];

    const [chat] = applyLastMessage(chats, "1", makeLastMessage(100, "правка"), {
      incrementUnread: false,
    });

    expect(chat.lastMessage?.text).toBe("правка");
  });

  it("более старое сообщение снимок не меняет", () => {
    const lastMessage = makeLastMessage(200);
    const chats = [makeChat("1", { lastMessage })];

    const [chat] = applyLastMessage(chats, "1", makeLastMessage(100), { incrementUnread: false });

    expect(chat.lastMessage).toBe(lastMessage);
  });

  it("снимок появляется у чата без сообщений", () => {
    const [chat] = applyLastMessage([makeChat("1")], "1", makeLastMessage(100), {
      incrementUnread: false,
    });

    expect(chat.lastMessage).toEqual(makeLastMessage(100));
  });

  it("incrementUnread увеличивает счётчик на 1, без него счётчик не меняется", () => {
    const chats = [makeChat("1", { unreadCount: 2 })];

    expect(
      applyLastMessage(chats, "1", makeLastMessage(100), { incrementUnread: true })[0].unreadCount,
    ).toBe(3);
    expect(
      applyLastMessage(chats, "1", makeLastMessage(100), { incrementUnread: false })[0].unreadCount,
    ).toBe(2);
  });

  it("чата нет в списке — список не меняется", () => {
    const chats = [makeChat("1")];

    expect(applyLastMessage(chats, "2", makeLastMessage(100), { incrementUnread: true })).toEqual(
      chats,
    );
  });
});

describe("resetUnread", () => {
  it("обнуляет непрочитанные только у указанного чата", () => {
    const chats = [makeChat("1", { unreadCount: 5 }), makeChat("2", { unreadCount: 2 })];

    const result = resetUnread(chats, "1");

    expect(result.map(({ unreadCount }) => unreadCount)).toEqual([0, 2]);
  });
});

describe("sortChats", () => {
  it("новые сверху, чаты без сообщений — в конце в прежнем порядке", () => {
    const chats = [
      makeChat("empty-1"),
      makeChat("old", { lastMessage: makeLastMessage(100) }),
      makeChat("empty-2"),
      makeChat("new", { lastMessage: makeLastMessage(300) }),
      makeChat("mid", { lastMessage: makeLastMessage(200) }),
    ];

    expect(sortChats(chats).map(({ chatId }) => chatId)).toEqual([
      "new",
      "mid",
      "old",
      "empty-1",
      "empty-2",
    ]);
  });
});
