import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EGreenApiErrorKind, EGreenApiMethod, GreenApiError } from "@/api/greenApi";
import { deleteNotification, receiveNotification } from "@/api/services/notifications.service";
import { ENotificationKind, type IReceivedNotification } from "@/types/notifications.types";

import { startPoller } from "../_poller";

vi.mock("@/api/services/notifications.service", () => ({
  receiveNotification: vi.fn(),
  deleteNotification: vi.fn(),
}));

const receiveMock = vi.mocked(receiveNotification);
const deleteMock = vi.mocked(deleteNotification);

const ID_INSTANCE = "4100000001";

const onNotification = vi.fn();
const onUnauthorized = vi.fn();

let stopPoller: (() => void) | null = null;

function received(receiptId: number): IReceivedNotification {
  return { receiptId, notification: { kind: ENotificationKind.IGNORED } };
}

function networkError(): GreenApiError {
  return new GreenApiError(EGreenApiErrorKind.NETWORK, EGreenApiMethod.RECEIVE_NOTIFICATION, null);
}

/** Запрос, который висит, пока его не прервут, — как long-poll на пустой очереди. */
function pendingUntilAbort(_receiveTimeout: number, signal: AbortSignal): Promise<null> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  });
}

/** Web Locks, которые выдают блокировку сразу. */
function grantingLocks() {
  return {
    request: vi.fn(
      (_name: string, _options: LockOptions, callback: () => Promise<void>): Promise<void> =>
        callback(),
    ),
  };
}

function start() {
  stopPoller = startPoller({ idInstance: ID_INSTANCE, onNotification, onUnauthorized });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("navigator", { locks: grantingLocks() });
  receiveMock.mockImplementation(pendingUntilAbort);
  deleteMock.mockResolvedValue(undefined);
});

afterEach(() => {
  stopPoller?.();
  stopPoller = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  receiveMock.mockReset();
  deleteMock.mockReset();
  onNotification.mockReset();
  onUnauthorized.mockReset();
});

describe("startPoller", () => {
  it("уведомление передаётся обработчику, затем удаляется по receiptId", async () => {
    receiveMock.mockResolvedValueOnce(received(5));

    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(onNotification).toHaveBeenCalledWith({ kind: ENotificationKind.IGNORED });
    expect(deleteMock).toHaveBeenCalledWith(5);
    expect(onNotification.mock.invocationCallOrder[0]).toBeLessThan(
      deleteMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("исключение в обработчике не отменяет удаление", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onNotification.mockImplementationOnce(() => {
      throw new Error("сбой обработчика");
    });
    receiveMock.mockResolvedValueOnce(received(5));

    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(consoleError).toHaveBeenCalledOnce();
    expect(deleteMock).toHaveBeenCalledWith(5);
    expect(receiveMock).toHaveBeenCalledTimes(2);
  });

  it("401 → onUnauthorized и цикл остановлен", async () => {
    receiveMock.mockRejectedValueOnce(
      new GreenApiError(EGreenApiErrorKind.HTTP, EGreenApiMethod.RECEIVE_NOTIFICATION, 401),
    );

    start();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(receiveMock).toHaveBeenCalledOnce();
  });

  it("пауза при ошибке растёт вдвое и сбрасывается после успешного цикла", async () => {
    receiveMock
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(networkError());

    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(receiveMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(receiveMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(receiveMock).toHaveBeenCalledTimes(2);

    // Вторая ошибка подряд — пауза 2 с.
    await vi.advanceTimersByTimeAsync(1999);
    expect(receiveMock).toHaveBeenCalledTimes(2);
    // Затем пустой цикл без паузы и снова ошибка — пауза опять 1 с, а не 4.
    await vi.advanceTimersByTimeAsync(1);
    expect(receiveMock).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(999);
    expect(receiveMock).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(1);
    expect(receiveMock).toHaveBeenCalledTimes(5);
  });

  it("пустая очередь (null, в том числе по ответу 408) — следующий запрос сразу, без паузы", async () => {
    receiveMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(receiveMock).toHaveBeenCalledTimes(3);
    expect(deleteMock).not.toHaveBeenCalled();
    expect(onNotification).not.toHaveBeenCalled();
  });

  it("то же уведомление после неудачного удаления не обрабатывается снова — повторяется только удаление", async () => {
    receiveMock.mockResolvedValueOnce(received(5)).mockResolvedValueOnce(received(5));
    deleteMock.mockRejectedValueOnce(networkError());

    start();
    await vi.advanceTimersByTimeAsync(1000);

    expect(onNotification).toHaveBeenCalledOnce();
    expect(deleteMock).toHaveBeenCalledTimes(2);
    expect(deleteMock).toHaveBeenLastCalledWith(5);
  });

  it("после успешного удаления уведомление с тем же receiptId обрабатывается как новое", async () => {
    receiveMock.mockResolvedValueOnce(received(5)).mockResolvedValueOnce(received(5));

    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(onNotification).toHaveBeenCalledTimes(2);
    expect(deleteMock).toHaveBeenCalledTimes(2);
  });

  it("цикл идёт под Web Lock инстанса с сигналом остановки", async () => {
    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(navigator.locks.request).toHaveBeenCalledWith(
      `greenapi-messenger:poller:${ID_INSTANCE}`,
      { signal: expect.any(AbortSignal) },
      expect.any(Function),
    );
    expect(receiveMock).toHaveBeenCalledOnce();
  });

  it("остановка до захвата блокировки — цикл не запускается, ошибки в консоли нет", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const request = vi.fn(
      (_name: string, { signal }: LockOptions): Promise<void> =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(signal.reason), { once: true });
        }),
    );
    vi.stubGlobal("navigator", { locks: { request } });

    start();
    stopPoller?.();
    await vi.advanceTimersByTimeAsync(0);

    expect(request).toHaveBeenCalledOnce();
    expect(receiveMock).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("без Web Locks — предупреждение и цикл без блокировки", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("navigator", {});

    start();
    await vi.advanceTimersByTimeAsync(0);

    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(receiveMock).toHaveBeenCalledOnce();
  });
});
