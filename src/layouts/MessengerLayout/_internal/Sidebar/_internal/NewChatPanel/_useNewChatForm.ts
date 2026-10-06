import { useNavigate } from "@tanstack/react-router";

import { useCreateChatMutation } from "@/api/mutations/chats.mutations";
import { useI18nSelector } from "@/context/I18nContext";
import { useForm } from "@/hooks/useForm";
import { routerPaths } from "@/routes/_paths";

import { getSubmitErrorText, normalizePhone, validatePhone } from "./_helpers";

type TNewChatFields = {
  phone: string;
};

/**
 * Форма нового чата: номер с проверкой, создание чата через мутацию и переход в него.
 *
 * `onCreated` вызывается после перехода — панель закрывается уже на экране нового чата.
 */
export function useNewChatForm(onCreated: () => void) {
  const l = useI18nSelector(({ l }) => l.newChat);
  const navigate = useNavigate();

  const { mutateAsync, error } = useCreateChatMutation();

  const { form, disabled, isPending, onChange, onSubmit } = useForm<TNewChatFields>(
    {
      phone: {
        value: "",
        required: true,
        validator: (value) => validatePhone(value, l),
      },
    },
    async ({ phone }) => {
      const chatId = await mutateAsync(normalizePhone(phone.value));
      await navigate({ to: routerPaths.chat, params: { chatId } });
      onCreated();
    },
  );

  return {
    form,
    isSubmitDisabled: disabled || isPending,
    submitError: error === null ? null : getSubmitErrorText(error, l),
    onChange,
    onSubmit,
  };
}
