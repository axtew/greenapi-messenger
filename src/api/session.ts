import { z } from "zod";

import { routerPaths } from "@/routes/_paths";
import type { ISession } from "@/types/account.types";
import { getLSItem, removeLSItem, setLSItem } from "@/utils/helpers/localStorage";

const SESSION_STORAGE_KEY = "greenapi-messenger:session";

/** Причина выхода, которую экран входа получает в параметре `?reason=`. */
export enum ESignOutReason {
  EXPIRED = "expired",
}

const sessionSchema: z.ZodType<ISession> = z.object({
  idInstance: z.string(),
  apiTokenInstance: z.string(),
});

/** Учётные данные текущей сессии из localStorage; `null`, если входа не было, запись повреждена или хранилище недоступно. */
export function getSession(): ISession | null {
  return getLSItem(SESSION_STORAGE_KEY, sessionSchema);
}

export function saveSession(session: ISession): void {
  setLSItem(SESSION_STORAGE_KEY, session);
}

/**
 * Завершает сессию и уводит на экран входа полной перезагрузкой страницы.
 *
 * Перезагрузка, а не переход роутера, гарантированно обнуляет кэш запросов, цикл получения уведомлений
 * и Web Lock, а этому модулю не нужно импортировать роутер (иначе — цикл импортов через компоненты с кнопкой выхода).
 */
export function signOut(reason?: ESignOutReason): void {
  removeLSItem(SESSION_STORAGE_KEY);
  window.location.assign(routerPaths.login + (reason === undefined ? "" : `?reason=${reason}`));
}
