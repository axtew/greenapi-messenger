import { useEffect, useLayoutEffect, useRef } from "react";

import { EMessageDirection, EMessageStatus, type IMessage } from "@/types/messages.types";

/** На каком расстоянии от низа ленты пользователь считается «внизу». */
const NEAR_BOTTOM_THRESHOLD_PX = 80;

/**
 * Удерживает ленту внизу: при первом получении сообщений прокручивает к последнему, при любом изменении сообщений —
 * если пользователь был у низа ленты, а при появлении нового своего, ещё не отправленного — в любом случае.
 * Читающего старые сообщения не сдвигает.
 *
 * «Любое изменение», а не только рост числа: пузырь меняет высоту и без новых сообщений — например, при недоставке
 * под текстом появляется причина, и на узком экране она переносится на новую строку.
 *
 * Положение «у низа» запоминается при прокрутке: после рендера высота ленты уже включает новые сообщения.
 *
 * Лента у низа остаётся у низа и при изменении высоты самой ленты — когда растёт поле ввода под ней или меняется окно:
 * иначе при той же `scrollTop` последние сообщения уходили бы под поле.
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

    if (prevCount === null || isNearBottomRef.current || (hasGrown && isOwnSending)) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;

    if (container === null) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

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
