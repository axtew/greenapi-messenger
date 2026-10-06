import { useQuery } from "@tanstack/react-query";

import { getMessagesQueryKey, mergeMessages, updateMessages } from "@/api/cache/messages.cache";
import { getChatHistory } from "@/api/services/messages.service";

/** Сколько последних сообщений чата загружается при открытии. */
const CHAT_HISTORY_COUNT = 100;

/**
 * Сообщения чата по возрастанию времени.
 *
 * История запрашивается заново при каждом открытии чата и сливается с кэшем на момент ответа, а не заменяет его:
 * пока шёл запрос, в кэш могли попасть отправленные и полученные сообщения.
 */
export function useChatMessagesQuery(chatId: string) {
  return useQuery({
    queryKey: getMessagesQueryKey(chatId),
    queryFn: async ({ client }) => {
      const history = await getChatHistory(chatId, CHAT_HISTORY_COUNT);

      return updateMessages(client, chatId, (cached) => mergeMessages(cached, history));
    },
  });
}
