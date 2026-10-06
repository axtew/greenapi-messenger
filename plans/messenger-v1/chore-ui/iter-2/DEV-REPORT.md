Status: COMPLETED

## Phase goal
Заход `chore-ui` вне фаз, FIX iteration 2: исправить замечания `plans/messenger-v1/chore-ui/iter-1/REVIEW.md` — неточный JSDoc про порядок закрытия по `Escape`, а также два одобренных необязательных пункта: игнорировать автоповтор и уточнить JSDoc `isRetriable`.

## What was implemented
1. **[code] JSDoc `useChatPage`.** «Открытое меню или панель закрываются первыми» заменено на «Меню или панель, внутри которых фокус, закрываются первыми». Теперь формулировка совпадает с JSDoc `Sidebar` («`Escape` при фокусе внутри панели»).
2. **Автоповтор `Escape`.** В слушатель на `document` добавлено условие `!event.repeat`. Если удерживать клавишу, первое нажатие закрывает меню или панель (событие отменено), а повторы чат уже не закрывают. В JSDoc добавлена одна фраза об этом. Обработчики меню и панели автоповтор не фильтруют, и это не требуется: после закрытия меню или панели фокус уходит из них, и повторы до этих обработчиков не доходят.
3. **JSDoc `isRetriable`.** «Такой ответ (4xx, …)» заменено на «Такой ответ (4xx, кроме 429, …)».

## Files created
- `src/app/__tests__/_queryClient.test.ts` — unit-тесты правила повтора (из iter-1, в этом заходе не менялся).

## Files modified
(накопительно)
- `src/app/_queryClient.ts` — 429 повторяется, JSDoc `isRetriable`; в iter-2 добавлено «кроме 429».
- `src/pages/ChatPage/_useChatPage.ts` — слушатель `Escape` на `document`, JSDoc хука; в iter-2 уточнён JSDoc и добавлено условие `!event.repeat` (Prettier разбил условие на несколько строк).
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_AccountMenu.tsx` — `preventDefault()` в обработчике `Escape` (iter-1).
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — `Escape` закрывает панель «Новый чат», JSDoc (iter-1).
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — ширина `clamp(280px, 28vw, 380px)` (iter-1).
- `src/components/Button/_styles.ts` — `:hover` на активной кнопке (iter-1).

## Verification
- Baseline переиспользован: `plans/messenger-v1/baseline/`.
- `pnpm format` — exit 0.
- `pnpm lint` — exit 0, без ошибок и предупреждений.
- `pnpm build` — exit 0.
- `pnpm test` — 13 файлов, 152 теста, все прошли.
- Exports — новых экспортов нет.
- Stop condition — все три пункта ревью исправлены, другие файлы не тронуты.
- Runtime/browser — разработчик не проверял. Визуальная проверка iter-1 одобрена (APPROVED); условие `!event.repeat` вживую не наблюдалось.
- `.playwright-mcp` не появлялся.

## Known issues
- Без изменений относительно iter-1: `RATE_LIMITED` у мутации `checkAccount` не повторяется (вне объёма). `BACKLOG.md` и `plans/messenger-v1/EXECUTION.md` изменены в рабочем дереве, но не этим заходом.
