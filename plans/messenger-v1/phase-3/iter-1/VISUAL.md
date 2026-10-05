STATUS: APPROVED
Issue source: none

## Summary
Прогнаны все 6 строк матрицы Phase 3 (плюс постоянная строка `raw_values_in_ui`) через Playwright MCP на `pnpm dev`, с одним реальным запросом `getStateInstance` с неверным токеном и одним с настоящими кредами. Все строки `PASS`: guard, вход с ошибкой и вход с успехом, редирект со страницы входа при наличии сессии, мобильная раскладка; консоль чистая, запроса `/favicon.ico` нет.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `innerText` страниц `/login` (десктоп и 390px), состояния ошибки и `/` — только строки словаря (`Вход`, `Данные инстанса из личного кабинета GREEN-API`, `idInstance`, `apiTokenInstance`, `Войти`, `Неверный idInstance или apiTokenInstance`, `GREEN-API Messenger`); совпадений с `undefined` / `null` / `NaN` / `[object Object]` / сырыми ключами вида `login.title` нет | | item_specific | |
| app_boots | boot | PASS | `/login` (1280x800, localStorage пуст): snapshot — `heading "Вход" [level=1]`, `textbox "idInstance"`, `textbox "apiTokenInstance"`, `button "Войти" [disabled]`; консоль: 0 errors / 0 warnings (только vite debug и info про React DevTools); `link[rel=icon]` = `/favicon.svg` (`image/svg+xml`), `/favicon.svg` → 200; в resource-записях есть только `favicon.svg`, браузер `/favicon.ico` не запрашивал | | item_specific | |
| guard_redirect | routing | PASS | `goto /` без сессии → `location.href` = `http://localhost:5173/login`, h1 `Вход`, 2 поля; консоль 0 errors / 0 warnings | | item_specific | |
| login_invalid | login | PASS | реальный idInstance + заведомо неверный токен, реальный клик `Войти`: snapshot — `alert: Неверный idInstance или apiTokenInstance` в форме после полей (над кнопкой `Войти`); URL остаётся `http://localhost:5173/login` (без `?reason`, т. е. 401 входа не запускает `signOut`); network: ровно 1 запрос `GET https://api.green-api.com/waInstance<id>/getStateInstance/<wrong-token>` → 401, тело пустое (повторов на 4xx нет); localStorage пуст; консоль: 1 error — `Failed to load resource: the server responded with a status of 401 (Unauthorized)` — сообщение браузера о загрузке ресурса, не ошибка приложения | | item_specific | |
| login_success | login | PASS | креды из `.env.local` подставлены в поля без вывода (локальный helper → события `input`), реальный клик `Войти` → URL `http://localhost:5173/`, h1 `GREEN-API Messenger` (заглушка до Phase 4); network: ровно 1 запрос `GET https://api.green-api.com/waInstance<id>/getStateInstance/<token>` → 200, тело `{"stateInstance":"authorized"}`; localStorage: ключ `greenapi-messenger:session` с полями `idInstance`, `apiTokenInstance`, значения совпадают с введёнными кредами; новых сообщений в консоли нет (единственная error в этой вкладке — 401 из `login_invalid`). `checkAccount` / `getContactInfo` не вызывались | | item_specific | |
| login_redirect_when_authed | routing | PASS | с сессией из `login_success` полная навигация `goto /login` → URL `http://localhost:5173/`, snapshot — `heading "GREEN-API Messenger" [level=1]`, формы входа нет; консоль 0 errors / 0 warnings | | item_specific | |
| mobile_layout | layout | PASS | 390x844, сессии нет, `/login`: `documentElement.scrollWidth` = `clientWidth` = 390, `scrollTo(1000,0)` → `scrollX` 0 (горизонтального скролла нет); карточка: left 0, width ≈390 (390.4 при DPR 1.0000000149 — артефакт округления resize), `border-radius: 0px`, `box-shadow: none`, `padding: 32px 24px`, фон белый; форма, оба поля и кнопка: left 24, width 342.4 (вся ширина за вычетом отступов карточки); `font-size` полей 16px; за правый край выходит только SVG кнопки TanStack Query devtools (только в dev), не UI приложения; консоль 0 errors / 0 warnings | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "innerText на /login (десктоп и 390px), в состоянии ошибки и на / — только строки словаря; сырых ключей и undefined/null/NaN/[object Object] нет"
      root_cause_scope: item_specific
    - check_id: app_boots
      dependency_group: boot
      status: PASS
      evidence: "h1 Вход + поля idInstance/apiTokenInstance; консоль 0 errors/0 warnings; link rel=icon /favicon.svg → 200; запроса /favicon.ico нет"
      root_cause_scope: item_specific
    - check_id: guard_redirect
      dependency_group: routing
      status: PASS
      evidence: "goto / без сессии → http://localhost:5173/login"
      root_cause_scope: item_specific
    - check_id: login_invalid
      dependency_group: login
      status: PASS
      evidence: "alert 'Неверный idInstance или apiTokenInstance'; URL /login; 1 запрос getStateInstance → 401 (консольная ошибка браузера о загрузке ресурса)"
      root_cause_scope: item_specific
    - check_id: login_success
      dependency_group: login
      status: PASS
      evidence: "реальные креды → URL /; getStateInstance/<token> → 200 {\"stateInstance\":\"authorized\"}; сессия записана в localStorage"
      root_cause_scope: item_specific
    - check_id: login_redirect_when_authed
      dependency_group: routing
      status: PASS
      evidence: "с сессией goto /login → http://localhost:5173/"
      root_cause_scope: item_specific
    - check_id: mobile_layout
      dependency_group: layout
      status: PASS
      evidence: "390px: scrollWidth=clientWidth=390, scrollX 0; карточка на всю ширину без скругления/тени; поля и кнопка 342.4px (24px отступы)"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

- Экран входа — Free choice (`## Visual references`, `design.source: none`) → не проверяется; расположение и цвета остаются за владельцем.

## Notes
- **Расположение ошибки входа (проверить глазами).** В плане сказано «Сообщение об ошибке входа — под формой», а `alert` стоит внутри `<form>` между полями и кнопкой `Войти` (верх alert 481px, низ кнопки 573px при 1280x800). Строку я не завалил: текст есть, он под полями ввода, это обычная раскладка. Если «под формой» означало «под кнопкой», это небольшое изменение по `code`.
- **Нет HTML-атрибута `required` у полей** (`required: false` у обоих `input`). Обязательность реализована через `useForm`: кнопка `Войти` отключена, пока поля пустые. В браузере это ни на что не влияет; соответствие п. 5 («оба `required`») решает статический ревьюер.
- Во время `app_boots` я сам отправил проверочный `fetch('/favicon.ico', {method: 'HEAD'})`, чтобы проверить ответ сервера (Vite отдаёт 404). Эта 404 в консоли от моей проверки, не от приложения. Чистая консоль зафиксирована до неё и потом ещё раз — на отдельной загрузке страницы (`guard_redirect`).
- Как не светить креды: idInstance и токен браузер получал от одноразового локального helper'а на `127.0.0.1:5199`, который читал `.env.local`. Креды не попадали ни в вызовы инструментов, ни в этот файл. Токен в URL запросов заменён на `<token>`, idInstance — на `<id>`.
- Teardown: dev-сервер (`:5173`) и helper (`:5199`) остановлены, вкладка браузера закрыта, `.playwright-mcp/` удалён (в нём были snapshot'ы с содержимым поля пароля), скрипт helper'а удалён.
