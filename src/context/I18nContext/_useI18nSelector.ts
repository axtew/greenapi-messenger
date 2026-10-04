import { useContext } from "react";

import type { I18n } from "@/types/i18n.types";

import { I18nContext } from "./_context";

/** Возвращает узкий срез словаря, нужный компоненту. */
export function useI18nSelector<T>(selector: (args: { l: I18n }) => T): T {
  const l = useContext(I18nContext);

  if (l === null) {
    throw new Error("useI18nSelector вызван вне I18nProvider");
  }

  return selector({ l });
}
