import type { Dispatch, SetStateAction } from "react";

/** Сеттер `useState` — короткое имя вместо `Dispatch<SetStateAction<T>>`. */
export type TSetState<T> = Dispatch<SetStateAction<T>>;

/** Значения `KeyboardEvent.key`, которые проверяет код. */
export enum EKeyboardKey {
  ESCAPE = "Escape",
}
