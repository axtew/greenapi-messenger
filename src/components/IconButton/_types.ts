import type { ComponentPropsWithRef } from "react";

/** `ghost` — прозрачная, серая иконка; `primary` — заливка основным цветом. */
export type TIconButtonVariant = "ghost" | "primary";

/** `md` — 44×44, `lg` — 56×56 (плавающая кнопка). */
export type TIconButtonSize = "md" | "lg";

export interface IIconButtonProps extends Omit<ComponentPropsWithRef<"button">, "type"> {
  /** Доступное имя: у кнопки нет видимого текста, только иконка. */
  "aria-label": string;
  /** `submit` — кнопка отправки формы; по умолчанию `button`. */
  type?: "button" | "submit";
  /** По умолчанию `ghost`. */
  variant?: TIconButtonVariant;
  /** По умолчанию `md`. */
  size?: TIconButtonSize;
}
