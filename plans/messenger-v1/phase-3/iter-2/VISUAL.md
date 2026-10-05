STATUS: APPROVED
Issue source: none

## Summary
Все 6 строк матрицы Phase 3 и постоянная строка `raw_values_in_ui` прогнаны заново через Playwright MCP на `pnpm dev`: экран входа после перехода на общий `Input`, новое место ошибки входа и сброс шрифта в `GlobalStyle`. Был один реальный запрос `getStateInstance` с неверным токеном и один с настоящими кредами. Все строки `PASS`. Дополнительные проверки из amendment (4) тоже прошли: ошибка входа после кнопки с `role="alert"`; доступные имена полей не изменились; при ошибке поля стоят `aria-invalid` и `aria-describedby`; кнопка в Roboto.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `innerText` на `/login` (1280x800 и 390x844), с ошибкой поля, с ошибкой входа и на `/` — только строки словаря (`Вход`, `Данные инстанса из личного кабинета GREEN-API`, `idInstance`, `apiTokenInstance`, `Войти`, `Только цифры`, `Неверный idInstance или apiTokenInstance`, `GREEN-API Messenger`); нет `undefined` / `null` / `NaN` / `[object Object]` и сырых ключей вида `login.title` | | item_specific | |
| app_boots | boot | PASS | `/login`, 1280x800, localStorage пуст. Snapshot: `heading "Вход" [level=1]`, `textbox "idInstance"`, `textbox "apiTokenInstance"`, `button "Войти" [disabled]`. Консоль: 0 errors / 0 warnings (только vite debug и info про React DevTools), ошибки 404 на `/favicon.ico` нет. `link[rel=icon]` указывает на `/favicon.svg` (`image/svg+xml`), сервер отдаёт его с 200 `image/svg+xml`. Без проверочного запроса к `/favicon.ico` (в отличие от iter-1) | | item_specific | |
| guard_redirect | routing | PASS | `goto /` без сессии → `location.href` = `http://localhost:5173/login`, h1 `Вход`, 2 поля, localStorage пуст; консоль 0 errors / 0 warnings | | item_specific | |
| login_invalid | login | PASS | Реальный idInstance, заведомо неверный токен, реальный клик `Войти`. Snapshot: `alert: Неверный idInstance или apiTokenInstance` — **последний** элемент формы, после `button "Войти"` (`compareDocumentPosition` → FOLLOWING; при 1280x800 низ кнопки 540.4px, верх alert 556.4px), `<p role="alert">`, цвет `rgb(229, 57, 53)`. URL остаётся `http://localhost:5173/login` (без `?reason`). Network (обёртка `fetch`): ровно 1 запрос `GET https://api.green-api.com/waInstance<id>/getStateInstance/<token>` → 401, тело пустое, повторов нет. localStorage пуст. Консоль: 1 error `Failed to load resource: … 401 (Unauthorized)` — браузер сообщает о загрузке ресурса, это не ошибка приложения. Доступные имена полей — ровно `textbox "idInstance"` / `textbox "apiTokenInstance"` (текст `<label>` = имя поля); у обоих полей `aria-invalid="false"`, `aria-describedby` нет | | item_specific | |
| login_success | login | PASS | Креды из `.env.local` попадают в поля без вывода (локальный helper → события `input`), реальный клик `Войти`. URL → `http://localhost:5173/`, h1 `GREEN-API Messenger` (заглушка до Phase 4), формы нет. Network: ровно 1 запрос `GET https://api.green-api.com/waInstance<id>/getStateInstance/<token>` → 200, тело `{"stateInstance":"authorized"}`. localStorage: ключ `greenapi-messenger:session` с полями `idInstance:string`, `apiTokenInstance:string`; значения совпадают с кредами (сравнение в браузере, true/true). Новых сообщений в консоли нет. `checkAccount` / `getContactInfo` не вызывались | | item_specific | |
| login_redirect_when_authed | routing | PASS | С сессией из `login_success` полная навигация `goto /login` → URL `http://localhost:5173/`. Snapshot: только `heading "GREEN-API Messenger" [level=1]` (и кнопка devtools), формы входа нет. Консоль 0 errors / 0 warnings | | item_specific | |
| mobile_layout | layout | PASS | 390x844, сессии нет, `/login`. `documentElement.scrollWidth` = `clientWidth` = `body.scrollWidth` = 390; `scrollTo(1000,0)` → `scrollX` 0. Карточка: left 0, width 390.4 (DPR 1.0000000149 — округление resize), `border-radius: 0px`, `box-shadow: none`, `padding: 32px 24px`. Форма, оба поля и кнопка: left 24, width 342.4 (вся ширина минус отступы карточки); `font-size` полей 16px. За правый край выходят только SVG-узлы кнопки TanStack Query devtools (есть только в dev). Консоль 0 errors / 0 warnings | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "innerText /login (десктоп и 390px), с ошибкой поля, с ошибкой входа и на / — только строки словаря; нет сырых ключей и undefined/null/NaN/[object Object]"
      root_cause_scope: item_specific
    - check_id: app_boots
      dependency_group: boot
      status: PASS
      evidence: "h1 Вход + textbox idInstance/apiTokenInstance; консоль 0 errors/0 warnings, 404 на /favicon.ico нет; link rel=icon /favicon.svg → 200 image/svg+xml"
      root_cause_scope: item_specific
    - check_id: guard_redirect
      dependency_group: routing
      status: PASS
      evidence: "goto / без сессии → http://localhost:5173/login"
      root_cause_scope: item_specific
    - check_id: login_invalid
      dependency_group: login
      status: PASS
      evidence: "<p role=alert> «Неверный idInstance или apiTokenInstance» — последний элемент формы, после кнопки Войти; URL /login; 1 запрос getStateInstance/<token> → 401 без повторов; имена полей idInstance/apiTokenInstance"
      root_cause_scope: item_specific
    - check_id: login_success
      dependency_group: login
      status: PASS
      evidence: "креды из .env.local → URL /; getStateInstance/<token> → 200 {\"stateInstance\":\"authorized\"}; сессия записана в localStorage"
      root_cause_scope: item_specific
    - check_id: login_redirect_when_authed
      dependency_group: routing
      status: PASS
      evidence: "с сессией goto /login → http://localhost:5173/"
      root_cause_scope: item_specific
    - check_id: mobile_layout
      dependency_group: layout
      status: PASS
      evidence: "390px: scrollWidth=clientWidth=390, scrollX 0; карточка на всю ширину без скругления/тени; поля и кнопка 342.4px (отступы 24px), font-size 16px"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

### Дополнительные проверки (amendment «Phases 3, 6 — added 2026-10-05 (4)»)

- **Ошибка поля (реальный ввод `abc` в idInstance).** `aria-invalid="true"`; `aria-describedby="_r_0_-error"` указывает на `<p>` с текстом `Только цифры`. Этот `<p>` не внутри `<label>` (`label.contains(err)` = false), текст `<label>` = `idInstance`. В snapshot: `textbox "idInstance" [invalid]` — доступное имя не изменилось; `Только цифры` — отдельный `paragraph` после поля. Рамка поля с ошибкой — `rgb(229, 57, 53)`, у соседнего — `rgb(218, 220, 224)`. У второго поля `aria-invalid="false"`, `aria-describedby` нет. Кнопка `Войти` отключена.
- **Без ошибки** `aria-describedby` нет ни у одного поля: ни при загрузке, ни после ошибки входа.
- **Ошибка входа**: после кнопки «Войти» в DOM и визуально; `role="alert"`. Подробности — в строке `login_invalid`.
- **Шрифт**: `font-family` у `button[type=submit]` и у её `span` — `Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; у обоих `input` такой же, `font-size` 16px.

## Design verification
STATUS: NOT_REQUESTED

- Экран входа — Free choice (`## Visual references`, `design.source: none`) → не проверяется; расположение и цвета остаются за владельцем.

## Notes
- Замечание iter-1 о месте ошибки входа закрыто: alert теперь под кнопкой (см. `login_invalid`).
- Если после неудачного входа исправить поля, сообщение `Неверный idInstance или apiTokenInstance` остаётся до следующей отправки формы. Plan этого не регулирует, это не дефект. Сообщаю, чтобы владелец знал.
- У полей нет HTML-атрибута `required` (`required: false`); обязательность реализует `useForm` через отключённую кнопку. Как и в iter-1, соответствие п. 5 оценивает статический ревьюер.
- Как не светить креды: браузер получал idInstance и токен от одноразового локального helper-а на `127.0.0.1:5199`, который читал `.env.local`. В аргументы инструментов и в этот файл они не попали. Токен в URL заменён на `<token>`, idInstance — на `<id>`. Сетевые данные сняты обёрткой `window.fetch`, которая сразу маскирует URL. При неверном токене консоль браузера и snapshot показали сам idInstance и фиктивный токен: это вывод инструмента, в отчёт он не попал. Настоящий токен в консоль не попадал: на успешный вход 200, ошибки нет.
- Teardown: dev-сервер (`:5173`) и helper (`:5199`) остановлены, порты свободны; вкладка браузера закрыта; `.playwright-mcp/` удалён (в snapshot-ах было содержимое поля пароля); скрипт helper-а удалён.
