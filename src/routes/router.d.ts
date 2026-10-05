import type { router } from "./AppRouter";

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
