import {
  type ChangeEvent,
  type KeyboardEvent,
  type SubmitEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { useSendMessageMutation } from "@/api/mutations/messages.mutations";
import { useChatMessagesQuery } from "@/api/queries/messages.queries";
import { EKeyboardKey } from "@/types/common.types";

import { getMessageToSend } from "./_helpers";

/**
 * Поле ввода сообщения: текст, высота по содержимому и отправка.
 *
 * Enter отправляет, Shift+Enter переносит строку. Пустой после обрезки пробелов текст не отправляется, как и любой текст,
 * пока история чата не загружена — у запроса ленты ещё нет данных (первая загрузка идёт или упала); набирать при этом
 * можно. Неудачный поздний перезапрос, когда данные уже есть, отправку не блокирует: лента видна, хотя `isSuccess`
 * у запроса тогда `false`. Состояние истории берётся из того же запроса, что у ленты: второго запроса нет. Поле
 * не блокируется на время отправки: после отправки оно очищается и остаётся в фокусе, следующее сообщение можно
 * писать сразу.
 *
 * Во время IME-ввода (`isComposing`) клавиша принадлежит вводу: Enter не отправляет.
 */
export function useComposer(chatId: string) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate } = useSendMessageMutation(chatId);
  const { data } = useChatMessagesQuery(chatId);
  const isHistoryLoaded = data !== undefined;

  const message = getMessageToSend(text, isHistoryLoaded);
  const canSend = message !== null;

  // Высота по содержимому: сброс до `auto` нужен, чтобы `scrollHeight` уменьшался при удалении строк. Потолок — `max-height` в стилях.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (textarea !== null) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const send = () => {
    if (message === null) {
      return;
    }

    mutate(message);
    setText("");
    textareaRef.current?.focus();
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === EKeyboardKey.ENTER && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  return { text, textareaRef, canSend, onChange, onKeyDown, onSubmit };
}
