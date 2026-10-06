import type { QueryClient } from "@tanstack/react-query";

import type { IMessage } from "@/types/messages.types";

/** Ключ запроса сообщений чата. */
export function getMessagesQueryKey(chatId: string) {
  return ["messages", chatId] as const;
}

/**
 * Единственная точка записи сообщений чата: применяет `updater` к текущему кэшу запроса (пустому, если запроса ещё нет)
 * и сохраняет результат в кэш.
 */
export function updateMessages(
  queryClient: QueryClient,
  chatId: string,
  updater: (messages: IMessage[]) => IMessage[],
): IMessage[] {
  const next = updater(queryClient.getQueryData<IMessage[]>(getMessagesQueryKey(chatId)) ?? []);

  queryClient.setQueryData(getMessagesQueryKey(chatId), next);

  return next;
}

/**
 * Сливает новые записи с известными сообщениями чата и возвращает видимые сообщения по возрастанию времени.
 *
 * Запись с тем же `id` заменяет известную. Правка и удаление приходят отдельными записями со ссылкой на исходное сообщение
 * (`replacesId`): исходное убирается, а правка или запись удаления встаёт в ленту по своему времени (исходное время API не отдаёт);
 * запись удаления остаётся в ленте заглушкой «Сообщение удалено».
 * Сообщения с одинаковым временем остаются в порядке поступления: сначала известные, затем новые в порядке `incoming`.
 * Неотправленные (`local-*`) не трогаются, пока их не заменит запись с тем же `id`.
 */
export function mergeMessages(current: IMessage[], incoming: IMessage[]): IMessage[] {
  // `Map.set` по существующему ключу сохраняет его позицию — замена не меняет порядок поступления.
  const byId = new Map(current.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  const all = [...byId.values()];
  const replacedIds = new Set(
    all.flatMap(({ replacesId }) => (replacesId === null ? [] : [replacesId])),
  );

  return all.filter(({ id }) => !replacedIds.has(id)).toSorted((a, b) => a.timestamp - b.timestamp);
}
