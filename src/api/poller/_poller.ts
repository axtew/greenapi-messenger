import { isUnauthorized } from "@/api/greenApi";
import { deleteNotification, receiveNotification } from "@/api/services/notifications.service";
import type { TNotification } from "@/types/notifications.types";
import { wait } from "@/utils/helpers/wait";

/** Сколько секунд сервер держит запрос `receiveNotification`, если очередь пуста. */
const RECEIVE_TIMEOUT_S = 20;

const MIN_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30_000;

interface IPollerOptions {
  idInstance: string;
  /** Обрабатывает уведомление; исключение логируется, уведомление всё равно удаляется из очереди. */
  onNotification: (notification: TNotification) => void;
  /** Сервер ответил 401: учётные данные больше не действуют, цикл остановлен. */
  onUnauthorized: () => void;
}

/**
 * Цикл long-polling: ждёт уведомление, передаёт его обработчику и удаляет из очереди, пока `signal` не прерван.
 *
 * Удаление — после обработки, и ошибка обработчика его не отменяет: иначе очередь встала бы на этом уведомлении.
 * Если удаление не прошло, очередь отдаёт то же уведомление снова: его `receiptId` совпадает с последним обработанным,
 * поэтому обработчик повторно не вызывается — повторяется только удаление. После успешного удаления номер забывается:
 * уведомление с тем же `receiptId` дальше (нумерация в GREEN-API могла начаться заново) обрабатывается как новое.
 *
 * Пустая очередь (`null`, в том числе по ответу 408) — обычный цикл без паузы. 401 останавливает цикл. Любая другая ошибка (сеть, 429, 5xx, прочие 4xx,
 * ответ неожиданной формы, сбой удаления) повторяется с паузой, которая растёт вдвое от 1 до 30 секунд
 * и сбрасывается после успешного цикла.
 */
async function runLoop(
  signal: AbortSignal,
  { onNotification, onUnauthorized }: IPollerOptions,
): Promise<void> {
  let delay = 0;
  let lastReceiptId: number | null = null;

  while (!signal.aborted) {
    try {
      const item = await receiveNotification(RECEIVE_TIMEOUT_S, signal);

      if (item !== null) {
        if (item.receiptId !== lastReceiptId) {
          lastReceiptId = item.receiptId;

          try {
            onNotification(item.notification);
          } catch (error) {
            console.error("Не удалось обработать уведомление GREEN-API", error);
          }
        }

        await deleteNotification(item.receiptId);
        lastReceiptId = null;
      }

      delay = 0;
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      if (isUnauthorized(error)) {
        onUnauthorized();
        return;
      }

      delay = Math.min(Math.max(delay * 2, MIN_RETRY_DELAY_MS), MAX_RETRY_DELAY_MS);
    }

    if (delay > 0) {
      await wait(delay, signal);
    }
  }
}

/**
 * Запускает получение уведомлений инстанса и возвращает функцию остановки.
 *
 * Очередь читает одна вкладка: цикл работает под Web Lock инстанса, остальные вкладки ждут его освобождения
 * (закрытие вкладки-владельца передаёт блокировку следующей). Остановка до захвата блокировки снимает и ожидание,
 * поэтому повторный запуск сразу после остановки (двойной mount эффектов в StrictMode) оставляет один цикл.
 * Без Web Locks в браузере цикл работает без блокировки.
 */
export function startPoller(options: IPollerOptions): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const run = () => runLoop(signal, options);

  let loop: Promise<void>;

  if ("locks" in navigator) {
    loop = navigator.locks.request(
      `greenapi-messenger:poller:${options.idInstance}`,
      { signal },
      run,
    );
  } else {
    console.warn("Web Locks недоступны: уведомления читаются без блокировки между вкладками");
    loop = run();
  }

  loop.catch((error: unknown) => {
    if (!signal.aborted) {
      console.error("Получение уведомлений GREEN-API остановлено", error);
    }
  });

  return () => controller.abort();
}
