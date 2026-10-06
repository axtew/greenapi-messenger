import { IconButton } from "@/components/IconButton";
import { SendIcon } from "@/components/icons";
import { useI18nSelector } from "@/context/I18nContext";

import { SForm, STextarea } from "./_styles";
import { useComposer } from "./_useComposer";

/** Предел длины текста одного сообщения в GREEN-API. */
const MAX_MESSAGE_LENGTH = 4096;

interface IComposerProps {
  chatId: string;
}

/**
 * Поле ввода сообщения с кнопкой отправки; кнопка неактивна, пока текст пустой или история чата не загружена.
 *
 * Нажатие на кнопку мышью или пальцем не забирает фокус у поля: на телефоне клавиатура не закрывается между сообщениями.
 */
export function Composer({ chatId }: IComposerProps) {
  const l = useI18nSelector(({ l }) => ({
    composerPlaceholder: l.chat.composerPlaceholder,
    sendButton: l.chat.sendButton,
  }));

  const { text, textareaRef, canSend, onChange, onKeyDown, onSubmit } = useComposer(chatId);

  return (
    <SForm onSubmit={onSubmit}>
      <STextarea
        ref={textareaRef}
        rows={1}
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={l.composerPlaceholder}
        aria-label={l.composerPlaceholder}
        enterKeyHint="send"
        onChange={onChange}
        onKeyDown={onKeyDown}
      />

      <IconButton
        type="submit"
        variant="primary"
        aria-label={l.sendButton}
        disabled={!canSend}
        onMouseDown={(event) => event.preventDefault()}
      >
        <SendIcon />
      </IconButton>
    </SForm>
  );
}
