import type { ComponentPropsWithRef } from "react";

import { H3 } from "@/components/Typography";

import { SButton } from "./_styles";

interface IButtonProps extends ComponentPropsWithRef<"button"> {
  children: string;
}

/** Основная кнопка формы: заливка `primary`, текст в стиле `H3`. */
export function Button({ children, ...rest }: IButtonProps) {
  return (
    <SButton {...rest}>
      <H3 as="span">{children}</H3>
    </SButton>
  );
}
