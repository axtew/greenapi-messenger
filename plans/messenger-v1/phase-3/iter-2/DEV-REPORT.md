Status: COMPLETED

## Phase goal

Phase 3 — «Вход и маршруты», итерация исправлений: замечания static-ревью iter-1 (4 code issues) плюс пункты Phase 3 из поправок
«Phase 3 — added 2026-10-05 (2)», «Phases 3, 5 — added 2026-10-05 (3)» и «Phases 3, 6 — added 2026-10-05 (4)».

## What was implemented

**Исправления по ревью:**
1. **Шрифт кнопки «Войти».** Выбран вариант со сбросом в `GlobalStyle`: `button, input, textarea { font: inherit; }` с комментарием, зачем он нужен.
   Дублирующий `font-family: inherit` из стилей поля убран (поле теперь в общем `Input`). `textarea` добавлен в сброс: это тот же класс
   элементов, что и `button`/`input`, и сброс в `GlobalStyle` сам по себе экспортом не является.
2. **JSDoc `isRetriable`.** Первая строка теперь описывает фактическое правило: не повторяется только ответ GREEN-API со статусом ниже 500,
   всё остальное повторяется (сеть, 5xx, ошибки не от GREEN-API, включая исключение в самой `queryFn`).
3. **JSDoc `queryClient`.** Добавлена оговорка: мутации с `meta.skipUnauthorizedRedirect` обрабатывают свой 401 сами.
4. **Комментарии `useForm`.** `resetOn` и `catch` в `onSubmit` переписаны дословно по поправке (2). Логика и FIXME не тронуты.

**Поправка (2):** нейтральные комментарии `useForm` (см. п. 4). `EGreenApiMethod` остаётся в `src/api/greenApi/_types.ts`, код не менялся.

**Поправка (3):**
- `getEntries` переехал в `src/utils/helpers/objectGetters.ts` (JSDoc: что заменяет и почему). `TSetState` переехал в
  `src/types/common.types.ts`. Импорты `useForm/_helpers.ts` и `useForm/_types.ts` перенаправлены туда.
- `src/utils/helpers/localStorage.ts`: `getLSItem(key, schema)` возвращает `T | null` (`try/catch` + `JSON.parse` + `safeParse`);
  `setLSItem(key, value)` и `removeLSItem(key)` обёрнуты в `try/catch` и пишут ошибку в `console.error`. В лог попадает только ключ,
  значение не попадает никогда, потому что в нём лежат креды. `any` и непроверенных приведений нет.
- `src/api/session.ts` переведён на эти обёртки: `getSession` → `getLSItem`, `saveSession` → `setLSItem`, `signOut` → `removeLSItem`.
  Локальная `clearSession` больше не нужна и удалена. Поведение то же, тесты сессии не менялись и проходят.
- Сопутствующая правка по `structure.md` → «Общий слой»: в `src/api/greenApi/_client.ts` прямой `Object.entries(query)` заменён на
  `getEntries(query)`. Раз обёртка теперь лежит в общем слое, прямой вызов был бы находкой `code`. Тип результата для `Record<string, …>` тот же.

**Поправка (4):**
- Добавлен общий компонент `src/components/Input/` (`index.ts`, `_Input.tsx`, `_styles.ts`). Пропсы: `label: string` и `error: string | null`,
  остальные атрибуты `input` пробрасываются, кроме `id` (он внутренний). Устройство:
  - `id` берётся из `useId()`, подпись — `<label htmlFor={id}>` с `Caption`;
  - ошибка — `Caption` с `id` `${id}-error`, вне `<label>`;
  - `aria-invalid={hasError}`, а `aria-describedby` ставится только при наличии ошибки;
  - рамка ошибки задаётся селектором `&[aria-invalid="true"]`, `font-size: 16px` оставлен с комментарием про iOS.
- `LoginPage` переведён на `Input`; `SField` и `SInput` удалены из `LoginPage/_styles.ts`. Тексты и поведение формы не изменились.
- Ошибка входа (`submitError`, `role="alert"`) теперь стоит под кнопкой «Войти».
- `signOut` строит путь из `routerPaths.login`. Цикла импортов нет: `_paths.ts` ничего не импортирует.

## Files created

Накопительно, с учётом iter-1:
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_paths.ts`: `routerPaths`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_routes.tsx`: роут логина и защищённые роуты (`/` с заглушкой).
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/AppRouter.tsx`: корень, защищённый layout-роут, `router`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}`: хук форм. В iter-2
  нейтральные комментарии, `getEntries` и `TSetState` берутся из общего слоя.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useLatest.hook.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}`: экран входа.
  В iter-2 поля переведены на `Input`, ошибка входа перенесена под кнопку.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/api/mutations/session.mutations.ts`: `useLoginMutation`, `InstanceNotAuthorizedError`.
- `C:/Users/stevv/Desktop/greenapi-messenger/public/favicon.svg`: фавиконка.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/components/Input/{index.ts,_Input.tsx,_styles.ts}` (iter-2): общее поле с подписью и ошибкой.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/objectGetters.ts` (iter-2): `getEntries`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/localStorage.ts` (iter-2): `getLSItem`, `setLSItem`, `removeLSItem`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/types/common.types.ts` (iter-2): `TSetState`.

## Files modified

Накопительно:
- `src/app/App.tsx`: `RouterProvider`.
- `src/app/_queryClient.ts`: 401 → `signOut`, `Register.mutationMeta`, `retry`. В iter-2 исправлены JSDoc `isRetriable` и `queryClient`.
- `index.html`: `<link rel="icon">`.
- `src/api/greenApi/_types.ts`: `EGreenApiMethod`.
- `src/api/greenApi/_client.ts`: `ERROR_REASONS`, `GreenApiError.method: EGreenApiMethod`. В iter-2 `Object.entries` заменён на `getEntries`.
- `src/api/greenApi/index.ts`: экспорт `EGreenApiMethod`.
- `src/api/services/{account,chats,messages}.service.ts`: имена методов через `EGreenApiMethod`.
- `src/api/__tests__/api.test.ts`: имена методов через `EGreenApiMethod`.
- `src/api/session.ts` (iter-2): хранилище через `getLSItem` / `setLSItem` / `removeLSItem`, путь входа из `routerPaths.login`.
- `src/theme/_GlobalStyle.ts` (iter-2): `button, input, textarea { font: inherit; }`.

## UI judgment (Free choice)

- `Input` повторяет стили поля входа из iter-1: высота 48, `radii.item`, рамка `border`, при фокусе `primary`, при `aria-invalid` `danger`,
  зазор 6 между подписью, полем и ошибкой. Визуально экран входа не изменился, сдвинулось только положение ошибки входа (теперь под кнопкой).

## Verification

Команды выполнены дословно, без подмен:
- `pnpm format`: exit 0.
- `pnpm lint`: exit 0, ошибок и предупреждений нет. Baseline тоже чистый.
- `pnpm build` (`tsc -b && vite build`): exit 0.
- `pnpm test`: 1 файл, 32/32 зелёные. Тесты сессии не менялись.

**Exports.** У каждого нового экспорта есть импортёр:

| Экспорт | Импортёры |
|---|---|
| `getEntries` | `useForm/_helpers.ts`, `greenApi/_client.ts` |
| `getLSItem`, `setLSItem`, `removeLSItem` | `api/session.ts` |
| `TSetState` | `useForm/_types.ts` |
| `Input` | `LoginPage/_LoginPage.tsx` |

**Provisioned for later phases:**
- `routerPaths.chat`: потребитель — Phase 6 (роут `/chat/$chatId`, ссылки `ChatListItem`). Объявлен в поправке (3). Это ключ уже
  используемого экспорта `routerPaths`, а не отдельный символ.

**Phase stop condition:** остаётся выполненным. Роутинг и форма на месте, вход с реальными кредами разработчик не проверял (`login_success`
проверяет визуальный ревьюер).

**Runtime/browser.** Это не верификация разработчика: Visual Verification фазы выполняет визуальный ревьюер. При самопроверке на `pnpm dev`
(порт 5199, затем остановлен; `.playwright-mcp` удалена) наблюдалось:
- `/` без сессии → `/login`.
- Ввод `12ab` в idInstance:
  - `aria-invalid="true"`;
  - `aria-describedby` указывает на элемент с текстом «Только цифры»;
  - доступное имя поля по `<label>` — только «idInstance»;
  - у второго поля `aria-describedby` нет.
- После исправления значения у поля `aria-invalid="false"`, `aria-describedby` снят.
- Вычисленный `font-family` у кнопки и у её `span` — `Roboto, …`. `font-size` поля — 16px.
- Фиктивные idInstance и токен (не из `.env.local`):
  - `getStateInstance` вернул 401;
  - `role="alert"` с текстом «Неверный idInstance или apiTokenInstance» стоит в DOM после кнопки;
  - URL остался `/login`, в localStorage пусто.
- В консоли одна ошибка — сетевой лог браузера `Failed to load resource: 401` для этого запроса, ожидаемый при неверных кредах.
  Креды из `.env.local` не использовались.

## Known issues / follow-ups

- **Прочие прямые вызовы встроенных API без обёртки.** `Object.keys(form)` в `useForm/_useForm.hook.ts` (2 места) и `Object.values(ESignOutReason)`
  в `routes/_routes.tsx` остались как есть. Обёрток `getKeys` / `getValues` в общем слое нет, поправка (3) вводит только `getEntries`.
  Добавить ли их — решать владельцу или плану.
- Заглушка `HomeStub` на `/` осталась из iter-1, её заменит Phase 4.
- Сообщение в логе при сбое записи сессии сменилось с «Не удалось сохранить сессию» на общее из `setLSItem` («Не удалось записать «<ключ>»
  в localStorage»). Поведение то же: ошибка не пробрасывается, значение в лог не попадает.
- Planner-drift: нет.
