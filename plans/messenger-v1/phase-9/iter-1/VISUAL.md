STATUS: APPROVED
Issue source: none

## Summary
На живом инстансе (1440×900) проверены все строки Phase 9: `poller_running`, `send_no_duplicate`, `single_consumer`, `no_settings_warning`, `logout_stops_poller` и `raw_values_in_ui`. Все строки PASS. Цикл получения работает: непустое уведомление удаляется по своему `receiptId`, эхо отправки не даёт второго пузыря, очередь читает одна вкладка, после выхода запросы прекращаются.

Отдельно найдено расхождение API с планом и `brainstorm.md`, дефектом приложения оно не является. Пустой long-poll у GREEN-API сейчас чаще заканчивается **HTTP 408** (`nginx`, тело пустое), а не `200 null`. Это подтверждено сырыми ответами из Node на обоих хостах, без участия приложения. Poller переживает такие ответы паузой и продолжает работу. Подробности и предложение — в Notes.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/chat/<test_chat_id>` после отправки и эха, плюс `/login` после выхода. Проверены текст `aside` и `main`, атрибуты `aria-label` / `placeholder` / `title` и `<title>`: нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`chat.`, `sidebar.`, `settingsWarning.`, `common.`, `sendErrors.`), членов `enum` (`PEER_FLOOD`, `GENERIC`) и U+FFFD. Атрибуты: `Меню`, `Новый чат`, `Назад`, `Сообщение`, `Отправить`, а также `Open Tanstack query devtools` (это dev-инструменты). Превью списка — «Artur Ovcharenko / 16:58 / Проверка получения 1» | | item_specific | |
| poller_running | poller | PASS | Обёртка `fetch` поставлена до входа, «Войти» нажата реальным кликом. `receiveNotification?receiveTimeout=20` стартует через 5 мс после `getChats`, одновременно в полёте всегда один запрос. **Непустые:** длинный запрос, начатый ещё до отправки, вернул **200** через 18 539 мс: `receiptId` 20, `outgoingAPIMessageReceived` (эхо, `idMessage` совпал с ответом `sendMessage`). Через 3 мс после него — `deleteNotification` **20** → 200 `{result:true}`. Следующий `receiveNotification` за 294 мс получил `receiptId` 21, `outgoingMessageStatus` `delivered`, сразу за ним `deleteNotification` **21** → 200 `{result:true}`. Двум непустым соответствуют два удаления с теми же `receiptId` и в том же порядке. **Пустые:** 200 `null` за 20 291 мс, затем снова длинный запрос. Остальные пустые циклы заканчивались **408** от GREEN-API (см. Notes): цикл не останавливался, пауза перед следующим запросом — 1 с, потом 2 с. Старых уведомлений в очереди не было: первые запросы вернули 408 или эхо, а не накопленное. Консоль приложения: 0 ошибок и 0 предупреждений | | shared | |
| send_no_duplicate | poller | PASS | Тестовый чат открыт реальным кликом по строке списка, `location.pathname` сверен в браузере с `GREEN_API_TEST_CHAT_ID` → true. «Проверка получения 1» + реальный Enter: `sendMessage` 200, `chatId` тестовый, `idMessage` 13 символов. Пузырь появился до ответа сервера, поле очищено и в фокусе. Через 0,3 с пришло эхо (`receiptId` 20), затем статус `delivered` (21), затем пустой цикл. В `main` ровно **1** текстовый узел «Проверка получения 1»: и сразу после эха, и в 25 замерах раз в секунду, и после следующего цикла. Пузырь справа (`justify-content: flex-end`), фон `rgb(238,255,222)` (`bubbleOutgoing`), время `16:58` совпадает с серверным `timestamp` (16:58:21), `opacity: 1` (SENT), подписи «Не доставлено» нет | | item_specific | |
| single_consumer | poller | PASS | Вкладка B открыта `window.open("/")` из A: тот же контекст браузера и тот же origin. Обёртка `fetch` в B поставлена до старта цикла. Пока блокировкой владела A, у B за ~95 с были только запросы синхронизации (`getAccountSettings`, `getSettings`, `getChats`, `getChatHistory`), `receiveNotification` — **0** и в обёртке, и в Resource Timing. Документ приложения в A выгружен переходом на `/favicon.svg` → B сразу начала `receiveNotification`. Обратная передача проверена **настоящим закрытием вкладки**: A снова на `/`, ждёт блокировку, `receiveNotification` у A — 0. После `b.close()` первый `receiveNotification` в A ушёл через **31 мс**, состояние блокировки poller-а: held 1, pending 0. Больше одного одновременного `receiveNotification` не было ни в одной вкладке | | item_specific | |
| no_settings_warning | settings | PASS | `getSettings` 200 при каждой из трёх загрузок каркаса: `webhookUrl` — пустая строка, `incomingWebhook: "yes"`. Из Node дополнительно: `outgoingWebhook` / `outgoingMessageWebhook` / `outgoingAPIMessageWebhook` = `yes`. В `aside` нет `[role=status]`, текста предупреждения нет. Панель: «Чаты / Artur Ovcharenko / время / превью» | | item_specific | |
| logout_stops_poller | poller | PASS | Перед выходом в A шёл `receiveNotification`, вкладка B уже закрыта. Реальный клик «Меню» → «Выйти» → полная перезагрузка на `/login` (h1 «Вход», без `?reason`). За 36,6 с на новой странице **0** запросов к GREEN-API (Resource Timing), блокировка poller-а: held 0 / pending 0, сессии нет (булева проверка) | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "aside/main/aria-label/placeholder/title на /chat/<test_chat_id> и /login: только значения ru.json и HH:MM; undefined/NaN/null/[object/ключей/enum/U+FFFD нет"
      root_cause_scope: item_specific
    - check_id: poller_running
      dependency_group: poller
      status: PASS
      evidence: "receiveNotification(20) длинные запросы по одному; непустые receiptId 20 (эхо) и 21 (delivered) -> deleteNotification 20 и 21 (200, result:true) сразу за каждым; пустой цикл 200 null за 20,3 с; прочие пустые циклы — 408 от GREEN-API, цикл продолжается с паузой 1 и 2 с"
      root_cause_scope: shared
    - check_id: send_no_duplicate
      dependency_group: poller
      status: PASS
      evidence: "«Проверка получения 1» -> sendMessage 200; эхо outgoingAPIMessageReceived с тем же idMessage + delivered; в main ровно 1 текстовый узел в 25 замерах и после следующего цикла; время 16:58 = серверный timestamp; SENT"
      root_cause_scope: item_specific
    - check_id: single_consumer
      dependency_group: poller
      status: PASS
      evidence: "B при живой A: receiveNotification 0 за ~95 с; выгрузка A -> B сразу начинает; обратно: b.close() -> A начинает через 31 мс; held 1 / pending 0"
      root_cause_scope: item_specific
    - check_id: no_settings_warning
      dependency_group: settings
      status: PASS
      evidence: "getSettings 200: webhookUrl пустой, incomingWebhook yes; в aside нет [role=status]"
      root_cause_scope: item_specific
    - check_id: logout_stops_poller
      dependency_group: poller
      status: PASS
      evidence: "Выйти -> /login полной перезагрузкой; 36,6 с без запросов к GREEN-API; блокировка не держится и не ожидается; сессии нет"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. `SettingsWarning` (`Free choice`) у тестового инстанса не рендерится: настройки верные. Его вид на живом инстансе не проверить без порчи настроек инстанса, поэтому он остаётся за unit- и e2e-тестами (Phase 10).

## Notes
- **Расхождение API с планом и `brainstorm.md` — на решение владельца (не дефект кода).** `brainstorm.md` («Проверено на реальном инстансе»): «Пустая очередь по таймауту — тело `null`, статус 200». Сейчас GREEN-API на пустой long-poll чаще отвечает **408 Request Timeout** (`server: nginx`, тело пустое, 0 байт).
  - **Причина на стороне GREEN-API подтверждена сырыми ответами**, не через приложение. Разовый Node-скрипт выводил только статус, время, заголовок `server` и форму тела. `receiveTimeout=5`: общий хост — 408 за 11,1 с (дважды), хост инстанса — 408 за 16,9 с. `receiveTimeout=20`: общий хост — 408 за 26,1 с.
  - **Ответы смешанные.** В том же окне был и `200 null` за 20,3 с. Когда в очереди есть уведомление, запрос возвращает его с 200 сразу. Почему GREEN-API отвечает 408, неизвестно: это сторона сервиса.
  - **В браузере 408 растягивается.** Длительности 25,9 / 51,2 / 76,5 / 76,6 / 102,2 с кратны ~25,5 с. Это похоже на автоматический повтор запроса Chrome после 408 на переиспользованном соединении. Это **гипотеза**, механизм не подтверждён.
  - **Последствие для приложения.** Poller делает то, что задано планом: любая ошибка, кроме 401, даёт паузу, которая растёт 1 → 2 → 4 … 30 с и сбрасывается только после 200. При серии 408 на пустой очереди пауза дорастает до 30 с. Всё это время запроса в полёте нет, и входящее приходит с задержкой до ~30 с. Сообщения не теряются: уведомление ждёт в очереди.
  - **Вариант — гипотеза, перед реализацией проверить.** Считать 408 от `receiveNotification` пустым циклом: без паузы и со сбросом `delay`. Решение за владельцем: поправка плана или `BACKLOG.md`.
- **Наблюдение без влияния на поведение (только симптом).** В ждущей вкладке сразу после полной загрузки страницы `navigator.locks.query()` показывал **2** ожидающих запроса блокировки poller-а с одного клиента; воспроизвелось дважды, в B и в A. После передачи блокировки выполняется один цикл: held 1, pending 0, один `receiveNotification` в полёте. Значит, один из двух запросов при выдаче сразу освобождается. Браузер сам по себе корректен: отдельная проба (запрос с `signal` + `abort()` в том же такте) удаляет запрос из очереди. Откуда второй запрос, не установлено. Дублей чтения очереди нет.
- **Квота.** `getStateInstance` — 2 (два входа). Синхронизаций — 4: два входа, вкладка B, повторная загрузка A. `getContactInfo` — 1, только при первой синхронизации; дальше профиль брался из кэша. `getChatHistory` `count:1` — 4, `count:100` — 1. **`sendMessage` — 1 реальный** («Проверка получения 1», только тестовый чат, перед отправкой `location.pathname` сверен в браузере → true). `checkAccount` — 0. 429 не было. Входящее от собеседника не вызывалось: эту проверку владелец делает руками.
- **Креды и секреты.** Креды в браузер передавал одноразовый helper на `127.0.0.1:5199`. Он читал `.env.local`, отвечал на один запрос с origin dev-сервера и завершался. Запускался дважды, по одному разу на каждый вход. Поля заполнялись через native setter, наружу возвращались только длины. «Войти» нажата реальным кликом.
  - Запросы к GREEN-API снимались только `browser_evaluate`: обёртки `fetch` (метод из пути, `receiptId` из пути `deleteNotification`, статус, время, разобранные в браузере поля тела) и Resource Timing (только имя метода). `browser_network_requests` / `browser_network_request` / `browser_console_messages` не вызывались.
  - Ключ сессии не читался, проверялось только его наличие: `!== null`. Тексты уведомлений возвращались только для тестового чата, `instanceData` не возвращался.
  - Пять ответов 408 Chrome записал в лог консоли `.playwright-mcp/` вместе с URL запроса, где лежит токен. Этот лог не читался (только `grep -c`) и удалён при teardown. В вывод инструментов попадало только число ошибок.
  - Диагностический Node-скрипт печатал только статус, время, `server` и ключи тела.
  - **Токен и idInstance в вывод инструментов не попадали.** chatId тестового чата виден в выводе инструментов как часть URL страницы, username собеседника — в одном выводе текста шапки чата. В отчёт ни то ни другое не перенесено.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт, вкладка B закрыта ещё в ходе проверки. Dev-сервер `:5173` остановлен, helper `:5199` завершался сам; порты свободны. `.playwright-mcp/`, скрипты helper-а и диагностики удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
