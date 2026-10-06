import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { GreenApiError, isUnauthorized } from "@/api/greenApi";
import { ESignOutReason, signOut } from "@/api/session";

/**
 * Стоит ли повторять запрос: нет — только для ответа GREEN-API со статусом ниже 500, кроме 429; любая другая ошибка повторяется.
 *
 * Такой ответ (4xx, кроме 429, отказ или тело неожиданной формы при 200) повтор не исправит. Повторяются сбой сети, ответы 5xx,
 * ответ 429 (лимит частоты снимается через паузу — например, когда при открытии чата по ссылке лента и синхронизация
 * списка запрашиваются одновременно) и ошибки не от GREEN-API (в том числе исключение в самой `queryFn`).
 * Пауза между попытками — стандартная у TanStack Query.
 */
function isRetriable(error: Error): boolean {
  return !(
    error instanceof GreenApiError &&
    error.status !== null &&
    error.status < 500 &&
    error.status !== 429
  );
}

/**
 * Кэш запросов приложения.
 *
 * Ответ 401 в любом запросе или мутации означает, что токен инстанса больше не действует: сессия завершается
 * с выходом на экран входа и сообщением об этом. Исключение — мутации с `meta.skipUnauthorizedRedirect`:
 * их 401 обрабатывает сам экран.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isUnauthorized(error)) {
        signOut(ESignOutReason.EXPIRED);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (isUnauthorized(error) && mutation.options.meta?.skipUnauthorizedRedirect !== true) {
        signOut(ESignOutReason.EXPIRED);
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => failureCount < 2 && isRetriable(error),
    },
  },
});
