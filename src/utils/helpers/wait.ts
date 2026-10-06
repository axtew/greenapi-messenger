/**
 * Пауза на `ms` миллисекунд, которую прерывает `signal`.
 *
 * Вместо `setTimeout`, обёрнутого в `Promise` на месте: голый таймер не знает о сигнале, и цикл, который ждёт паузу,
 * узнаёт об отмене только после её конца. Прерывание отклоняет промис с `signal.reason` и снимает таймер — как `fetch`.
 */
export function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal.reason);
    };

    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
}
