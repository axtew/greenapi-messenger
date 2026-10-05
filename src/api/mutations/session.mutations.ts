import { useMutation } from "@tanstack/react-query";

import { EGreenApiMethod } from "@/api/greenApi";
import { checkInstanceAuthorized } from "@/api/services/account.service";
import { saveSession } from "@/api/session";
import type { ISession } from "@/types/account.types";

/**
 * Учётные данные верны, но инстанс не подключён к Telegram-аккаунту (или ещё запускается).
 *
 * `message` — отладочный код в формате `GreenApiError`; текст для пользователя форма входа выбирает по типу ошибки.
 */
export class InstanceNotAuthorizedError extends Error {
  constructor() {
    super(`GREEN-API ${EGreenApiMethod.GET_STATE_INSTANCE}: notAuthorized`);
    this.name = "InstanceNotAuthorizedError";
  }
}

/**
 * Вход: проверяет учётные данные запросом состояния инстанса и сохраняет сессию.
 *
 * Ответ 401 здесь означает неверные учётные данные, а не истёкшую сессию, поэтому мутация помечена
 * `skipUnauthorizedRedirect` — общий обработчик 401 её пропускает, а ошибку показывает форма входа.
 */
export function useLoginMutation() {
  return useMutation({
    mutationFn: async (credentials: ISession) => {
      if (!(await checkInstanceAuthorized(credentials))) {
        throw new InstanceNotAuthorizedError();
      }

      saveSession(credentials);
    },
    meta: { skipUnauthorizedRedirect: true },
  });
}
