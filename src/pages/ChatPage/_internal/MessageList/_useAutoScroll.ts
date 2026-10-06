import { useLayoutEffect, useRef } from "react";

import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

/** На каком расстоянии от низа ленты пользователь считается «внизу». */
const NEAR_BOTTOM_THRESHOLD_PX = 80;

/**
 * Удерживает ленту внизу: при первом получении сообщений прокручивает к последнему, при появлении новых — только если
 * пользователь был у низа ленты или новое сообщение — своё, ещё не отправленное. Читающего старые сообщения не сдвигает.
 *
 * Положение «у низа» запоминается при прокрутке: после рендера высота ленты уже включает новые сообщения.
 */
export function useAutoScroll(messages: IMessage[] | undefined) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevCountRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (messages === undefined || container === null) {
      return;
    }

    const prevCount = prevCountRef.current;
    prevCountRef.current = messages.length;

    const last = messages.at(-1);
    const isOwnSending =
      last !== undefined &&
      last.direction === EMessageDirection.OUTGOING &&
      last.status === EMessageStatus.SENDING;
    const hasGrown = prevCount !== null && messages.length > prevCount;

    if (prevCount === null || (hasGrown && (isNearBottomRef.current || isOwnSending))) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const container = containerRef.current;

    if (container !== null) {
      isNearBottomRef.current =
        container.scrollHeight - container.scrollTop - container.clientHeight <=
        NEAR_BOTTOM_THRESHOLD_PX;
    }
  };

  return { containerRef, handleScroll };
}
