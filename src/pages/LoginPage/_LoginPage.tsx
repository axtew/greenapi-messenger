import { Input } from "@/components/Input";
import { B2, H1 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { SCard, SForm, SHeader, SNotice, SSubmit, SWrapper } from "./_styles";
import { useLoginForm } from "./_useLoginForm";

/** Экран входа по `idInstance` и `apiTokenInstance` инстанса GREEN-API. */
export function LoginPage() {
  const l = useI18nSelector(({ l }) => l.login);

  const { form, isSubmitDisabled, isSessionExpired, submitError, onChange, onSubmit } =
    useLoginForm();

  return (
    <SWrapper>
      <SCard>
        {isSessionExpired && (
          <SNotice role="alert">
            <B2 color="danger">{l.sessionExpired}</B2>
          </SNotice>
        )}

        <SHeader>
          <H1 textAlign="center">{l.title}</H1>
          <B2 color="textMuted" textAlign="center">
            {l.subtitle}
          </B2>
        </SHeader>

        <SForm onSubmit={onSubmit} noValidate>
          <Input
            label={l.idInstanceLabel}
            error={form.idInstance.error}
            name="idInstance"
            inputMode="numeric"
            autoComplete="off"
            value={form.idInstance.value}
            onChange={onChange}
          />

          <Input
            label={l.apiTokenLabel}
            error={form.apiTokenInstance.error}
            name="apiTokenInstance"
            type="password"
            autoComplete="off"
            value={form.apiTokenInstance.value}
            onChange={onChange}
          />

          <SSubmit type="submit" disabled={isSubmitDisabled}>
            {l.submitButton}
          </SSubmit>

          {submitError !== null && (
            <B2 role="alert" color="danger">
              {submitError}
            </B2>
          )}
        </SForm>
      </SCard>
    </SWrapper>
  );
}
