import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryStorage } from "@/__tests__/_memoryStorage";
import { getChatsQueryKey } from "@/api/cache/chats.cache";
import { getMessagesQueryKey } from "@/api/cache/messages.cache";
import type { IChat } from "@/types/chats.types";
import {
  EMessageDirection,
  EMessageStatus,
  ESendFailReason,
  type IMessage,
} from "@/types/messages.types";
import { ENotificationKind, type TNotification } from "@/types/notifications.types";

import { applyNotification } from "../_applyNotification";

const ID_INSTANCE = "4100000001";
const CHAT_ID = "10000000";
const OTHER_CHAT_ID = "20000000";

function makeMessage(id: string, timestamp: number, overrides: Partial<IMessage> = {}): IMessage {
  return {
    id,
    chatId: CHAT_ID,
    direction: EMessageDirection.INCOMING,
    text: `текст ${id}`,
    timestamp,
    status: EMessageStatus.SENT,
    failReason: null,
    replacesId: null,
    deletedMessageId: null,
    isDeleted: false,
    ...overrides,
  };
}

function makeChat(chatId: string, overrides: Partial<IChat> = {}): IChat {
  return {
    chatId,
    name: `Имя ${chatId}`,
    phone: null,
    username: null,
    avatarUrl: null,
    lastMessage: null,
    unreadCount: 0,
    isProfileLoaded: true,
    ...overrides,
  };
}

function messageNotification(message: IMessage, chatName = "Василиса"): TNotification {
  return { kind: ENotificationKind.MESSAGE, message, chatName };
}

let queryClient: QueryClient;
const enrichChat = vi.fn<(chatId: string) => void>();

function apply(notification: TNotification, activeChatId: string | null = null) {
  applyNotification(notification, {
    queryClient,
    idInstance: ID_INSTANCE,
    activeChatId,
    enrichChat,
  });
}

function getChats(): IChat[] | undefined {
  return queryClient.getQueryData(getChatsQueryKey(ID_INSTANCE));
}

function getMessages(chatId = CHAT_ID): IMessage[] | undefined {
  return queryClient.getQueryData(getMessagesQueryKey(chatId));
}

function setChats(chats: IChat[]) {
  queryClient.setQueryData(getChatsQueryKey(ID_INSTANCE), chats);
}

function setMessages(messages: IMessage[], chatId = CHAT_ID) {
  queryClient.setQueryData(getMessagesQueryKey(chatId), messages);
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMemoryStorage());
  queryClient = new QueryClient();
});

afterEach(() => {
  vi.unstubAllGlobals();
  enrichChat.mockReset();
});

describe("applyNotification — сообщение", () => {
  it("входящее в неоткрытый чат: превью и +1 к непрочитанным", () => {
    setChats([makeChat(CHAT_ID, { unreadCount: 2 })]);

    apply(messageNotification(makeMessage("m1", 100, { text: "привет" })));

    expect(getChats()?.[0]).toMatchObject({
      unreadCount: 3,
      lastMessage: {
        text: "привет",
        timestamp: 100,
        direction: EMessageDirection.INCOMING,
        isDeleted: false,
      },
    });
    expect(enrichChat).not.toHaveBeenCalled();
  });

  it("входящее в открытый чат — без +1", () => {
    setChats([makeChat(CHAT_ID)]);

    apply(messageNotification(makeMessage("m1", 100)), CHAT_ID);

    expect(getChats()?.[0].unreadCount).toBe(0);
  });

  it("исходящее — без +1, превью обновляется", () => {
    setChats([makeChat(CHAT_ID, { unreadCount: 1 })]);

    apply(
      messageNotification(makeMessage("m1", 100, { direction: EMessageDirection.OUTGOING })),
      OTHER_CHAT_ID,
    );

    expect(getChats()?.[0]).toMatchObject({
      unreadCount: 1,
      lastMessage: { direction: EMessageDirection.OUTGOING },
    });
  });

  it("правка и удаление входящего — без +1", () => {
    setChats([makeChat(CHAT_ID)]);

    apply(messageNotification(makeMessage("e1", 100, { replacesId: "m1" })));
    apply(
      messageNotification(
        makeMessage("d1", 200, {
          text: null,
          replacesId: "m1",
          deletedMessageId: "m1",
          isDeleted: true,
        }),
      ),
    );

    expect(getChats()?.[0]).toMatchObject({
      unreadCount: 0,
      lastMessage: { text: null, isDeleted: true, timestamp: 200 },
    });
  });

  it("неизвестный чат: добавляется с временным именем, профиль догружается", () => {
    setChats([makeChat(OTHER_CHAT_ID)]);

    apply(messageNotification(makeMessage("m1", 100), "Василиса"));

    expect(getChats()?.find(({ chatId }) => chatId === CHAT_ID)).toEqual({
      ...makeChat(CHAT_ID, { name: "Василиса", isProfileLoaded: false }),
      lastMessage: {
        text: "текст m1",
        timestamp: 100,
        direction: EMessageDirection.INCOMING,
        isDeleted: false,
      },
      unreadCount: 1,
    });
    expect(enrichChat).toHaveBeenCalledExactlyOnceWith(CHAT_ID);
  });

  it("известный чат с временным профилем: имя не перезаписывается, профиль не запрашивается", () => {
    setChats([makeChat(CHAT_ID, { name: "Старое", isProfileLoaded: false })]);

    apply(messageNotification(makeMessage("m1", 100), "Новое"));

    expect(getChats()?.[0].name).toBe("Старое");
    expect(enrichChat).not.toHaveBeenCalled();
  });

  it("список чатов ещё не создан — в него ничего не пишется", () => {
    apply(messageNotification(makeMessage("m1", 100)));

    expect(getChats()).toBeUndefined();
    expect(localStorage.length).toBe(0);
    expect(enrichChat).not.toHaveBeenCalled();
  });

  it("лента загружена — сообщение добавляется по времени", () => {
    setChats([makeChat(CHAT_ID)]);
    setMessages([makeMessage("a", 50), makeMessage("b", 150)]);

    apply(messageNotification(makeMessage("m1", 100)));

    expect(getMessages()?.map(({ id }) => id)).toEqual(["a", "m1", "b"]);
  });

  it("ленты нет — она не создаётся", () => {
    setChats([makeChat(CHAT_ID)]);

    apply(messageNotification(makeMessage("m1", 100)));

    expect(getMessages()).toBeUndefined();
    expect(queryClient.getQueryCache().find({ queryKey: getMessagesQueryKey(CHAT_ID) })).toBe(
      undefined,
    );
  });

  it("запрос ленты создан, но данных ещё нет — не пишется", () => {
    setChats([makeChat(CHAT_ID)]);
    queryClient.getQueryCache().build(queryClient, { queryKey: getMessagesQueryKey(CHAT_ID) });

    apply(messageNotification(makeMessage("m1", 100)));

    expect(getMessages()).toBeUndefined();
  });

  it("эхо отправленного с тем же id — без дубля, время сервера заменяет локальное", () => {
    setChats([makeChat(CHAT_ID)]);
    const sent = makeMessage("m1", 100, { direction: EMessageDirection.OUTGOING, text: "привет" });
    setMessages([sent]);

    apply(messageNotification({ ...sent, timestamp: 102 }));

    expect(getMessages()).toEqual([{ ...sent, timestamp: 102 }]);
  });

  it("эхо после статуса failed — пометка о недоставке сохраняется", () => {
    setChats([makeChat(CHAT_ID)]);
    const sent = makeMessage("m1", 100, { direction: EMessageDirection.OUTGOING });
    setMessages([
      { ...sent, status: EMessageStatus.FAILED, failReason: ESendFailReason.PEER_FLOOD },
    ]);

    apply(messageNotification(sent));

    expect(getMessages()).toEqual([
      { ...sent, status: EMessageStatus.FAILED, failReason: ESendFailReason.PEER_FLOOD },
    ]);
  });

  it("удаление в загруженной ленте — оригинал скрыт, на его месте заглушка", () => {
    setChats([makeChat(CHAT_ID)]);
    setMessages([makeMessage("m1", 100), makeMessage("e1", 150, { replacesId: "m1" })]);
    const deletion = makeMessage("d1", 200, {
      text: null,
      replacesId: "m1",
      deletedMessageId: "m1",
      isDeleted: true,
    });

    apply(messageNotification(deletion));

    expect(getMessages()).toEqual([deletion]);
  });
});

describe("applyNotification — недоставка", () => {
  function failed(failReason: ESendFailReason | null, messageId = "m1"): TNotification {
    return { kind: ENotificationKind.MESSAGE_FAILED, chatId: CHAT_ID, messageId, failReason };
  }

  it("peer flood — сообщение FAILED с причиной PEER_FLOOD", () => {
    const sent = makeMessage("m1", 100, { direction: EMessageDirection.OUTGOING });
    setMessages([makeMessage("a", 50), sent]);

    apply(failed(ESendFailReason.PEER_FLOOD));

    expect(getMessages()).toEqual([
      makeMessage("a", 50),
      { ...sent, status: EMessageStatus.FAILED, failReason: ESendFailReason.PEER_FLOOD },
    ]);
  });

  it("причина неизвестна — FAILED без причины", () => {
    const sent = makeMessage("m1", 100, { direction: EMessageDirection.OUTGOING });
    setMessages([sent]);

    apply(failed(null));

    expect(getMessages()).toEqual([{ ...sent, status: EMessageStatus.FAILED, failReason: null }]);
  });

  it("ленты нет — ничего не создаётся", () => {
    apply(failed(ESendFailReason.PEER_FLOOD));

    expect(getMessages()).toBeUndefined();
  });
});

describe("applyNotification — пропущенное уведомление", () => {
  it("ignored ничего не меняет", () => {
    setChats([makeChat(CHAT_ID)]);
    setMessages([makeMessage("a", 50)]);

    apply({ kind: ENotificationKind.IGNORED });

    expect(getChats()).toEqual([makeChat(CHAT_ID)]);
    expect(getMessages()).toEqual([makeMessage("a", 50)]);
    expect(enrichChat).not.toHaveBeenCalled();
  });
});
