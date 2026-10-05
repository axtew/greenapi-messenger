import { useQuery } from "@tanstack/react-query";

import { getAccount } from "@/api/services/account.service";

const ACCOUNT_QUERY_KEY = ["account"] as const;

/** Подключённый к инстансу Telegram-аккаунт; за сессию не меняется, поэтому запрашивается один раз. */
export function useAccountQuery() {
  return useQuery({ queryKey: ACCOUNT_QUERY_KEY, queryFn: getAccount, staleTime: Infinity });
}
