import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import {
  EMessageDirection,
  EMessageStatus,
  ESendFailReason,
  type IMessage,
} from "@/types/messages.types";

import {
  getMessagesQueryKey,
  markMessageFailed,
  mergeMessages,
  updateMessages,
} from "../messages.cache";

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
    deletedMessageId: null,
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

  it("удаление убирает оригинал, а запись удаления остаётся заглушкой по своему времени", () => {
    const original = makeMessage("a", 10, { text: "секрет" });
    const deletion = makeMessage("d", 40, { text: null, replacesId: "a", isDeleted: true });

    expect(mergeMessages([original, makeMessage("b", 20)], [deletion])).toEqual([
      makeMessage("b", 20),
      deletion,
    ]);
  });

  it("удаление в том же ответе, что и оригинал, тоже убирает его", () => {
    const original = makeMessage("a", 10);
    const deletion = makeMessage("d", 40, { text: null, replacesId: "a", isDeleted: true });

    expect(mergeMessages([], [original, deletion])).toEqual([deletion]);
  });

  it("запись удаления без оригинала в истории остаётся заглушкой", () => {
    const deletion = makeMessage("d", 10, { text: null, replacesId: "gone", isDeleted: true });

    expect(mergeMessages([], [deletion])).toEqual([deletion]);
  });

  it("повторное слияние той же записи удаления не дублирует заглушку", () => {
    const deletion = makeMessage("d", 40, { text: null, replacesId: "a", isDeleted: true });

    expect(getIds(mergeMessages([deletion], [deletion]))).toEqual(["d"]);
  });

  it("удаление со ссылкой на правку убирает и оригинал, которого правка в кэше не заменила", () => {
    const original = makeMessage("a", 10, { text: "было" });
    const deletion = makeMessage("d", 40, {
      text: null,
      replacesId: "edit",
      deletedMessageId: "a",
      isDeleted: true,
    });

    expect(mergeMessages([original, makeMessage("b", 20)], [deletion])).toEqual([
      makeMessage("b", 20),
      deletion,
    ]);
  });

  it("удаление убирает все правки того же сообщения, а не только ту, на которую ссылается", () => {
    const original = makeMessage("a", 10);
    const firstEdit = makeMessage("e1", 20, { replacesId: "a" });
    const secondEdit = makeMessage("e2", 30, { replacesId: "a" });
    const deletion = makeMessage("d", 40, {
      text: null,
      replacesId: "e2",
      deletedMessageId: "a",
      isDeleted: true,
    });

    expect(mergeMessages([original, firstEdit, secondEdit], [deletion])).toEqual([deletion]);
  });

  it("удаление из уведомления (обе ссылки — на оригинал) убирает оригинал и его правку", () => {
    const original = makeMessage("a", 10);
    const edit = makeMessage("e", 20, { replacesId: "a" });
    const deletion = makeMessage("d", 40, {
      text: null,
      replacesId: "a",
      deletedMessageId: "a",
      isDeleted: true,
    });

    expect(mergeMessages([original, edit, makeMessage("b", 30)], [deletion])).toEqual([
      makeMessage("b", 30),
      deletion,
    ]);
  });

  it("две правки одного сообщения без удаления остаются обе", () => {
    const original = makeMessage("a", 10);
    const firstEdit = makeMessage("e1", 20, { replacesId: "a" });
    const secondEdit = makeMessage("e2", 30, { replacesId: "a" });

    expect(getIds(mergeMessages([original], [firstEdit, secondEdit]))).toEqual(["e1", "e2"]);
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

describe("markMessageFailed", () => {
  it("сообщение с этим id помечается недоставленным с причиной, остальные не меняются", () => {
    const other = makeMessage("a", 10);
    const target = makeMessage("b", 20, { direction: EMessageDirection.OUTGOING });

    expect(markMessageFailed([other, target], "b", ESendFailReason.NETWORK)).toEqual([
      other,
      { ...target, status: EMessageStatus.FAILED, failReason: ESendFailReason.NETWORK },
    ]);
  });

  it("причина может быть неизвестна", () => {
    const target = makeMessage("b", 20, { direction: EMessageDirection.OUTGOING });

    expect(markMessageFailed([target], "b", null)).toEqual([
      { ...target, status: EMessageStatus.FAILED, failReason: null },
    ]);
  });

  it("нет сообщения с таким id — список не меняется", () => {
    const messages = [makeMessage("a", 10)];

    expect(markMessageFailed(messages, "missing", ESendFailReason.GENERIC)).toEqual(messages);
  });
});
