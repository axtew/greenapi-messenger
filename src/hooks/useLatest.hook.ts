import { type RefObject, useLayoutEffect, useRef } from "react";

/**
 * Хук для использования React-данных в коллбэках без ререндеров с помощью RefObject
 *
 * @param {T} value - Значение
 * @returns {RefObject<T>} Реф с данными
 */
export function useLatest<T>(value: T): RefObject<T> {
  const latest = useRef(value);

  useLayoutEffect(() => {
    latest.current = value;
  }, [value]);

  return latest;
}
