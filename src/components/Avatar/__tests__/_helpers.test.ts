import { describe, expect, it } from "vitest";

import { getAvatarColor, getInitials } from "../_helpers";

const COLORS = ["red", "green", "blue"] as const;

describe("getInitials", () => {
  it("первые буквы двух слов кириллицы", () => {
    expect(getInitials("Иван Петров")).toBe("ИП");
  });

  it("одно слово — одна буква", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("пустая строка — пусто", () => {
    expect(getInitials("")).toBe("");
  });

  it("не больше двух букв, нижний регистр поднимается", () => {
    expect(getInitials("анна мария петрова")).toBe("АМ");
  });

  it("слова разделяют любые знаки, а не только пробел", () => {
    expect(getInitials("@ivan_petrov")).toBe("IP");
    expect(getInitials("+79990000000")).toBe("7");
    expect(getInitials("  «Ёлка»  Дом ")).toBe("ЁД");
  });
});

describe("getAvatarColor", () => {
  it("стабилен для одного chatId", () => {
    expect(getAvatarColor("79990000000", COLORS)).toBe(getAvatarColor("79990000000", COLORS));
  });

  it("всегда из палитры", () => {
    for (const chatId of ["1", "79990000000", "123456789012345", ""]) {
      expect(COLORS).toContain(getAvatarColor(chatId, COLORS));
    }
  });

  it("разные chatId расходятся по палитре", () => {
    const colors = new Set(
      Array.from({ length: 30 }, (_, index) =>
        getAvatarColor(String(7_999_000_000 + index), COLORS),
      ),
    );

    expect(colors.size).toBe(COLORS.length);
  });
});
