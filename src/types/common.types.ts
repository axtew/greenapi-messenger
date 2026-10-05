import type { Dispatch, SetStateAction } from "react";

/** Сеттер `useState` — короткое имя вместо `Dispatch<SetStateAction<T>>`. */
export type TSetState<T> = Dispatch<SetStateAction<T>>;
