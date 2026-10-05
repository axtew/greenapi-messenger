import { type InputHTMLAttributes, useId } from "react";

import { Caption } from "@/components/Typography";

import { SField, SInput } from "./_styles";

interface IInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Видимая подпись поля. */
  label: string;
  /** Текст ошибки под полем; `null` — ошибки нет. */
  error: string | null;
}

/**
 * Текстовое поле с подписью и ошибкой.
 *
 * Ошибка лежит вне `<label>` и связана с полем через `aria-describedby`, поэтому не входит в доступное имя поля,
 * а зачитывается как его описание.
 */
export function Input({ label, error, ...rest }: IInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = error !== null;

  return (
    <SField>
      <label htmlFor={id}>
        <Caption as="span" color="textMuted">
          {label}
        </Caption>
      </label>
      <SInput
        {...rest}
        id={id}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
      />
      {hasError && (
        <Caption id={errorId} color="danger">
          {error}
        </Caption>
      )}
    </SField>
  );
}
