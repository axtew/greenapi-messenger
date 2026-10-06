import { useChatMessagesQuery } from "@/api/queries/messages.queries";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { Skeleton } from "@/components/Skeleton";
import { B1 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { buildListItems } from "./_helpers";
import { MessageBubble } from "./_internal/MessageBubble";
import { SCentered, SContent, SDateRow, SError, SScroller, SSkeletonRow } from "./_styles";
import { EListItemKind, type IMessageListProps } from "./_types";
import { useAutoScroll } from "./_useAutoScroll";

/** Плейсхолдеры пузырей на время первой загрузки: ширина и сторона каждого. */
const SKELETON_BUBBLES = [
  { width: "45%", isOutgoing: false },
  { width: "60%", isOutgoing: true },
  { width: "35%", isOutgoing: false },
];

/**
 * Лента переписки: сообщения по дням с разделителями дат, прокрученная к последнему сообщению.
 *
 * Пока история не загружена — плейсхолдеры пузырей; не загрузилась — ошибка с повтором. Ошибка обновления
 * при уже показанных сообщениях не показывается: лента остаётся с тем, что есть.
 */
export function MessageList({ chatId }: IMessageListProps) {
  const l = useI18nSelector(({ l }) => l.chat);

  const { data: messages, isError, isFetching, refetch } = useChatMessagesQuery(chatId);
  const { containerRef, handleScroll } = useAutoScroll(messages);

  const isFailed = messages === undefined && isError && !isFetching;
  const items =
    messages === undefined
      ? []
      : buildListItems(messages, new Date(), { today: l.today, yesterday: l.yesterday });

  return (
    <SScroller ref={containerRef} onScroll={handleScroll}>
      <SContent>
        {isFailed && (
          <SCentered>
            <SError>
              <B1 role="alert" textAlign="center">
                {l.historyError}
              </B1>
              <Button type="button" onClick={() => refetch()}>
                {l.retryButton}
              </Button>
            </SError>
          </SCentered>
        )}

        {messages === undefined &&
          !isFailed &&
          SKELETON_BUBBLES.map(({ width, isOutgoing }, index) => (
            <SSkeletonRow key={index} $isOutgoing={isOutgoing}>
              <Skeleton width={width} height="36px" />
            </SSkeletonRow>
          ))}

        {messages !== undefined && messages.length === 0 && (
          <SCentered>
            <Pill>{l.emptyHistory}</Pill>
          </SCentered>
        )}

        {items.map((item) =>
          item.kind === EListItemKind.DATE ? (
            <SDateRow key={item.key}>
              <Pill>{item.label}</Pill>
            </SDateRow>
          ) : (
            <MessageBubble
              key={item.message.id}
              message={item.message}
              isLastInGroup={item.isLastInGroup}
            />
          ),
        )}
      </SContent>
    </SScroller>
  );
}
