// Импорт делает файл модулем: без него `declare module` ниже заменил бы типы пакета, а не дополнил их.
import "@tanstack/react-query";

/** Метаданные мутаций, которые читает общий обработчик ошибок. */
type TMutationMeta = {
  /** Ответ 401 этой мутации — не истёкшая сессия, а ошибка, которую показывает сам экран (неверные креды при входе). */
  skipUnauthorizedRedirect?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: TMutationMeta;
  }
}
