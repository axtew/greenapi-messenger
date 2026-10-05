import { getEntries } from "@/utils/helpers/objectGetters";

import type { TFields, TFieldType, TFormStateInput, TInputs, TUseFormState } from "./_types";

interface IDefaultInputState {
  required: boolean;
  error: string | null;
  isDirty: boolean;
  validator: (value: string) => string | null;
  formatter: (value: string) => string;
}

const defaultInputState: IDefaultInputState = {
  error: null,
  required: false,
  isDirty: false,
  validator: () => null,
  formatter: (value) => value,
};

function getDefaultState<T extends TFields>(
  inputs: TInputs<T>,
  name: keyof T,
): TFormStateInput<T, keyof T> {
  const value = (() => {
    if (inputs[name] === null) return null as T[keyof T];

    switch (typeof inputs[name]) {
      case "string":
        return "" as T[keyof T];
      case "boolean":
        return false as T[keyof T];

      default:
        return "" as T[keyof T];
    }
  })();

  return {
    ...defaultInputState,
    value,
    prevValue: value,
  };
}

export function initState<T extends TFields>(inputs: TInputs<T>): TUseFormState<T> {
  const initValue: Partial<TUseFormState<T>> = {};

  getEntries(inputs).forEach(([name, inputData]) => {
    let inputState: TFormStateInput<T, keyof T> = { ...getDefaultState(inputs, name) };

    if (typeof inputData === "object" && inputData !== null) {
      inputState = {
        ...inputState,
        ...inputData,
        prevValue: inputData.value,
      };
    } else {
      inputState = {
        ...inputState,
        value: inputData as T[keyof T],
        prevValue: inputData as T[keyof T],
      };
    }

    initValue[name] = inputState;
  });

  return initValue as TUseFormState<T>;
}

export function formatValue(formatter: (value: string) => string, value: TFieldType): TFieldType {
  if (typeof value === "string") return formatter(value);

  return value;
}

export function validateValue(
  validator: (value: string) => string | null,
  value: TFieldType,
): string | null {
  if (typeof value === "string") return validator(value);

  return null;
}
