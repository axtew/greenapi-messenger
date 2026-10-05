import { z } from "zod";

/** Значения `stateInstance`, которые проверяет код; API присылает и другие, поэтому схема их не сужает. */
export enum EStateInstance {
  AUTHORIZED = "authorized",
}

/** Значения `incomingWebhook` из `getSettings`, которые проверяет код. */
export enum EIncomingWebhook {
  YES = "yes",
}

export const stateInstanceSchema = z.object({
  stateInstance: z.string(),
});

export const settingsSchema = z.object({
  webhookUrl: z.string(),
  incomingWebhook: z.string(),
});

/** Поля пусты или отсутствуют, пока инстанс не авторизован. */
export const accountSettingsSchema = z.object({
  phone: z.string().optional(),
  username: z.string().optional(),
  avatar: z.string().optional(),
});
