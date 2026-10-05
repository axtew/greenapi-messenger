import { createGlobalStyle } from "styled-components";

/** Базовый сброс отступов, высота корня во весь экран, фон и шрифт по умолчанию — в том числе у полей и кнопок. */
export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100dvh;
    margin: 0;
  }

  body {
    background: ${({ theme }) => theme.palette.surface};
    color: ${({ theme }) => theme.palette.text};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    -webkit-font-smoothing: antialiased;
  }

  /* Браузер задаёт полям и кнопкам собственный системный шрифт вместо унаследованного. */
  button, input, textarea {
    font: inherit;
  }
`;
