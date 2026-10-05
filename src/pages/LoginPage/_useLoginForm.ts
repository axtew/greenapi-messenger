import { useNavigate, useSearch } from "@tanstack/react-router";

import { EGreenApiErrorKind, GreenApiError } from "@/api/greenApi";
import { InstanceNotAuthorizedError, useLoginMutation } from "@/api/mutations/session.mutations";
import { ESignOutReason } from "@/api/session";
import { useI18nSelector } from "@/context/I18nContext";
import { useForm } from "@/hooks/useForm";
import { routerPaths } from "@/routes/_paths";
import type { I18n } from "@/types/i18n.types";

type TLoginFields = {
  idInstance: string;
  apiTokenInstance: string;
};

const trim = (value: string): string => value.trim();

/** Текст ошибки входа под формой. */
function getSubmitErrorText(error: Error, l: I18n["login"]): string {
  if (error instanceof InstanceNotAuthorizedError) {
    return l.notAuthorizedError;
  }

  if (
    error instanceof GreenApiError &&
    error.kind === EGreenApiErrorKind.HTTP &&
    (error.status === 401 || error.status === 403)
  ) {
    return l.unauthorizedError;
  }

  return l.networkError;
}

/** Форма входа: поля с проверкой, отправка через мутацию входа и переход на главную после успеха. */
export function useLoginForm() {
  const l = useI18nSelector(({ l }) => l.login);

  const { reason } = useSearch({ from: routerPaths.login });
  const navigate = useNavigate();

  const { mutateAsync, error } = useLoginMutation();

  // Проверка получает значение до обрезки пробелов, поэтому обрезает его сама.
  const { form, disabled, isPending, onChange, onSubmit } = useForm<TLoginFields>(
    {
      idInstance: {
        value: "",
        required: true,
        formatter: trim,
        validator: (value) => {
          const trimmed = value.trim();

          if (trimmed === "") {
            return l.requiredError;
          }

          return /^\d+$/.test(trimmed) ? null : l.idInstanceError;
        },
      },
      apiTokenInstance: {
        value: "",
        required: true,
        formatter: trim,
        validator: (value) => (value.trim() === "" ? l.requiredError : null),
      },
    },
    async ({ idInstance, apiTokenInstance }) => {
      await mutateAsync({
        idInstance: idInstance.value,
        apiTokenInstance: apiTokenInstance.value,
      });
      await navigate({ to: routerPaths.home });
    },
  );

  return {
    form,
    isSubmitDisabled: disabled || isPending,
    isSessionExpired: reason === ESignOutReason.EXPIRED,
    submitError: error === null ? null : getSubmitErrorText(error, l),
    onChange,
    onSubmit,
  };
}
