import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "styled-components";

import { H1 } from "@/components/Typography";
import { I18nProvider, useI18nSelector } from "@/context/I18nContext";
import { GlobalStyle, theme } from "@/theme";

import { queryClient } from "./_queryClient";

function AppPlaceholder() {
  const l = useI18nSelector(({ l }) => l.app);

  return <H1>{l.title}</H1>;
}

/** Композиция приложения: кэш запросов, тема, глобальные стили и словарь. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools />

      <ThemeProvider theme={theme}>
        <GlobalStyle />

        <I18nProvider>
          <AppPlaceholder />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
