Status: COMPLETED

## Phase goal

Phase 3 — «Вход и маршруты». Повторный прогон после поправки «Phase 3 — added 2026-10-05 (5)»: `GreenApiError.message` собирается
из кодов (`kind` / `status`), справочник человекочитаемых причин удаляется. Остальная фаза одобрена в iter-2 и не менялась.

## What was implemented

- `src/api/greenApi/_client.ts`:
  - справочник `ERROR_REASONS` удалён;
  - `GreenApiError` собирает `message` как `GREEN-API <method>: <kind>` и ` <status>`, если статус не `null`. Примеры:
    `GREEN-API getStateInstance: http 401`, `GREEN-API getChats: network`, `GREEN-API checkAccount: rateLimited 200`;
  - JSDoc класса описывает этот формат. Ещё в нём сказано, что пользовательские тексты выбираются по `kind` / `status`. Это проверено:
    `_useLoginForm.ts` смотрит на `kind` и `status`, `_queryClient.ts` смотрит на `status`, `message` нигде не читается;
  - URL с токеном в `message` по-прежнему не попадает: строка собирается только из `method`, `kind` и `status`. Правила `cause` не менялись:
    при сбое сети `cause` нет, при не-JSON тоже нет, при ошибке схемы `cause` — это `ZodError`.
- `src/api/__tests__/api.test.ts` не изменён: старый текст `message` не проверяла ни одна проверка. Тест «токен не попадает в message ни одной
  ошибки» остался и проходит.

## Files created

Накопительно (iter-1 и iter-2, в iter-3 новых файлов нет):
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_paths.ts`, `_routes.tsx`, `AppRouter.tsx`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useLatest.hook.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/api/mutations/session.mutations.ts`.
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
- `src/api/greenApi/_client.ts`: `GreenApiError.method: EGreenApiMethod`, `getEntries`.
  **iter-3:** `message` собирается из кодов, `ERROR_REASONS` удалён, JSDoc класса обновлён.
- `src/api/greenApi/index.ts`: экспорт `EGreenApiMethod`.
- `src/api/services/{account,chats,messages}.service.ts`: имена методов через `EGreenApiMethod`.
- `src/api/__tests__/api.test.ts`: имена методов через `EGreenApiMethod`. В iter-3 файл не менялся.
- `src/api/session.ts`: хранилище через `getLSItem` / `setLSItem` / `removeLSItem`, путь входа из `routerPaths.login`.
- `src/theme/_GlobalStyle.ts`: `button, input, textarea { font: inherit; }`.

## Verification

Команды выполнены дословно, без подмен:
- `pnpm format`: exit 0. Других файлов не изменил: `git status` до и после совпадает.
- `pnpm lint`: exit 0, без ошибок и предупреждений. Baseline тоже чистый.
- `pnpm build` (`tsc -b && vite build`): exit 0.
- `pnpm test`: 1 файл, 32/32 зелёные.

**Exports.** Новых экспортов нет. `ERROR_REASONS` был внутренней константой модуля.

**Phase stop condition:** по-прежнему выполнено. Поправка (5) закрыта целиком: справочника причин нет, формат `message` соответствует
поправке, токен в `message` не попадает.

**Runtime/browser:** разработчик не проверял, в iter-3 нужды в этом не было: изменилась только отладочная строка, в интерфейсе она
не показывается. Visual Verification фазы остаётся за визуальным ревьюером.

## Known issues

- Нет. Отдельной проверки на точный текст `message` (например, `http 401`) поручение не требовало, поэтому она не добавлялась.
  Если такая проверка нужна, это одна строка в существующем тесте.
- Коммит не делался (`commit_policy: owner`).
