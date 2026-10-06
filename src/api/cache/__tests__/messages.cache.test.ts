import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

import { getMessagesQueryKey, mergeMessages, updateMessages } from "../messages.cache";

const CHAT_ID = "100";

function makeMessage(id: string, timestamp: number, overrides: Partial<IMessage> = {}): IMessage {
  return {
    id,
    chatId: CHAT_ID,
    direction: EMessageDirection.INCOMING,
    text: `text ${id}`,
    timestamp,
    status: EMessageStatus.SENT,
    failReason: null,
    replacesId: null,
    isDeleted: false,
    ...overrides,
  };
}

function getIds(messages: IMessage[]): string[] {
  return messages.map(({ id }) => id);
}

describe("mergeMessages", () => {
  it("одно сообщение из кэша и из ответа — одна запись, побеждает новая", () => {
    const cached = makeMessage("a", 10, { text: "старый" });
    const fresh = makeMessage("a", 10, { text: "новый" });

    const result = mergeMessages([cached], [fresh, makeMessage("b", 20)]);

    expect(getIds(result)).toEqual(["a", "b"]);
    expect(result[0].text).toBe("новый");
  });

  it("правка заменяет оригинал и встаёт по своему времени", () => {
    const original = makeMessage("a", 10, { text: "было" });
    const other = makeMessage("b", 20);
    const edit = makeMessage("c", 30, { text: "стало", replacesId: "a" });

    expect(getIds(mergeMessages([original, other], [edit]))).toEqual(["b", "c"]);
  });

  it("правка в том же ответе, что и оригинал, тоже убирает его", () => {
    const original = makeMessage("a", 10);
    const edit = makeMessage("c", 30, { replacesId: "a" });

    expect(getIds(mergeMessages([], [original, edit]))).toEqual(["c"]);
  });

  it("удаление убирает и оригинал, и саму запись удаления", () => {
    const original = makeMessage("a", 10, { text: "секрет" });
    const deletion = makeMessage("d", 40, { text: "секрет", replacesId: "a", isDeleted: true });

    expect(mergeMessages([original, makeMessage("b", 20)], [deletion])).toEqual([
      makeMessage("b", 20),
    ]);
  });

  it("запись с isDeleted без ссылки не показывается", () => {
    expect(mergeMessages([], [makeMessage("a", 10, { isDeleted: true })])).toEqual([]);
  });

  it("сортировка по времени, при равенстве — по порядку поступления", () => {
    const result = mergeMessages(
      [makeMessage("late", 50), makeMessage("x", 20)],
      [makeMessage("y", 20), makeMessage("early", 5), makeMessage("z", 20)],
    );

    expect(getIds(result)).toEqual(["early", "x", "y", "z", "late"]);
  });

  it("замена существующей записи не сдвигает её среди сообщений с тем же временем", () => {
    const result = mergeMessages(
      [makeMessage("x", 20), makeMessage("y", 20)],
      [makeMessage("x", 20, { text: "обновлён" })],
    );

    expect(getIds(result)).toEqual(["x", "y"]);
  });

  it("локальные сообщения сохраняются, пока их не заменит запись с тем же id", () => {
    const local = makeMessage("local-1", 30, {
      direction: EMessageDirection.OUTGOING,
      status: EMessageStatus.SENDING,
    });

    const result = mergeMessages([makeMessage("a", 10), local], [makeMessage("b", 20)]);

    expect(getIds(result)).toEqual(["a", "b", "local-1"]);
    expect(result[2]).toBe(local);
  });

  it("не меняет входные массивы", () => {
    const current = [makeMessage("a", 10)];
    const incoming = [makeMessage("b", 5, { replacesId: "a" })];

    mergeMessages(current, incoming);

    expect(getIds(current)).toEqual(["a"]);
    expect(getIds(incoming)).toEqual(["b"]);
  });
});

describe("updateMessages", () => {
  it("применяет updater к кэшу запроса и сохраняет результат", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getMessagesQueryKey(CHAT_ID), [makeMessage("a", 10)]);

    const next = updateMessages(queryClient, CHAT_ID, (messages) => [
      ...messages,
      makeMessage("b", 20),
    ]);

    expect(getIds(next)).toEqual(["a", "b"]);
    expect(queryClient.getQueryData(getMessagesQueryKey(CHAT_ID))).toEqual(next);
  });

  it("слияние истории с кэшем: в кэш сохраняется тот же список, что возвращается", () => {
    const queryClient = new QueryClient();
    const local = makeMessage("local-1", 30, {
      direction: EMessageDirection.OUTGOING,
      status: EMessageStatus.SENDING,
    });
    queryClient.setQueryData(getMessagesQueryKey(CHAT_ID), [makeMessage("a", 10), local]);

    const next = updateMessages(queryClient, CHAT_ID, (cached) =>
      mergeMessages(cached, [makeMessage("a", 10, { text: "из истории" }), makeMessage("b", 20)]),
    );

    expect(getIds(next)).toEqual(["a", "b", "local-1"]);
    expect(next[0].text).toBe("из истории");
    expect(queryClient.getQueryData(getMessagesQueryKey(CHAT_ID))).toEqual(next);
  });

  it("запроса ещё нет — updater получает пустой список", () => {
    const queryClient = new QueryClient();

    const next = updateMessages(queryClient, CHAT_ID, (messages) => [
      ...messages,
      makeMessage("a", 10),
    ]);

    expect(getIds(next)).toEqual(["a"]);
  });
});
