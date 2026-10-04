Status: COMPLETED

## Phase goal

Phase 1 — Основа: тема, шрифт, типографика, словарь. Приложение рендерится с темой, Roboto и словарём; дальше UI-фазы только пользуются этим фундаментом.

## What was implemented

- **Тема** (`src/theme/_theme.ts`): `palette`, `typography` (`fontFamily`, `fontSizes` xs–xl, `fontWeights` regular/medium), `radii`, `breakpoints.mobileMax` — значения строго по таблице токенов плана; аугментация `DefaultTheme` в том же файле (явные поля через `typeof`, без пустого `interface extends`). `avatarColors` — 7 цветов классической палитры аватаров Telegram (`#e17076` красный, `#faa774` оранжевый, `#a695e7` фиолетовый, `#7bc862` зелёный, `#6ec9cb` бирюзовый, `#65aadd` синий, `#ee7aae` розовый).
- **GlobalStyle**: box-sizing, `html, body, #root` — `height: 100dvh; margin: 0`, фон `surface`, цвет `text`, шрифт темы.
- **Typography** — один модуль: `SBaseText` (не экспортируется) + `SH1…SCaption` в `_styles.ts`; `H1` xl/500, `H2` lg/500, `H3` md/500, `B1` md/400, `B2` sm/400, `Caption` xs/400 в `_Typography.tsx`. Пропсы `color` / `textAlign` / `as` + `HTMLAttributes`; тег по умолчанию — `h1`/`h2`/`h3`/`p`. `TTextColor` = `keyof Pick<DefaultTheme["palette"], "text" | "textMuted" | "primary" | "danger" | "onPrimary" | "metaOutgoing">` — `Pick` падает при компиляции, если ключ палитры переименуют (а не union голых литералов). Цвет по умолчанию — `inherit`.
- **I18nContext** по образцу recipe-book без `_dictionary.ts` и без Mantine: пока словарь грузится и при ошибке загрузки — `return null` (виден только фон `surface`); ошибка — `console.error`; проверка `response.ok` добавлена, чтобы 404 не превращался в ошибку парсинга JSON.
- **Словарь** `public/dictionaries/ru.json` — целиком, дословно из плана; `src/types/i18n.types.ts` экспортирует только `I18n` (вложенные ветки — инлайн-объектами).
- **`_queryClient.ts`** — `refetchOnWindowFocus: false`, `retry: 1`.
- **`App.tsx`** — `QueryClientProvider` → `ReactQueryDevtools` → `ThemeProvider` → `GlobalStyle` → `I18nProvider` → `AppPlaceholder` (`<H1>{l.title}</H1>`, `useI18nSelector(({ l }) => l.app)`). Заглушка — неэкспортируемый компонент в `App.tsx`: хуку нужен потомок `I18nProvider`.
- **`main.tsx`** — Roboto `latin-400/500`, `cyrillic-400/500`; проверка `#root` с ошибкой; рендер `<App />` в `StrictMode`.

## Files created

- `src/theme/_theme.ts` — токены темы + аугментация `DefaultTheme`.
- `src/theme/_GlobalStyle.ts` — глобальные стили.
- `src/theme/index.ts` — barrel: `GlobalStyle`, `theme`.
- `src/components/Typography/_styles.ts` — `TTextColor`, `SBaseText`, стили шести начертаний.
- `src/components/Typography/_Typography.tsx` — `H1`, `H2`, `H3`, `B1`, `B2`, `Caption`.
- `src/components/Typography/index.ts` — barrel.
- `src/context/I18nContext/_context.ts` — `I18nContext`.
- `src/context/I18nContext/_I18nContext.tsx` — `I18nProvider` (загрузка `ru.json`).
- `src/context/I18nContext/_useI18nSelector.ts` — `useI18nSelector`.
- `src/context/I18nContext/index.ts` — barrel.
- `src/types/i18n.types.ts` — интерфейс `I18n`.
- `public/dictionaries/ru.json` — полный словарь всех фаз.
- `src/app/_queryClient.ts` — `QueryClient`.
- `src/app/App.tsx` — провайдеры + заглушка-заголовок.
- `plans/messenger-v1/baseline/{build.log, lint.log, README.md}` — baseline.

## Files modified

- `src/main.tsx` — импорт шрифтов Roboto, проверка `#root`, рендер `<App />`.

## Figma extraction

N/A — Figma нет; в фазе нет экранов (`Free choice` не применялся — только токены из таблицы плана). Единственное решение по своему усмотрению — конкретные hex `avatarColors` (план задал только набор оттенков): классическая палитра аватаров Telegram, перечислена выше.

## Verification

Команды — дословно из фазы / профиля:

- `pnpm format` (prettier по `src`) — все файлы без изменений; `npx prettier --check public/dictionaries/ru.json` — ок.
- `pnpm lint` — exit 0, 0 ошибок / 0 предупреждений (baseline тоже 0).
- `pnpm build` — exit 0 (`tsc -b && vite build`); шрифты latin/cyrillic 400/500 попали в `dist/assets`; `ReactQueryDevtools` в прод-бандле не найден (grep по `dist/assets/*.js` — 0).
- Ключи `ru.json` по `^[A-Za-z0-9_]+$` (node-скрипт обхода) — 0 нарушений; набор ключей совпадает с `I18n`.
- Exports: `GlobalStyle`, `theme`, `H1`, `I18nProvider`, `useI18nSelector`, `I18n`, `queryClient`, `App`, `TTextColor` (внутри модуля) — у всех есть импортёр. `H2`, `H3`, `B1`, `B2`, `Caption` в barrel без импортёра — см. Known issues.
- Phase stop condition — выполнено: lint и build зелёные; `pnpm dev` (диагностически, порт 5199) — `h1` «GREEN-API Messenger», `font-family: Roboto, …`, 24px / 500, `document.fonts.check("500 24px Roboto")` → `true`, фон body `#ffffff`. Консоль — только 404 на `/favicon.ico` (в `index.html` нет favicon; не от этой фазы). Dev-сервер остановлен, `.playwright-mcp` удалён.
- Runtime/browser — наблюдение разработчика, не доказательство; Visual Verification фазы — N/A.

## Known issues / follow-ups

- **Экспорты `H2`, `H3`, `B1`, `B2`, `Caption` без импортёра.** Оставлены сознательно: набор начертаний — контракт, который определяет сама фаза (план: «дальше UI-фазы только пользуются этим фундаментом», таблица `H1`–`Caption`), импортёры появляются с Phase 3+. По `structure.md` это исключение «символ, завершающий контракт фазы» — решать ревьюеру.
- **`TTextColor`** включает `onPrimary` и `metaOutgoing` — оба цвета плана для текста (выбранный чат — Phase 6, время исходящего — Phase 7). Это члены union, а не экспорты.
- **favicon 404** — в `index.html` нет `<link rel="icon">`, в `public/` нет `favicon.ico`; ошибка консоли в dev. Вне скоупа фазы; может помешать проверке «консоль без ошибок» в Visual Verification Phase 3/4 (`app_boots`, `messenger_boots`) — стоит решить заранее (иконка или исключение в критерии).
- Planner-drift: нет.
