import { describe, expect, it } from "vitest";

import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

import { buildListItems } from "../_helpers";
import { EListItemKind, type TListItem } from "../_types";

const LABELS = { today: "Сегодня", yesterday: "Вчера" };

/** «Сейчас» — 6 октября 2026, 15:00 по локальному времени. */
const NOW = new Date(2026, 9, 6, 15, 0);

/** Unix-время в секундах для локальной даты октября 2026. */
function at(day: number, hours: number, minutes = 0): number {
  return new Date(2026, 9, day, hours, minutes).getTime() / 1000;
}

function makeMessage(id: string, timestamp: number, direction: EMessageDirection): IMessage {
  return {
    id,
    chatId: "100",
    direction,
    text: id,
    timestamp,
    status: EMessageStatus.SENT,
    failReason: null,
    replacesId: null,
    deletedMessageId: null,
    isDeleted: false,
  };
}

const IN = EMessageDirection.INCOMING;
const OUT = EMessageDirection.OUTGOING;

/** Сжатая запись ленты: подпись дня или `id:last` / `id`. */
function describeItems(items: TListItem[]): string[] {
  return items.map((item) =>
    item.kind === EListItemKind.DATE
      ? `[${item.label}]`
      : `${item.message.id}${item.isLastInGroup ? ":last" : ""}`,
  );
}

describe("buildListItems", () => {
  it("пустой список — без элементов", () => {
    expect(buildListItems([], NOW, LABELS)).toEqual([]);
  });

  it("разделитель перед первым сообщением каждого дня: дата, «Вчера», «Сегодня»", () => {
    const items = buildListItems(
      [
        makeMessage("a", at(1, 10), IN),
        makeMessage("b", at(5, 22, 44), IN),
        makeMessage("c", at(6, 13, 31), IN),
      ],
      NOW,
      LABELS,
    );

    expect(describeItems(items)).toEqual([
      "[1 октября]",
      "a:last",
      "[Вчера]",
      "b:last",
      "[Сегодня]",
      "c:last",
    ]);
  });

  it("сообщения одного дня — один разделитель с ключом дня", () => {
    const items = buildListItems(
      [makeMessage("a", at(6, 9), IN), makeMessage("b", at(6, 23, 59), IN)],
      NOW,
      LABELS,
    );

    expect(items.filter(({ kind }) => kind === EListItemKind.DATE)).toEqual([
      { kind: EListItemKind.DATE, key: "date-2026-10-6", label: "Сегодня" },
    ]);
  });

  it("группа — подряд одно направление; последний в группе отмечен", () => {
    const items = buildListItems(
      [
        makeMessage("a", at(6, 10), IN),
        makeMessage("b", at(6, 10, 1), IN),
        makeMessage("c", at(6, 10, 2), OUT),
        makeMessage("d", at(6, 10, 3), OUT),
        makeMessage("e", at(6, 10, 4), IN),
      ],
      NOW,
      LABELS,
    );

    expect(describeItems(items)).toEqual(["[Сегодня]", "a", "b:last", "c", "d:last", "e:last"]);
  });

  it("заглушка удалённого входит в группу своего отправителя", () => {
    const deletion: IMessage = {
      ...makeMessage("del", at(6, 10, 1), OUT),
      text: null,
      replacesId: "x",
      isDeleted: true,
    };

    const items = buildListItems(
      [makeMessage("a", at(6, 10), OUT), deletion, makeMessage("b", at(6, 10, 2), IN)],
      NOW,
      LABELS,
    );

    expect(describeItems(items)).toEqual(["[Сегодня]", "a", "del:last", "b:last"]);
  });

  it("смена дня закрывает группу даже при том же направлении", () => {
    const items = buildListItems(
      [makeMessage("a", at(5, 23, 59), OUT), makeMessage("b", at(6, 0, 1), OUT)],
      NOW,
      LABELS,
    );

    expect(describeItems(items)).toEqual(["[Вчера]", "a:last", "[Сегодня]", "b:last"]);
  });
});
