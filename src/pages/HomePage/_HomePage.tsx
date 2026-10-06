import { Pill } from "@/components/Pill";
import { useI18nSelector } from "@/context/I18nContext";

import { SWrapper } from "./_styles";

/** Экран индексного роута: пустое состояние правой колонки, пока чат не выбран. */
export function HomePage() {
  const l = useI18nSelector(({ l }) => l.chat);

  return (
    <SWrapper>
      <Pill>{l.selectChat}</Pill>
    </SWrapper>
  );
}
