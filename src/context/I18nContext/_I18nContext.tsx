import { type ReactNode, useEffect, useState } from "react";

import type { I18n } from "@/types/i18n.types";

import { I18nContext } from "./_context";

interface IProps {
  children: ReactNode;
}

/**
 * Загружает словарь `public/dictionaries/ru.json` и раздаёт его дереву через контекст.
 *
 * Пока словарь не загружен, дерево не рендерится — виден только фон страницы. Ошибка загрузки
 * пишется в консоль и оставляет тот же пустой экран: словарь — статический файл того же origin,
 * его недоступность означает, что недоступно и само приложение.
 */
export function I18nProvider({ children }: IProps) {
  const [dictionary, setDictionary] = useState<I18n | null>(null);

  useEffect(() => {
    let isCancelled = false;

    fetch("/dictionaries/ru.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Приведение без рантайм-проверки: словарь — собственный статический файл приложения,
        // его форму задаёт интерфейс I18n, внешних данных здесь нет.
        return response.json() as Promise<I18n>;
      })
      .then((data) => {
        if (!isCancelled) {
          setDictionary(data);
        }
      })
      .catch((error: unknown) => {
        console.error("Не удалось загрузить словарь", error);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (dictionary === null) {
    return null;
  }

  return <I18nContext.Provider value={dictionary}>{children}</I18nContext.Provider>;
}
