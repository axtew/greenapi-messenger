STATUS: APPROVED
Issue source: none

## Summary
Повторно проверены `poller_running` и `raw_values_in_ui` на живом инстансе (1440×900, рабочее дерево, HEAD `ba3b1f4`). Обе строки PASS. Остальные строки перенесены из iter-1, где они были PASS. После поправки (20) ответ 408 на пустой очереди считается пустым циклом: следующий `receiveNotification` уходит через 0 мс, паузы 1 / 2 / 4 с больше нет. Одновременно в полёте всегда один запрос, консоль приложения чистая.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/` после входа, ~5 мин работы poller-а. Проверены текст `aside` и `main`, атрибуты `aria-label` / `placeholder` / `title` и `<title>`: нет `undefined`, `NaN`, `null`, `[object`, ключей словаря, членов `enum` и U+FFFD. `aside` — «Чаты / Artur Ovcharenko / время / превью», `main` — «Выберите, кому хотели бы написать». Атрибуты: `Меню`, `Новый чат`, `Open Tanstack query devtools` (это dev-инструменты). Предупреждения о настройках нет (`[role=status]` — 0). После выхода — `/login`, h1 «Вход» | | item_specific | |
| poller_running | poller | PASS | Обёртка `fetch` поставлена до входа, «Войти» нажата реальным кликом. Первый `receiveNotification?receiveTimeout=20` стартует через 11 мс после `getChats`. За 284,8 с работы цикла (≥3 мин на пустой очереди) прошло 4 завершённых цикла и 5-й был в полёте. **Все 4 ответа — 408, тело пустое (0 байт)**; `200 null` и уведомлений в этот раз не было. Длительность запроса и промежуток от конца запроса до начала следующего: №1 — 25 849 мс → 0 мс; №2 — 76 437 мс → 0 мс; №3 — 76 423 мс → 0 мс; №4 — 76 451 мс → 0 мс; №5 — в полёте с 285,4 с. Роста паузы нет. В полёте одновременно не больше 1 `receiveNotification` (`maxInflight` = 1). Resource Timing совпадает с обёрткой: 4 записи 408 с теми же стартами и длительностями. `deleteNotification` — 0, так как непустых ответов не было (удаление после непустого подтверждено в iter-1). Консоль приложения по обёрткам `console.error` / `console.warn` и событиям `error` / `unhandledrejection`: 0 / 0 / 0. Выход через «Меню» → «Выйти» прервал запрос в полёте без ошибок | | shared | |
| send_no_duplicate | poller | PASS | Перенесено из iter-1 (`phase-9/iter-1/VISUAL.md`): одно сообщение, эхо и `delivered`, в `main` ровно 1 пузырь. В iter-2 не перепроверялось, `sendMessage` — 0 | | item_specific | |
| single_consumer | poller | PASS | Перенесено из iter-1: при живой A у B `receiveNotification` — 0; после выгрузки или закрытия владельца блокировку берёт другая вкладка. В iter-2 не перепроверялось | | item_specific | |
| no_settings_warning | settings | PASS | Перенесено из iter-1. В iter-2 попутно: `getSettings` 200, `[role=status]` в `aside` — 0 | | item_specific | |
| logout_stops_poller | poller | PASS | Перенесено из iter-1. В iter-2 попутно: после «Выйти» — `/login`, сессии нет (булева проверка), записей Resource Timing к GREEN-API на новой странице — 0 | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "iter-2: aside/main/aria-label/placeholder/title на / и /login — только значения ru.json и HH:MM; undefined/NaN/null/[object/ключей/enum/U+FFFD нет"
      root_cause_scope: item_specific
    - check_id: poller_running
      dependency_group: poller
      status: PASS
      evidence: "iter-2: 4 цикла receiveNotification(20) подряд — все 408 с пустым телом (25,8 / 76,4 / 76,4 / 76,5 с), промежуток до следующего запроса 0 мс после каждого, без паузы 1/2/4 с; maxInflight 1; консоль приложения 0 error / 0 warn / 0 uncaught"
      root_cause_scope: shared
    - check_id: send_no_duplicate
      dependency_group: poller
      status: PASS
      evidence: "iter-1 (перенесено): в main ровно 1 пузырь после эха и следующего цикла"
      root_cause_scope: item_specific
    - check_id: single_consumer
      dependency_group: poller
      status: PASS
      evidence: "iter-1 (перенесено): вторая вкладка не читает очередь, пока владелец жив; после закрытия владельца начинает"
      root_cause_scope: item_specific
    - check_id: no_settings_warning
      dependency_group: settings
      status: PASS
      evidence: "iter-1 (перенесено); iter-2 попутно: getSettings 200, [role=status] в aside — 0"
      root_cause_scope: item_specific
    - check_id: logout_stops_poller
      dependency_group: poller
      status: PASS
      evidence: "iter-1 (перенесено); iter-2 попутно: Выйти -> /login, сессии нет, 0 запросов к GREEN-API на новой странице"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет; в этой итерации экраны не менялись.

## Notes
- **408 растягивается в браузере (симптом подтверждён, причина — гипотеза).** Длительности запросов: 25 849 мс, затем 76 437 / 76 423 / 76 451 мс. 76,4 ≈ 3 × 25,5 с. Первый запрос, вероятно, шёл по новому соединению; остальные похожи на автоматический повтор запроса Chrome после 408 на переиспользованном keep-alive соединении: две повторные попытки внутри одного `fetch`. Как и в iter-1, механизм не подтверждён: снимать сетевые события Chrome запрещено протоколом, в них URL с токеном. Для приложения это не дефект. Запрос всё это время в полёте, промежутков без запроса нет, поэтому уведомление, пришедшее в очередь, сервер отдаёт сразу. Chrome при этом пишет на каждый 408 строку `Failed to load resource … 408` в консоль браузера. Это сообщение браузера, а не приложения, из кода его не подавить.
- **Сырых данных о самом 408 в этой итерации не снималось.** Node-запросы мимо приложения не делались: они стали бы вторым потребителем очереди. 408 с пустым телом виден в обёртке `fetch` (`status`, длина тела 0) и в Resource Timing (`responseStatus` 408).
- **Повтор того же `receiptId`** (вторая часть поправки 20) на живом инстансе не воспроизвести: для этого должен сорваться `deleteNotification`. Ветку покрывают unit-тесты цикла (статический ревьюер), в браузере не проверялась.
- **Квота.** `getStateInstance` — 1, синхронизация — 1 (`getAccountSettings`, `getSettings`, `getChats`, `getContactInfo`, `getChatHistory` — по одному, все 200). `receiveNotification` — 5, `deleteNotification` — 0, `sendMessage` — 0, `checkAccount` — 0. 429 не было.
- **Креды и секреты.** Креды передал одноразовый helper на `127.0.0.1:5199`: он читал `.env.local`, ответил на один запрос с origin dev-сервера и завершился. Поля заполнялись через native setter, наружу возвращались только длины. «Войти» нажата реальным кликом.
  - Запросы к GREEN-API снимались только `browser_evaluate`: обёртка `fetch` (метод из пути, статус, время, форма тела) и Resource Timing (только имя метода). `browser_network_*` и `browser_console_messages` не вызывались.
  - Ключ сессии не читался, проверялось только `!== null`.
  - Лог консоли `.playwright-mcp/` (4 строки 408 с URL) целиком не читался. Строки с `green-api` выведены с заменой URL на `<url>` и маскированием длинных буквенно-цифровых и цифровых последовательностей. Остальные 2 строки — `INFO` React DevTools.
  - **Токен и idInstance в вывод инструментов не попадали.**
- **Teardown.** Выход через UI, localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` остановлен, helper `:5199` завершился сам; порты свободны. `.playwright-mcp/` и скрипт helper-а удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
