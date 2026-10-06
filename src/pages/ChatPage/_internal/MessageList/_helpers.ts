import type { IMessage } from "@/types/messages.types";
import { formatDayLabel, getDayKey } from "@/utils/helpers/dateFormat";

import { EListItemKind, type TListItem } from "./_types";

/**
 * Элементы ленты из сообщений по возрастанию времени: перед первым сообщением каждого дня — разделитель с подписью дня.
 *
 * Группа — сообщения подряд от одного отправителя в пределах дня; у последнего в группе `isLastInGroup`.
 */
export function buildListItems(
  messages: IMessage[],
  now: Date,
  labels: { today: string; yesterday: string },
): TListItem[] {
  const dayKeys = messages.map(({ timestamp }) => getDayKey(timestamp));

  return messages.flatMap((message, index): TListItem[] => {
    const dayKey = dayKeys[index];
    const next = index + 1 < messages.length ? messages[index + 1] : null;
    const isLastInGroup =
      next === null || next.direction !== message.direction || dayKeys[index + 1] !== dayKey;

    const messageItem: TListItem = { kind: EListItemKind.MESSAGE, message, isLastInGroup };

    if (index > 0 && dayKeys[index - 1] === dayKey) {
      return [messageItem];
    }

    return [
      {
        kind: EListItemKind.DATE,
        key: `date-${dayKey}`,
        label: formatDayLabel(message.timestamp, now, labels),
      },
      messageItem,
    ];
  });
}
