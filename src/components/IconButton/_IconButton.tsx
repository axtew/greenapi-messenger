import type { ComponentPropsWithRef } from "react";

import { SButton } from "./_styles";

interface IIconButtonProps extends Omit<ComponentPropsWithRef<"button">, "type"> {
  /** Доступное имя: у кнопки нет видимого текста, только иконка. */
  "aria-label": string;
}

/** Круглая кнопка 44×44 с иконкой: гамбургер, «назад». Иконка передаётся в `children`. */
export function IconButton(props: IIconButtonProps) {
  return <SButton type="button" {...props} />;
}
