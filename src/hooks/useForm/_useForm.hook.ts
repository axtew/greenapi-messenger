import {
  type ChangeEvent,
  type SubmitEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLatest } from "../useLatest.hook";
import { formatValue, initState, validateValue } from "./_helpers";
import type { IUseFormReturn, TFields, TInputs, TSubmitHandler, TUseFormState } from "./_types";

/**
 * Состояние формы: значения полей, ошибки, dirty-флаги, отправка и автосохранение.
 *
 * Общий хук форм автора, переиспользуется между проектами; известные ограничения отмечены FIXME.
 *
 * `resetOn` — значение, при смене которого форма возвращается к начальным
 * `inputs` (например, id редактируемой сущности).
 */
export function useForm<T extends TFields>(
  inputs: TInputs<T>,
  submitHandler?: TSubmitHandler<T>,
  saveOnChange?: boolean,
  resetOn?: unknown,
): IUseFormReturn<T> {
  const [isPending, setIsPending] = useState(false);
  const [form, setForm] = useState<TUseFormState<T>>(() => initState(inputs));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestForm = useLatest(form);

  // Сравнение во время рендера, а не в эффекте — так React рекомендует
  // подстраивать состояние под смену пропа: перезапускается только этот
  // компонент, до коммита и до рендера детей.
  const [prevResetOn, setPrevResetOn] = useState(resetOn);
  if (resetOn !== prevResetOn) {
    setPrevResetOn(resetOn);
    setForm(initState(inputs));
  }

  const isValid = useMemo((): boolean => {
    const haveErrors = Object.keys(form).some((key) => {
      const value = form[key].value;
      return form[key].error !== null || (form[key].required && (value === null || value === ""));
    });

    return !haveErrors;
  }, [form]);

  const isDirty = useMemo((): boolean => {
    // FIXME: общий isDirty сравнивает value с prevValue по каждому полю заново,
    // а у поля есть собственный флаг isDirty, который выставляет updateFieldValue —
    // они могут разойтись: updateFieldError сбрасывает isDirty только у своего
    // поля и не трогает этот общий расчёт.
    return Object.keys(form).some((key) => form[key].value !== form[key].prevValue);
  }, [form]);

  const updateFieldValue = useCallback(
    (name: keyof T, newValue: T[keyof T], updatePrevValue = false) => {
      const { value, validator, formatter } = latestForm.current[name];

      if (value !== newValue) {
        setForm((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            // FIXME: validator получает сырое newValue, а в состояние записывается
            // уже прогнанное через formatter значение — если formatter меняет
            // содержимое (например, обрезает пробелы), проверяется не то, что в
            // итоге останется в поле.
            value: formatValue(formatter, newValue),
            error: validateValue(validator, newValue),
            prevValue: updatePrevValue ? formatValue(formatter, newValue) : prev[name].prevValue,
            isDirty: !updatePrevValue && newValue !== prev[name].prevValue,
          },
        }));
      }
    },
    [latestForm],
  );

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
      const {
        target: { name, value },
      } = event;

      const inputName = (name as keyof T) || null;

      if (!inputName) {
        throw new Error("useForm onChange: input doesn't have a name");
      }

      if (latestForm.current[inputName] === undefined) {
        throw new Error("useForm onChange: no field with given name");
      }

      updateFieldValue(inputName, value as T[keyof T]);
    },
    [updateFieldValue, latestForm],
  );

  const updateFieldError = useCallback(
    (name: keyof T, error: string | null) => {
      if (latestForm.current[name].error !== error)
        setForm((prev) => ({ ...prev, [name]: { ...prev[name], isDirty: false, error } }));
    },
    [latestForm],
  );

  const updatePrevValues = useCallback(() => {
    setForm((prev) => initState(prev));
  }, []);

  const onSubmit = useCallback(
    async (e?: SubmitEvent<HTMLFormElement>) => {
      e?.preventDefault();

      // FIXME: нетронутую форму отправить нельзя — отправка молча ничего не
      // делает, пока ни одно поле не менялось (isDirty === false), даже если
      // submitHandler имело бы смысл вызвать осознанно (например, повторная
      // отправка того же значения после сбоя сети).
      if (!isValid || !isDirty) return;

      if (submitHandler) {
        setIsPending(true);

        try {
          await submitHandler(latestForm.current, setForm);
          updatePrevValues();
        } catch {
          // Обработчик кидает при неудаче (так делает mutateAsync); показать
          // ошибку — забота вызывающего (общий MutationCache или onError
          // мутации), здесь достаточно не запирать форму для повтора.
        } finally {
          setIsPending(false);
        }
      }
    },
    [submitHandler, isValid, isDirty, latestForm, updatePrevValues],
  );

  useEffect(() => {
    if (!saveOnChange || !isValid || !isDirty) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      // FIXME: правки, внесённые пока идёт автосохранение, после его
      // завершения помечаются сохранёнными — onSubmit фиксирует prevValue
      // всех полей разом, и если пользователь успел изменить поле во время
      // запроса, это изменение молча теряет флаг isDirty.
      await onSubmit();

      timeoutRef.current = null;
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // onSubmit намеренно не в зависимостях: он меняется вместе с submitHandler,
    // а таймер должен перезапускаться только от смены самих полей формы.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveOnChange, isValid, isDirty, form]);

  return {
    form,
    disabled: !isValid || !isDirty,
    isPending,
    onChange,
    updateFieldValue,
    updateFieldError,
    onSubmit,
  };
}
