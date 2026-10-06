Status: COMPLETED

## Phase goal
Phase 10, iter-4 — исправления по статическому ревью iter-3 (`plans/messenger-v1/phase-10/iter-3/REVIEW.md`): три замечания `[code]` к e2e
и две одобренные рекомендации (комментарий у импорта `EGreenApiMethod`, `.playwright-mcp/` в `.gitignore`). План не менялся.

## What was implemented
1. `e2e/messenger.spec.ts` — `getChatColumnCenterX` теперь принимает `chatScreen` (`getByRole("main")`, правая колонка `SContent`) и меряет
   середину по нему. Лента в колонке отцентрирована (`SWrapper`: `justify-content: center`, симметричный `padding`; `SColumn`: `max-width: 880px`),
   так что комментарий «середина колонки — по `main`, в которой лента отцентрирована» верен. Функция переиспользует `getBox` (перенесена
   ниже него); неиспользуемый `type Page` убран из импорта.
2. `e2e/greenApiStub.ts` — `IGreenApiStub` больше не экспортируется (импортёров нет; тип доступен структурно через `installGreenApiStub`).
3. `e2e/greenApiStub.ts` — `INotification` с `Record<string, unknown>` заменён на `IIncomingMessageNotification` с полной формой
   `incomingMessageReceived` по `brainstorm.md` → «Формы уведомлений». Добавлен `IRequestBody` (`chatId?: string`, `count?: number`,
   `phoneNumber?: number`, `message?: string` — типы сверены с `body` в `chats.service.ts` / `messages.service.ts`). `readBody` возвращает
   `IRequestBody`: один `as` с однострочным пояснением (тело шлёт само приложение, форма известна по сервисам, стаб её не валидирует).
   Убраны `String(body.chatId)`, `Number(body.count)`, `String(body.phoneNumber)`, `String(body.message)`. `checkAccount` сравнивает
   `body.phoneNumber === Number(STUB_CONTACT.phone)`. Отсутствующий `chatId` / `message` заменяется на `""`. `unknown` в ответ `getContactInfo` больше не попадает.
4. `e2e/greenApiStub.ts:3` — одна строка над импортом `EGreenApiMethod`: почему импорт идёт мимо barrel и без `@/`.
5. `.gitignore` — `.playwright-mcp/` с комментарием (артефакты Playwright MCP могут содержать адреса запросов с токеном).

## Files created
(кумулятивно) `e2e/greenApiStub.ts`, `e2e/messenger.spec.ts`, `playwright.config.ts`, `tsconfig.e2e.json`.

## Files modified
(кумулятивно) `README.md` (iter-1, iter-3), `src/api/session.ts`, `src/api/__tests__/api.test.ts`, `src/app/App.tsx` (iter-2),
`tsconfig.json`, `vite.config.ts`, `package.json`, `pnpm-lock.yaml` (iter-1), `.gitignore` (iter-4).
На iter-4 менялись `e2e/messenger.spec.ts`, `e2e/greenApiStub.ts`, `.gitignore`.

## Verification
- `npx prettier --write e2e/greenApiStub.ts e2e/messenger.spec.ts` — выполнено.
- `pnpm lint` — exit 0, 0 ошибок / 0 предупреждений.
- `pnpm build` — прошёл (включая `tsc` по `tsconfig.e2e.json`).
- `pnpm test` — 18 файлов, 232 passed.
- `pnpm e2e --repeat-each=5` — 5 passed.
- Exports: новых экспортов нет; `IGreenApiStub` экспорт снят.
- Runtime/browser разработчиком не проверялся (кроме e2e).

## Known issues
- Папка `.playwright-mcp/` в корне по-прежнему лежит: её создал не разработчик (см. REVIEW iter-3). Теперь она в `.gitignore`;
  удалить её или оставить — на усмотрение владельца.
- Необязательные пункты ревью (проверка опустошения очереди, сужение `pushIncoming`, `enum` в `IHistoryEntry`, явный `throw` при пустом
  `baseURL`) не делались — они вне списка исправлений.
- Не коммитилось (`commit_policy: owner`).
