import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryStorage } from "@/api/__tests__/_memoryStorage";
import { getChatsQueryKey, readStoredChats } from "@/api/cache/chats.cache";
import { checkAccount, getContact } from "@/api/services/chats.service";
import type { IChat, IContact } from "@/types/chats.types";

import { ChatNotFoundError, createChat } from "./chats.mutations";

vi.mock("@/api/services/chats.service", () => ({
  checkAccount: vi.fn(),
  getContact: vi.fn(),
}));

const checkAccountMock = vi.mocked(checkAccount);
const getContactMock = vi.mocked(getContact);

const ID_INSTANCE = "4100000001";
const PHONE = "79001234567";
const CHAT_ID = "334346886";

const contact: IContact = {
  chatId: CHAT_ID,
  name: "Иван Петров",
  phone: PHONE,
  username: "ivan",
  avatarUrl: "https://example.com/a.jpg",
};

let queryClient: QueryClient;

function getChats(): IChat[] | undefined {
  return queryClient.getQueryData<IChat[]>(getChatsQueryKey(ID_INSTANCE));
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
  queryClient = new QueryClient();
  queryClient.setQueryData<IChat[]>(getChatsQueryKey(ID_INSTANCE), []);
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("createChat", () => {
  it("аккаунт не найден — ChatNotFoundError, список не меняется", async () => {
    checkAccountMock.mockResolvedValue({ exists: false });

    await expect(createChat(queryClient, ID_INSTANCE, PHONE)).rejects.toBeInstanceOf(
      ChatNotFoundError,
    );
    expect(getContactMock).not.toHaveBeenCalled();
    expect(getChats()).toEqual([]);
  });

  it("чат уже в списке — его chatId без запроса профиля и без дубля", async () => {
    const existing: IChat = {
      ...contact,
      lastMessage: null,
      unreadCount: 2,
      isProfileLoaded: true,
    };
    queryClient.setQueryData<IChat[]>(getChatsQueryKey(ID_INSTANCE), [existing]);
    checkAccountMock.mockResolvedValue({
      exists: true,
      chatId: CHAT_ID,
      phone: PHONE,
      username: "ivan",
    });

    await expect(createChat(queryClient, ID_INSTANCE, PHONE)).resolves.toBe(CHAT_ID);
    expect(getContactMock).not.toHaveBeenCalled();
    expect(getChats()).toEqual([existing]);
  });

  it("новый чат — профиль из getContact, загруженный, в кэше и в localStorage", async () => {
    checkAccountMock.mockResolvedValue({
      exists: true,
      chatId: CHAT_ID,
      phone: PHONE,
      username: "ivan",
    });
    getContactMock.mockResolvedValue(contact);

    await expect(createChat(queryClient, ID_INSTANCE, PHONE)).resolves.toBe(CHAT_ID);

    const expected: IChat = {
      ...contact,
      lastMessage: null,
      unreadCount: 0,
      isProfileLoaded: true,
    };
    expect(getChats()).toEqual([expected]);
    expect(readStoredChats(ID_INSTANCE)).toEqual([expected]);
  });

  it.each([
    { username: "ivan", phone: PHONE, name: "@ivan" },
    { username: null, phone: PHONE, name: `+${PHONE}` },
    { username: null, phone: null, name: CHAT_ID },
  ])(
    "сбой getContact — контакт из checkAccount с именем $name и временным профилем",
    async ({ username, phone, name }) => {
      checkAccountMock.mockResolvedValue({ exists: true, chatId: CHAT_ID, phone, username });
      getContactMock.mockRejectedValue(new Error("quota"));

      await expect(createChat(queryClient, ID_INSTANCE, PHONE)).resolves.toBe(CHAT_ID);
      expect(getChats()).toEqual([
        {
          chatId: CHAT_ID,
          name,
          phone,
          username,
          avatarUrl: null,
          lastMessage: null,
          unreadCount: 0,
          isProfileLoaded: false,
        },
      ]);
    },
  );

  it("ошибка checkAccount пробрасывается как есть", async () => {
    const error = new Error("network");
    checkAccountMock.mockRejectedValue(error);

    await expect(createChat(queryClient, ID_INSTANCE, PHONE)).rejects.toBe(error);
  });
});
