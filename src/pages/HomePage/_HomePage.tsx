import { H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { SPill, SWrapper } from "./_styles";

/** Экран индексного роута: пустое состояние правой колонки, пока чат не выбран. */
export function HomePage() {
  const l = useI18nSelector(({ l }) => l.chat);

  return (
    <SWrapper>
      <SPill>
        <H3 as="p" color="onPrimary" textAlign="center">
          {l.selectChat}
        </H3>
      </SPill>
    </SWrapper>
  );
}
