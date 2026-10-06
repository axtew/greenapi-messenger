import { describe, expect, it } from "vitest";

import { ESendFailReason } from "@/types/messages.types";

import { getFailedLabel, splitTextWithLinks } from "../_helpers";
import { ETextPartKind } from "../_types";

function text(value: string) {
  return { kind: ETextPartKind.TEXT, value };
}

function link(value: string) {
  return { kind: ETextPartKind.LINK, value };
}

describe("splitTextWithLinks", () => {
  it("текст без ссылок — одна текстовая часть", () => {
    expect(splitTextWithLinks("Привет, как дела?")).toEqual([text("Привет, как дела?")]);
  });

  it("пустой текст — без частей", () => {
    expect(splitTextWithLinks("")).toEqual([]);
  });

  it("ссылка в середине", () => {
    expect(splitTextWithLinks("Смотри https://green-api.com сюда")).toEqual([
      text("Смотри "),
      link("https://green-api.com"),
      text(" сюда"),
    ]);
  });

  it("ссылка в конце с точкой — точка остаётся текстом", () => {
    expect(splitTextWithLinks("Вот: https://green-api.com/docs/api.")).toEqual([
      text("Вот: "),
      link("https://green-api.com/docs/api"),
      text("."),
    ]);
  });

  it("несколько знаков препинания и скобка после ссылки", () => {
    expect(splitTextWithLinks("(см. http://example.com/a?b=1)!")).toEqual([
      text("(см. "),
      link("http://example.com/a?b=1"),
      text(")!"),
    ]);
  });

  it("точка внутри адреса — часть ссылки", () => {
    expect(splitTextWithLinks("https://a.example.com/x.html")).toEqual([
      link("https://a.example.com/x.html"),
    ]);
  });

  it("несколько ссылок, в том числе подряд через перенос строки", () => {
    expect(splitTextWithLinks("https://a.com, http://b.com\nhttps://c.com")).toEqual([
      link("https://a.com"),
      text(", "),
      link("http://b.com"),
      text("\n"),
      link("https://c.com"),
    ]);
  });

  it("javascript: не становится ссылкой", () => {
    expect(splitTextWithLinks("javascript:alert(1)")).toEqual([text("javascript:alert(1)")]);
  });

  it("другие схемы и голая схема без адреса — текст", () => {
    expect(splitTextWithLinks("ftp://a.com data:text/html,x https:// https://.")).toEqual([
      text("ftp://a.com data:text/html,x https:// https://."),
    ]);
  });
});

describe("getFailedLabel", () => {
  const l = {
    failedLabel: "Не доставлено",
    sendErrors: {
      [ESendFailReason.QUOTA]: "лимит",
      [ESendFailReason.NETWORK]: "нет связи",
      [ESendFailReason.GENERIC]: "ошибка",
      [ESendFailReason.PEER_FLOOD]: "антиспам",
    },
  };

  it("причина неизвестна — только пометка", () => {
    expect(getFailedLabel(null, l)).toBe("Не доставлено");
  });

  it.each([
    { reason: ESendFailReason.QUOTA, label: "Не доставлено: лимит" },
    { reason: ESendFailReason.NETWORK, label: "Не доставлено: нет связи" },
    { reason: ESendFailReason.GENERIC, label: "Не доставлено: ошибка" },
    { reason: ESendFailReason.PEER_FLOOD, label: "Не доставлено: антиспам" },
  ])("$reason → «$label»", ({ reason, label }) => {
    expect(getFailedLabel(reason, l)).toBe(label);
  });
});
