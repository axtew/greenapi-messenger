import { describe, expect, it } from "vitest";

import { formatChatListTime, formatDayLabel, formatMessageTime, getDayKey } from "../dateFormat";

/** Unix-время в секундах для локальной даты. */
function at(year: number, month: number, day: number, hours = 0, minutes = 0): number {
  return new Date(year, month - 1, day, hours, minutes).getTime() / 1000;
}

/** Суббота, 10 октября 2026, 12:30 по локальному времени. */
const NOW = new Date(2026, 9, 10, 12, 30);

const LABELS = { today: "Сегодня", yesterday: "Вчера" };

describe("formatChatListTime", () => {
  it("сегодня — время", () => {
    expect(formatChatListTime(at(2026, 10, 10, 9, 5), NOW)).toBe("09:05");
  });

  it("полночь сегодняшнего дня — ещё сегодня", () => {
    expect(formatChatListTime(at(2026, 10, 10, 0, 0), NOW)).toBe("00:00");
  });

  it("минута до полуночи — уже вчера, день недели", () => {
    expect(formatChatListTime(at(2026, 10, 9, 23, 59), NOW)).toBe("пт");
  });

  it("6 дней назад — день недели", () => {
    expect(formatChatListTime(at(2026, 10, 4, 18, 0), NOW)).toBe("вс");
  });

  it("7 дней назад — дата", () => {
    expect(formatChatListTime(at(2026, 10, 3, 18, 0), NOW)).toBe("03.10.26");
  });

  it("прошлый год — дата с годом", () => {
    expect(formatChatListTime(at(2025, 12, 31, 23, 0), NOW)).toBe("31.12.25");
  });

  it("время в будущем (расхождение часов) другого дня — дата", () => {
    expect(formatChatListTime(at(2026, 10, 11, 1, 0), NOW)).toBe("11.10.26");
  });
});

describe("formatMessageTime", () => {
  it("часы и минуты с ведущим нулём", () => {
    expect(formatMessageTime(at(2026, 10, 10, 7, 3))).toBe("07:03");
  });
});

describe("getDayKey", () => {
  it("одинаков в пределах дня и различается через полночь", () => {
    expect(getDayKey(at(2026, 10, 10, 0, 0))).toBe(getDayKey(at(2026, 10, 10, 23, 59)));
    expect(getDayKey(at(2026, 10, 9, 23, 59))).not.toBe(getDayKey(at(2026, 10, 10, 0, 0)));
  });
});

describe("formatDayLabel", () => {
  it("сегодня, с полуночи", () => {
    expect(formatDayLabel(at(2026, 10, 10, 0, 0), NOW, LABELS)).toBe("Сегодня");
  });

  it("вчера, до полуночи", () => {
    expect(formatDayLabel(at(2026, 10, 9, 23, 59), NOW, LABELS)).toBe("Вчера");
  });

  it("позавчера и раньше в этом году — день и месяц", () => {
    expect(formatDayLabel(at(2026, 10, 8, 12, 0), NOW, LABELS)).toBe("8 октября");
    expect(formatDayLabel(at(2026, 1, 1, 12, 0), NOW, LABELS)).toBe("1 января");
  });

  it("прошлый год — с годом", () => {
    expect(formatDayLabel(at(2025, 10, 4, 12, 0), NOW, LABELS)).toBe("4 октября 2025 г.");
  });
});
