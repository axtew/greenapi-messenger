STATUS: APPROVED
Issue source: none

## Summary
Подмножество iter-6 прогнано через Playwright MCP на `pnpm dev`: `app_boots`, `guard_redirect`, `login_redirect_when_authed` и постоянная строка `raw_values_in_ui`. Фабрики роутов теперь обобщённые, после этого рантайм не изменился. Все перепроверенные строки `PASS`. Баннер `?reason=expired` показывается; неизвестный `reason` отбрасывается. Строки `login_invalid`, `login_success`, `mobile_layout` перенесены из iter-2 со статусом `PASS`.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `innerText` на `/login`, `/login?reason=expired`, `/login?reason=bogus` и на `/` после входа — только строки словаря (`Вход`, `Данные инстанса из личного кабинета GREEN-API`, `idInstance`, `apiTokenInstance`, `Войти`, `Сессия недействительна — войдите заново`, `GREEN-API Messenger`); нет `undefined` / `null` / `NaN` / `[object Object]`, нет сырых ключей вида `login.sessionExpired` | | item_specific | |
| app_boots | boot | PASS | `/login`, 1280x800, localStorage пуст. Snapshot: `heading "Вход" [level=1]`, `textbox "idInstance"`, `textbox "apiTokenInstance"`, `button "Войти" [disabled]`. Консоль: 0 errors / 0 warnings (только vite debug и info про React DevTools). `link[rel=icon]` = `/favicon.svg` (`image/svg+xml`) → 200 `image/svg+xml`, запроса к `/favicon.ico` нет. **Search-типизация:** `/login?reason=expired` → первым в карточке, над `h1`, `alert` с `paragraph "Сессия недействительна — войдите заново"` (верх 220px, форма 357px); консоль 0/0. `/login?reason=bogus` → баннера нет, `[role=alert]` = 0: `validateSearch` отбрасывает неизвестное значение | | item_specific | |
| guard_redirect | routing | PASS | `goto /` без сессии → `location.href` = `http://localhost:5173/login`, h1 `Вход`, 2 поля, `[role=alert]` = 0, localStorage пуст; консоль 0 errors / 0 warnings | | item_specific | |
| login_invalid | login | PASS | carried forward from iter-2: ошибка `Неверный idInstance или apiTokenInstance` (`<p role=alert>`) под кнопкой, URL `/login`, 1 запрос `getStateInstance/<token>` → 401. Код входа и формы с iter-2 не менялся | | item_specific | |
| login_success | login | PASS | carried forward from iter-2. В iter-6 вход тоже выполнен, как подготовка к `login_redirect_when_authed`: креды из `.env.local`, реальный клик `Войти` → URL `http://localhost:5173/`, h1 `GREEN-API Messenger`; ровно 1 запрос `GET https://api.green-api.com/waInstance<id>/getStateInstance/<token>` → 200 `{"stateInstance":"authorized"}`. Сессия `greenapi-messenger:session`: `{idInstance:string, apiTokenInstance:string}`, значения совпадают с кредами (сравнение в браузере → true); консоль 0/0 | | item_specific | |
| login_redirect_when_authed | routing | PASS | С сессией после реального входа полная навигация `goto /login` → URL `http://localhost:5173/`. Snapshot: только `heading "GREEN-API Messenger" [level=1]` и кнопка devtools, `form` = 0, новых запросов к GREEN-API нет; консоль 0 errors / 0 warnings. `goto /login?reason=expired` с сессией → тоже `http://localhost:5173/` | | item_specific | |
| mobile_layout | layout | PASS | carried forward from iter-2: на 390px `scrollWidth` = `clientWidth` = 390, карточка во всю ширину, поля и кнопка шириной 342.4px. Стили с iter-2 не менялись | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "innerText /login, /login?reason=expired, /login?reason=bogus, / после входа — только строки словаря; нет сырых ключей и undefined/null/NaN/[object Object]"
      root_cause_scope: item_specific
    - check_id: app_boots
      dependency_group: boot
      status: PASS
      evidence: "h1 Вход + textbox idInstance/apiTokenInstance; консоль 0 errors/0 warnings; /favicon.svg 200, запроса к /favicon.ico нет; ?reason=expired → alert «Сессия недействительна — войдите заново» над h1; ?reason=bogus → без баннера"
      root_cause_scope: item_specific
    - check_id: guard_redirect
      dependency_group: routing
      status: PASS
      evidence: "goto / без сессии → http://localhost:5173/login, консоль чистая"
      root_cause_scope: item_specific
    - check_id: login_invalid
      dependency_group: login
      status: PASS
      evidence: "carried forward from iter-2 (plans/messenger-v1/phase-3/iter-2/VISUAL.md)"
      root_cause_scope: item_specific
    - check_id: login_success
      dependency_group: login
      status: PASS
      evidence: "carried forward from iter-2; повторно подтверждено в iter-6: getStateInstance/<token> → 200 {\"stateInstance\":\"authorized\"}, URL /, сессия записана"
      root_cause_scope: item_specific
    - check_id: login_redirect_when_authed
      dependency_group: routing
      status: PASS
      evidence: "после реального входа goto /login → http://localhost:5173/ (и /login?reason=expired → /); формы нет, консоль чистая"
      root_cause_scope: item_specific
    - check_id: mobile_layout
      dependency_group: layout
      status: PASS
      evidence: "carried forward from iter-2 (plans/messenger-v1/phase-3/iter-2/VISUAL.md)"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

- Экран входа — Free choice (`design.source: none`) → не проверяется.

## Notes
- В iter-6 был ровно один запрос к GREEN-API: `getStateInstance` с настоящими кредами, ответ 200. Других методов не вызывали.
- Креды в браузер передавал одноразовый локальный helper на `127.0.0.1:5199`, который читал `.env.local`. В аргументы инструментов и в отчёт они не попали. Сеть снималась обёрткой `window.fetch`, которая маскирует URL (`<id>`, `<token>`). Кнопку нажимали по CSS-селектору, без snapshot заполненной формы.
- Teardown: localStorage в браузере очищен, вкладка закрыта. Dev-сервер (`:5173`) и helper (`:5199`) остановлены, порты свободны. `.playwright-mcp/` и скрипт helper-а удалены.
- Пункты 2 и 3(b) из DEV-REPORT iter-6 (`skipLibCheck`) — plan gap, решение за владельцем. Они касаются только типов и к браузерной проверке не относятся.
