Status: COMPLETED

## Phase goal

Phase 3 — «Вход и маршруты», FIX iteration 4: поправить два необязательных замечания ревью iter-3
(`plans/messenger-v1/phase-3/iter-3/REVIEW.md`) по просьбе владельца. Фаза уже одобрена (static iter-3, visual iter-2).

## What was implemented

1. **Формат `GreenApiError.message` закреплён тестом.** Тест «токен не попадает в message…» в
   `src/api/__tests__/api.test.ts` переименован в «message — коды метода, вида и статуса; токен в него не попадает».
   HTTP-ответ в нём теперь 401 вместо 500, и добавлены точные проверки:
   `GREEN-API getChats: http 401` (HTTP-ошибка со статусом) и `GREEN-API getChats: network` (сетевая ошибка без статуса,
   без хвоста). Проверки на отсутствие токена в `message` для всех четырёх ошибок остались.
2. **`InstanceNotAuthorizedError.message` стал кодом.** Вместо «Инстанс GREEN-API не авторизован» теперь
   `` `GREEN-API ${EGreenApiMethod.GET_STATE_INSTANCE}: notAuthorized` `` → `GREEN-API getStateInstance: notAuthorized`.
   Метод взят из `EGreenApiMethod` (импорт из `@/api/greenApi`). В JSDoc класса добавлено, что `message` — отладочный код
   в формате `GreenApiError`, а текст для пользователя форма входа выбирает по типу ошибки (`_useLoginForm.ts` проверяет
   `instanceof InstanceNotAuthorizedError`, так что поведение не изменилось).

## Files created

Накопительно (iter-1 и iter-2, в iter-3 и iter-4 новых файлов нет; отчёты пайплайна не в счёт):
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_paths.ts`, `_routes.tsx`, `AppRouter.tsx`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useLatest.hook.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/api/mutations/session.mutations.ts` (**iter-4:** `message` у `InstanceNotAuthorizedError` — код, JSDoc).
- `C:/Users/stevv/Desktop/greenapi-messenger/public/favicon.svg`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/components/Input/{index.ts,_Input.tsx,_styles.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/objectGetters.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/localStorage.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/types/common.types.ts`.

## Files modified

Накопительно:
- `src/app/App.tsx`: `RouterProvider`.
- `src/app/_queryClient.ts`: 401 → `signOut`, `Register.mutationMeta`, `retry`, исправленные JSDoc.
- `index.html`: `<link rel="icon">`.
- `src/api/greenApi/_types.ts`: `EGreenApiMethod`.
- `src/api/greenApi/_client.ts`: `GreenApiError.method: EGreenApiMethod`, `getEntries`; (iter-3) `message` собирается из кодов.
- `src/api/greenApi/index.ts`: экспорт `EGreenApiMethod`.
- `src/api/services/{account,chats,messages}.service.ts`: имена методов через `EGreenApiMethod`.
- `src/api/__tests__/api.test.ts`: имена методов через `EGreenApiMethod`. **iter-4:** тест формата `message`
  (HTTP 401 и сеть) с прежними проверками на токен.
- `src/api/session.ts`: хранилище через `getLSItem` / `setLSItem` / `removeLSItem`, путь входа из `routerPaths.login`.
- `src/theme/_GlobalStyle.ts`: `button, input, textarea { font: inherit; }`.

## Verification

Baseline переиспользован (`plans/messenger-v1/baseline/`: lint и build чистые, exit=0).

- `pnpm format` — выполнен, изменений вне правок нет.
- `pnpm lint` — exit=0, ошибок и предупреждений нет.
- `pnpm build` — успешно.
- `pnpm test` — 1 файл, 32 теста, все прошли.
- Exports — новых экспортов нет.
- Phase stop condition — выполнено: оба замечания закрыты, вне них ничего не менялось.
- Runtime/browser — разработчик не проверял; на UI правки не влияют (текст ошибки входа выбирается по типу).

## Known issues

- `notAuthorized` в `message` у `InstanceNotAuthorizedError` — строковый литерал. Подходящего enum нет:
  `EStateInstance` содержит только `AUTHORIZED`, и это значение `stateInstance` из API, а не вид ошибки (реальное
  состояние может быть `starting`, `blocked` и т. п.). Заводить enum ради одного кода не стал; метод, как и просили,
  взят из `EGreenApiMethod`.
- Коммит не делался (`commit_policy: owner`).
