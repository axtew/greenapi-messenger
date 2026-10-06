import { SButton } from "./_styles";
import type { IIconButtonProps } from "./_types";

/** Круглая кнопка с иконкой: гамбургер, «назад», отправка сообщения, новый чат. Иконка передаётся в `children`. */
export function IconButton({
  type = "button",
  variant = "ghost",
  size = "md",
  ...rest
}: IIconButtonProps) {
  return <SButton type={type} $variant={variant} $size={size} {...rest} />;
}
