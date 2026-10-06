import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { wait } from "../wait";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("wait", () => {
  it("завершается через заданное время, не раньше", async () => {
    const onDone = vi.fn();
    void wait(1000, new AbortController().signal).then(onDone);

    await vi.advanceTimersByTimeAsync(999);
    expect(onDone).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("прерывание отклоняет промис с причиной сигнала и снимает таймер", async () => {
    const controller = new AbortController();
    const promise = wait(1000, controller.signal);
    const reason = new Error("stop");

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("уже прерванный сигнал — отказ сразу, без таймера", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(wait(1000, controller.signal)).rejects.toBe(controller.signal.reason);
    expect(vi.getTimerCount()).toBe(0);
  });
});
