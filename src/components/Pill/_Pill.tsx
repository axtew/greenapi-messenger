import { H3 } from "@/components/Typography";

import { SRoot } from "./_styles";

interface IPillProps {
  children: string;
}

/** Зелёная плашка с белым текстом поверх фона переписки: разделитель дат, пустые состояния. */
export function Pill({ children }: IPillProps) {
  return (
    <SRoot>
      <H3 as="p" color="onPrimary" textAlign="center">
        {children}
      </H3>
    </SRoot>
  );
}
