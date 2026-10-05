/** Пути всех роутов одним объектом — компоненты не пишут строковые литералы путей. */
export const routerPaths = {
  login: "/login",
  home: "/",
  chat: "/chat/$chatId",
} as const;
