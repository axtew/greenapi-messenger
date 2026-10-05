import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "styled-components";

import { I18nProvider } from "@/context/I18nContext";
import { router } from "@/routes/AppRouter";
import { GlobalStyle, theme } from "@/theme";

import { queryClient } from "./_queryClient";

/** Композиция приложения: кэш запросов, тема, глобальные стили, словарь и роутер. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />

      <ThemeProvider theme={theme}>
        <GlobalStyle />

        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
