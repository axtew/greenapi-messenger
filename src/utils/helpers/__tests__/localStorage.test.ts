import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import { z } from "zod";

import { createMemoryStorage } from "@/__tests__/_memoryStorage";

import { getLSItem, removeLSItem, setLSItem } from "../localStorage";

const KEY = "test-key";
const SECRET = "SECRET-api-token-0123456789";

const itemSchema = z.object({ id: z.number(), name: z.string() });

/** Хранилище, любое обращение к которому бросает — как в приватном режиме Safari или при запрете хранилища. */
function createThrowingStorage(): Storage {
  const fail = (): never => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  };

  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

/**
 * Всё, что попало в `console.error`, одной строкой — чтобы искать в логе ключ и значение.
 *
 * Объекты сериализуются в JSON: `String(object)` дал бы `[object Object]`, и попавшее в лог значение осталось бы незамеченным.
 */
function getLoggedText(spy: MockInstance<typeof console.error>): string {
  return spy.mock.calls
    .flat()
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}`;
      }

      return typeof arg === "string" ? arg : JSON.stringify(arg);
    })
    .join(" ");
}

let consoleErrorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getLSItem", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  it("возвращает null, если записи нет", () => {
    expect(getLSItem(KEY, itemSchema)).toBeNull();
  });

  it("возвращает null, если запись — битый JSON", () => {
    localStorage.setItem(KEY, "{not json");

    expect(getLSItem(KEY, itemSchema)).toBeNull();
  });

  it("возвращает null, если форма записи не совпадает со схемой", () => {
    localStorage.setItem(KEY, JSON.stringify({ id: "1", title: "чужая форма" }));

    expect(getLSItem(KEY, itemSchema)).toBeNull();
  });

  it("возвращает разобранное значение, если запись валидна", () => {
    localStorage.setItem(KEY, JSON.stringify({ id: 1, name: "Анна" }));

    expect(getLSItem(KEY, itemSchema)).toEqual({ id: 1, name: "Анна" });
  });

  it("возвращает null и не бросает, если хранилище недоступно", () => {
    vi.stubGlobal("localStorage", createThrowingStorage());

    expect(() => getLSItem(KEY, itemSchema)).not.toThrow();
    expect(getLSItem(KEY, itemSchema)).toBeNull();
  });
});

describe("setLSItem", () => {
  it("записывает значение как JSON", () => {
    vi.stubGlobal("localStorage", createMemoryStorage());

    setLSItem(KEY, { id: 1, name: "Анна" });

    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ id: 1, name: "Анна" }));
  });

  it("не бросает, если хранилище недоступно", () => {
    vi.stubGlobal("localStorage", createThrowingStorage());

    expect(() => setLSItem(KEY, { token: SECRET })).not.toThrow();
  });

  it("при ошибке логирует ключ, но не значение", () => {
    vi.stubGlobal("localStorage", createThrowingStorage());

    setLSItem(KEY, { token: SECRET });

    const logged = getLoggedText(consoleErrorSpy);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(logged).toContain(KEY);
    expect(logged).not.toContain(SECRET);
  });
});

describe("removeLSItem", () => {
  it("удаляет запись", () => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    localStorage.setItem(KEY, JSON.stringify({ id: 1, name: "Анна" }));

    removeLSItem(KEY);

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("не бросает и логирует ключ, если хранилище недоступно", () => {
    vi.stubGlobal("localStorage", createThrowingStorage());

    expect(() => removeLSItem(KEY)).not.toThrow();
    expect(getLoggedText(consoleErrorSpy)).toContain(KEY);
  });
});
