import { type AnyRoute, createRoute, redirect } from "@tanstack/react-router";

import { ESignOutReason, getSession } from "@/api/session";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";

import { routerPaths } from "./_paths";

interface ILoginSearch {
  /** Почему пользователя вывели на экран входа; нет — обычный вход. */
  reason?: ESignOutReason;
}

function isSignOutReason(value: unknown): value is ESignOutReason {
  return Object.values(ESignOutReason).some((reason) => reason === value);
}

/**
 * Роуты вне защищённой части — сейчас только вход.
 *
 * Принимают корневой роут параметром, а не импортируют его из `AppRouter.tsx`: тот сам собирает дерево
 * из этого модуля, и обратный импорт дал бы циклическую зависимость между двумя файлами.
 */
export function createCommonRoutes<TRoot extends AnyRoute>(rootRoute: TRoot) {
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: routerPaths.login,
    validateSearch: (search: Record<string, unknown>): ILoginSearch =>
      isSignOutReason(search.reason) ? { reason: search.reason } : {},
    beforeLoad: () => {
      if (getSession() !== null) {
        throw redirect({ to: routerPaths.home });
      }
    },
    component: LoginPage,
  });

  return [loginRoute] as const;
}

/** Роуты защищённой части — дети layout-роута с проверкой сессии в `beforeLoad`. */
export function createProtectedRoutes<TLayout extends AnyRoute>(protectedLayoutRoute: TLayout) {
  const homeRoute = createRoute({
    getParentRoute: () => protectedLayoutRoute,
    path: routerPaths.home,
    component: HomePage,
  });

  return [homeRoute] as const;
}
