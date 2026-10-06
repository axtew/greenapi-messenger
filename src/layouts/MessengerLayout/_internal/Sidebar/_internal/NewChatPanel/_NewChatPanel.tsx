import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { BackIcon } from "@/components/icons";
import { Input } from "@/components/Input";
import { B2, H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { SHeader } from "../../_styles";
import { SForm } from "./_styles";
import { useNewChatForm } from "./_useNewChatForm";

interface INewChatPanelProps {
  /** Закрывает панель и возвращает список чатов. */
  onClose: () => void;
}

/** Вид левой панели «Новый чат»: поиск собеседника по номеру телефона. */
export function NewChatPanel({ onClose }: INewChatPanelProps) {
  const l = useI18nSelector(({ l }) => l.newChat);
  const { form, isSubmitDisabled, submitError, onChange, onSubmit } = useNewChatForm(onClose);

  return (
    <>
      <SHeader>
        <IconButton aria-label={l.backButton} onClick={onClose}>
          <BackIcon />
        </IconButton>
        <H3 as="h2">{l.title}</H3>
      </SHeader>

      <SForm onSubmit={onSubmit} noValidate>
        <Input
          label={l.phoneLabel}
          error={form.phone.error}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={l.phonePlaceholder}
          value={form.phone.value}
          onChange={onChange}
          autoFocus
        />

        <Button type="submit" disabled={isSubmitDisabled}>
          {l.submitButton}
        </Button>

        {submitError !== null && (
          <B2 role="alert" color="danger">
            {submitError}
          </B2>
        )}
      </SForm>
    </>
  );
}
