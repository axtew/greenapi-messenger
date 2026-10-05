import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";

import { getSession } from "@/api/session";
import { MessengerLayout } from "@/layouts/MessengerLayout";

import { routerPaths } from "./_paths";
import { createCommonRoutes, createProtectedRoutes } from "./_routes";

const rootRoute = createRootRoute();

/**
 * Pathless layout-роут защищённой части: не добавляет сегмент в URL, рендерит каркас мессенджера
 * и пускает к детям только при наличии сессии — без неё `beforeLoad` уводит на вход до рендера.
 */
const protectedLayoutRoute = createRoute({
  id: "protected-layout",
  getParentRoute: () => rootRoute,
  beforeLoad: () => {
    if (getSession() === null) {
      throw redirect({ to: routerPaths.login });
    }
  },
  component: MessengerLayout,
});

const routeTree = rootRoute.addChildren([
  ...createCommonRoutes(rootRoute),
  protectedLayoutRoute.addChildren(createProtectedRoutes(protectedLayoutRoute)),
]);

export const router = createRouter({ routeTree });
