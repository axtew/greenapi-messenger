import type { ChangeEvent, SubmitEvent } from "react";

import type { TSetState } from "@/types/common.types";

export type TFieldType = string | number | boolean | null;

// NOTE: прокидывать доп обвязку через meta или вроде того
export type TFields = { [K: string]: TFieldType };

type TFormInput<T extends TFields, K extends keyof T> = {
  value: T[K];
  required?: boolean;
  error?: string | null;
  validator?: (value: string) => string | null;
  formatter?: (value: string) => string;
};

export type TInputs<T extends TFields> = { [K in keyof T]: TFieldType | TFormInput<T, K> };

export type TFormStateInput<T extends TFields, K extends keyof T> = {
  value: T[K];
  prevValue: T[K];
  required: boolean;
  error: string | null;
  isDirty: boolean;
  validator: (value: string) => string | null;
  formatter: (value: string) => string;
};

export type TUseFormState<T extends TFields> = {
  [K in keyof T]: TFormStateInput<T, K>;
};

export type TSubmitHandler<T extends TFields> = (
  form: TUseFormState<T>,
  setForm?: TSetState<TUseFormState<T>>,
) => Promise<void>;

export interface IUseFormReturn<T extends TFields> {
  form: TUseFormState<T>;
  disabled: boolean;
  isPending: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  updateFieldValue: (name: keyof T, value: T[keyof T], updatePrevValue?: boolean) => void;
  updateFieldError: (name: keyof T, error: string | null) => void;
  onSubmit: (e?: SubmitEvent<HTMLFormElement>) => Promise<void>;
}
