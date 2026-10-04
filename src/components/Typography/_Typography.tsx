import type { CSSProperties, ElementType, HTMLAttributes } from "react";

import { SB1, SB2, SCaption, SH1, SH3, type TTextColor } from "./_styles";

interface ITypographyProps extends HTMLAttributes<HTMLElement> {
  color?: TTextColor;
  textAlign?: CSSProperties["textAlign"];
  /** Тег вместо стандартного — например, `span` внутри кнопки или строки списка. */
  as?: ElementType;
}

export function H1({ as = "h1", color, textAlign, ...rest }: ITypographyProps) {
  return <SH1 as={as} $color={color} $textAlign={textAlign} {...rest} />;
}

export function H3({ as = "h3", color, textAlign, ...rest }: ITypographyProps) {
  return <SH3 as={as} $color={color} $textAlign={textAlign} {...rest} />;
}

export function B1({ as = "p", color, textAlign, ...rest }: ITypographyProps) {
  return <SB1 as={as} $color={color} $textAlign={textAlign} {...rest} />;
}

export function B2({ as = "p", color, textAlign, ...rest }: ITypographyProps) {
  return <SB2 as={as} $color={color} $textAlign={textAlign} {...rest} />;
}

export function Caption({ as = "p", color, textAlign, ...rest }: ITypographyProps) {
  return <SCaption as={as} $color={color} $textAlign={textAlign} {...rest} />;
}
