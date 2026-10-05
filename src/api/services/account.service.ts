import { EHttpMethod, greenApiRequest } from "@/api/greenApi";
import {
  accountSettingsSchema,
  EIncomingWebhook,
  EStateInstance,
  settingsSchema,
  stateInstanceSchema,
} from "@/api/schemas/account.schema";
import type { IAccount, IInstanceSettings, ISession } from "@/types/account.types";

import { toNullable, toPhone, toUsername } from "./_helpers";

/** Проверяет учётные данные до входа: `true`, если инстанс авторизован в Telegram. */
export async function checkInstanceAuthorized(credentials: ISession): Promise<boolean> {
  const { stateInstance } = await greenApiRequest({
    method: "getStateInstance",
    httpMethod: EHttpMethod.GET,
    schema: stateInstanceSchema,
    credentials,
  });

  return stateInstance === EStateInstance.AUTHORIZED;
}

export async function getInstanceSettings(): Promise<IInstanceSettings> {
  const { webhookUrl, incomingWebhook } = await greenApiRequest({
    method: "getSettings",
    httpMethod: EHttpMethod.GET,
    schema: settingsSchema,
  });

  return { webhookUrl, isIncomingEnabled: incomingWebhook === EIncomingWebhook.YES };
}

export async function getAccount(): Promise<IAccount> {
  const { phone, username, avatar } = await greenApiRequest({
    method: "getAccountSettings",
    httpMethod: EHttpMethod.GET,
    schema: accountSettingsSchema,
  });

  return { phone: toPhone(phone), username: toUsername(username), avatarUrl: toNullable(avatar) };
}
