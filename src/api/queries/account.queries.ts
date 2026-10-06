import { useQuery } from "@tanstack/react-query";

import { getAccount, getInstanceSettings } from "@/api/services/account.service";

const ACCOUNT_QUERY_KEY = ["account"] as const;
const INSTANCE_SETTINGS_QUERY_KEY = ["instanceSettings"] as const;

/** Как долго настройки инстанса считаются свежими: их меняют в личном кабинете GREEN-API, а не здесь. */
const INSTANCE_SETTINGS_STALE_TIME_MS = 5 * 60 * 1000;

/** Подключённый к инстансу Telegram-аккаунт; за сессию не меняется, поэтому запрашивается один раз. */
export function useAccountQuery() {
  return useQuery({ queryKey: ACCOUNT_QUERY_KEY, queryFn: getAccount, staleTime: Infinity });
}

/** Настройки инстанса, от которых зависит получение сообщений. */
export function useInstanceSettingsQuery() {
  return useQuery({
    queryKey: INSTANCE_SETTINGS_QUERY_KEY,
    queryFn: getInstanceSettings,
    staleTime: INSTANCE_SETTINGS_STALE_TIME_MS,
  });
}
