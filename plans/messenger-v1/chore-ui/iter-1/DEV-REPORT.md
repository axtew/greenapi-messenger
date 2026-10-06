Status: COMPLETED

## Phase goal
Заход `chore-ui` вне фаз перед Phase 8 — объём по поправке плана (15): повтор при 429, `Escape` закрывает чат, ширина сайдбара `clamp(280px, 28vw, 380px)`, `:hover` у общего `Button`. Phase 8 не начиналась.

## What was implemented
1. **`retry` (Phase 3).** `isRetriable` в `src/app/_queryClient.ts` теперь повторяет и `GreenApiError` со статусом 429 (наравне со сбоем сети и 5xx); прочие статусы < 500 по-прежнему не повторяются. Правило числа попыток (`failureCount < 2`) и задержка (стандартная у TanStack Query) не менялись. JSDoc переписан под новое поведение. 429 записан литералом, как соседние 401 / 469 / 403 в коде. Тест читает правило через `queryClient.getDefaultOptions().queries.retry`, поэтому экспортировать `isRetriable` не понадобилось.
2. **`Escape` закрывает чат (Phase 6).** Отдельный `useEffect` в `_useChatPage`. Решение: отдельный хук не заводил — у `_useChatPage` уже есть `navigate`, потребитель тот же, `ChatPage`, и по лестнице `structure.md` сущность остаётся на этом уровне. Слушатель `keydown` висит на `document` и снимается в cleanup. На `Escape` выполняется `navigate({ to: routerPaths.home, replace: true })` — как у кнопки «назад». Срабатывает только при `!event.defaultPrevented && !event.isComposing`.
   - **`AccountMenu`.** Обработчик `Escape` теперь вызывает `event.preventDefault()`. Обработчик React стоит на корневом контейнере приложения, то есть при всплытии отрабатывает раньше слушателя на `document`: первый `Escape` закрывает только меню, второй — чат. Когда меню открыто, фокус уже внутри него: `focusOnMount` переводит его в выпадающий блок, а при уходе фокуса меню закрывается через `onBlur`.
   - **Панель «Новый чат» (решение).** `Escape` при фокусе внутри панели закрывает её через `closeNewChat` — фокус, как и раньше, возвращается на карандаш — и отменяет событие. Значит, при открытом рядом чате (десктоп) первый `Escape` закрывает панель, второй — чат. Обработчик — React `onKeyDown` на `SRoot` в режиме `NEW_CHAT` внутри `Sidebar`, потому что `closeNewChat` живёт там. Во время IME-ввода (`nativeEvent.isComposing`) обработчик пропускает событие. Слушатель привязан к фокусу, а не к `document`, — так же, как у меню. Следствие: если фокус вне панели (например, после клика по колонке чата), `Escape` закрывает чат, а панель остаётся открытой. Плюс такого варианта: скрытая на мобильной панель (`display: none` при открытом чате) не может перехватить `Escape`.
3. **Ширина сайдбара (Phase 4).** В `Sidebar/_styles.ts` `width: 420px` заменён на `clamp(280px, 28vw, 380px)`; правило для мобильной (`width: 100%`) не тронуто. Посчитано на 768px: сайдбар 280 + отступ 18, колонке остаётся ~470px минус padding 36. У `SColumn` по-прежнему `max-width: 880px`, она центрирована (`justify-content: center` у `SWrapper`), `min-width: 0` на месте — переполнения нет.
4. **`Button` — `:hover`.** Добавлено `&:hover:enabled { filter: brightness(0.92); }` — то же, что у FAB-карандаша. Нового токена и hex в теме нет.

## Files created
- `src/app/__tests__/_queryClient.test.ts` — unit-тесты правила повтора: сеть, 500, 503, 429 и не-GREEN-API ошибка повторяются; 400, 401, 403, 466 и `INVALID_RESPONSE` при 200 — нет; не больше двух повторов.

## Files modified
- `src/app/_queryClient.ts` — 429 повторяется, JSDoc `isRetriable`.
- `src/pages/ChatPage/_useChatPage.ts` — слушатель `Escape` на `document`, JSDoc хука.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_AccountMenu.tsx` — `preventDefault()` в обработчике `Escape`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — `Escape` закрывает панель «Новый чат», JSDoc.
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — ширина `clamp(280px, 28vw, 380px)`.
- `src/components/Button/_styles.ts` — `:hover` на активной кнопке.

## Verification
- Baseline переиспользован: `plans/messenger-v1/baseline/` (до этого захода ошибок не было).
- `pnpm format` — ok.
- `pnpm lint` — exit 0, без ошибок и предупреждений.
- `pnpm build` — exit 0.
- `pnpm test` — 13 файлов, 152 теста, все прошли (новый файл включён).
- Exports — новых экспортов нет.
- Stop condition — все четыре пункта поправки (15) сделаны, Phase 8 не тронута.
- Runtime/browser — разработчик не проверял. Для логина пришлось бы вывести `apiTokenInstance` из `.env.local` в вызовы инструментов, поэтому self-check пропущен. Порядок «React-обработчик меню или панели раньше слушателя на `document`» обоснован моделью делегирования React 17+ (обработчики на корневом контейнере), но вживую не наблюдался. Сценарии для визуальной проверки: меню открыто при открытом чате → `Esc` закрывает только меню, второй `Esc` закрывает чат; панель «Новый чат» с фокусом в поле при открытом чате → `Esc` закрывает панель, второй — чат; ширина сайдбара на 768 / 1280 / 1600px; `:hover` у «Найти» и у кнопки входа.
- `.playwright-mcp` не появлялся, dev-сервер не запускался.

## Known issues
- `RATE_LIMITED` (лимит в теле ответа 200, только у `checkAccount`) правилом `retry` по-прежнему не повторяется. Это мутация, а у мутаций повтора по умолчанию нет; вне объёма поправки.
- В рабочем дереве есть изменения не из этого захода: `BACKLOG.md` (новый пункт владельца) и `plans/messenger-v1/EXECUTION.md`. `src/pages/ChatPage/_internal/MessageList/_constants.ts` попадает в `git status`, но содержательного diff у него нет — только перезапись при `pnpm format`.
