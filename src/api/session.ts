import { z } from "zod";

import type { ISession } from "@/types/account.types";

const SESSION_STORAGE_KEY = "greenapi-messenger:session";

/** Причина выхода, которую экран входа получает в параметре `?reason=`. */
export enum ESignOutReason {
  EXPIRED = "expired",
}

const sessionSchema: z.ZodType<ISession> = z.object({
  idInstance: z.string(),
  apiTokenInstance: z.string(),
});

/**
 * Учётные данные текущей сессии из localStorage; `null`, если входа не было или запись повреждена.
 *
 * Доступ к localStorage обёрнут в `try/catch`: в приватном режиме Safari и при запрете хранилища он бросает исключение.
 */
export function getSession(): ISession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);

    if (raw === null) {
      return null;
    }

    const parsed = sessionSchema.safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveSession(session: ISession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Не удалось сохранить сессию", error);
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("Не удалось удалить сессию", error);
  }
}

/**
 * Завершает сессию и уводит на экран входа полной перезагрузкой страницы.
 *
 * Перезагрузка, а не переход роутера, гарантированно обнуляет кэш запросов, цикл получения уведомлений
 * и Web Lock, а этому модулю не нужно импортировать роутер (иначе — цикл импортов через компоненты с кнопкой выхода).
 */
export function signOut(reason?: ESignOutReason): void {
  clearSession();
  window.location.assign("/login" + (reason === undefined ? "" : `?reason=${reason}`));
}
