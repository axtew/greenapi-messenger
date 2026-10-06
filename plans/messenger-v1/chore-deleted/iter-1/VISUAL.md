STATUS: APPROVED
Issue source: none

## Summary
Заход `chore-deleted` проверен на живом инстансе (1440×900 и 1440×450). В ленте тестового чата обе записи удаления показаны заглушкой «Сообщение удалено» курсивом в `textMuted` со временем. Старых текстов удалённых сообщений и осиротевшей правки в DOM нет. После свежей синхронизации в превью списка заглушка и время, `lastMessage` в хранилище не `null`. Все четыре строки матрицы и постоянная `raw_values_in_ui` — PASS. Квота: `getContactInfo` — 1, `checkAccount` — 0, `sendMessage` — 0.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/chat/<test_chat_id>` 1440×450. В тексте `aside` + `main` + aria-label нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`chat.`, `sidebar.`, `common.`) и U+FFFD. aria-label: `Меню`, `Новый чат`, `Назад` и `Open Tanstack query devtools` (последний — от dev-инструментов). Пилюли `3 октября` / `4 октября` / `Сегодня`, заглушка `Сообщение удалено` — значения `ru.json`. `<title>` — `GREEN-API Messenger`. `console.error` / `console.warn` / `window.onerror` за прогон — 0 / 0 / 0 | | item_specific | |
| deleted_placeholder_in_chat | history | PASS | Сырой ответ `getChatHistory` `count:100`: 11 записей, две с `isDeleted: true`. **#4** — `outgoing`, ts 04.10 13:53:59, `textMessage` из 76 символов, 42 из них U+FFFD. **#0** — `incoming`, ts 06.10 12:44:22, текст из 18 символов без U+FFFD. В DOM 10 пузырей, заглушек `Сообщение удалено` ровно 2. **OUT 13:53 (4 октября):** справа (`flex-end`), фон `rgb(238,255,222)` (`bubbleOutgoing`). Пометка — `font-style: italic`, `color: rgb(112,117,121)` (`textMuted` `#707579`), цвет `B1` тоже `textMuted`. Время `13:53` цветом `metaOutgoing` `rgb(79,174,78)`. **IN 12:44 (Сегодня):** слева, фон `rgb(255,255,255)` (`surface`), хвостик есть. Пометка italic `textMuted`, время `12:44` цветом `textMuted`. Старые тексты обеих записей удаления в `main.innerText` не найдены (поиск по первым 15 символам). U+FFFD в `main` нет. Кнопок внутри пузырей — 0, «Показать» нет: единственная кнопка в `main` — `Назад` | | item_specific | |
| deleted_preview_in_list | list | PASS | Свежий браузер (localStorage пуст, сессии нет), вход → синхронизация: `getChats`, `getContactInfo` (1), `getAccountSettings`, `getChatHistory` `count:1`, все 200. Сырой ответ `count:1`: одна запись, `incoming`, `isDeleted: true`, ts `1791265462` (06.10 12:44:22). Строка тестового чата в списке: `Artur Ovcharenko / 12:44 / Сообщение удалено`. Превью `Сообщение удалено`: `font-style: italic`, `color: rgb(112,117,121)` (`textMuted`), 16px, `text-overflow: ellipsis`, `white-space: nowrap`. Выбранный чат (фон `rgb(51,144,236)`): превью italic `rgb(255,255,255)` (`onPrimary`), ellipsis, `overflow: hidden`. Старый текст записи в `aside` не найден. `greenapi-messenger:chats:*` (одна запись) → `lastMessage = {text: null, timestamp: 1791265462, direction: "incoming", isDeleted: true}`, не `null` | | item_specific | |
| edited_deleted_not_duplicated | history | PASS | Связи в сыром ответе. У записи удаления **#0** `editedMessageId` = `idMessage` записи правки **#1**: `incoming`, ts 12:44:08, 30 символов. `deletedMessageId` записи #0 = `editedMessageId` записи #1, то есть id оригинала, а самого оригинала в истории нет. У #0 `replacesId` = `editedMessageId` → убирается #1. Оригинал убрала бы сама #1, но его в ответе нет. **Что видно вокруг самой новой заглушки:** после пузыря OUT `14:49` (4 октября) идёт пилюля `Сегодня`, под ней один пузырь — IN `12:44` «Сообщение удалено» (с хвостиком, последний в ленте). Текста правки #1 в `main.innerText` нет. 11 записей → 10 пузырей: минус #1 | | item_specific | |
| no_regressions | history | PASS | Реальный клик по чату → `getChatHistory` `count:100`, 200. Порядок: `3 октября`: IN 22:44, OUT 22:44, IN 23:05 (ссылка). `4 октября`: IN 13:31 ×3 (хвостик только у третьего), OUT 13:53 (заглушка), OUT 13:54 (правленое, ссылка), OUT 14:49 (хвостик). `Сегодня`: IN 12:44 (заглушка). Пузыри: IN `surface`, слева, время `textMuted`. OUT `bubbleOutgoing`, справа, время `metaOutgoing`. Обе ссылки: `<a href="https://green-api.com" target="_blank" rel="noopener noreferrer">`, цвет `rgb(51,144,236)` (`primary`). Тексты всех 8 обычных записей есть в DOM. Автопрокрутка: 1440×900 — лента помещается (`scrollHeight` 808 = `clientHeight` 808). 1440×450, повторное открытие реальным кликом: `scrollTop` 227.2, `clientHeight` 358, `scrollHeight` 585, разница −0.2 px. Низ последней заглушки 407 при низе ленты 432. Горизонтального переполнения документа нет (0) | | shared | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "aside/main/aria-label на /chat/<test_chat_id>: только значения ru.json, HH:MM, даты; undefined/NaN/null/[object/ключей/U+FFFD нет; console.error/warn/onerror 0"
      root_cause_scope: item_specific
    - check_id: deleted_placeholder_in_chat
      dependency_group: history
      status: PASS
      evidence: "2 записи isDeleted в сыром ответе → 2 заглушки «Сообщение удалено» italic rgb(112,117,121) со временем (OUT 13:53 4 окт, IN 12:44 сегодня); старые тексты (в т.ч. 42×U+FFFD) в DOM нет; кнопок в пузырях 0"
      root_cause_scope: item_specific
    - check_id: deleted_preview_in_list
      dependency_group: list
      status: PASS
      evidence: "свежая синхронизация, count:1 → isDeleted:true; строка списка «12:44 / Сообщение удалено» italic textMuted (выбранный — onPrimary); localStorage chats:* lastMessage {text:null, ts:1791265462, incoming, isDeleted:true}"
      root_cause_scope: item_specific
    - check_id: edited_deleted_not_duplicated
      dependency_group: history
      status: PASS
      evidence: "сырой ответ: #0.editedMessageId = #1.idMessage, #0.deletedMessageId = #1.editedMessageId (оригинала в истории нет); под «Сегодня» только заглушка IN 12:44, текста правки #1 в DOM нет; 11 записей → 10 пузырей"
      root_cause_scope: item_specific
    - check_id: no_regressions
      dependency_group: history
      status: PASS
      evidence: "3 пилюли по дням, IN surface / OUT bubbleOutgoing, хвостики у последних в группе, 2 ссылки target=_blank rel=noopener noreferrer primary; автопрокрутка 1440x450: разница -0.2 px"
      root_cause_scope: shared
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. У поправки (16) поверхности — `Free choice` по референсу Telegram. Значения сверял с поправкой: курсив, `textMuted`, время, кнопки «Показать» нет.

## Notes
- **Known issue 1 из DEV-REPORT снят живыми данными (root cause confirmed по сырому телу ответа).** У новейшей записи удаления обе ссылки: `editedMessageId` указывает на саму запись правки, `deletedMessageId` — на оригинал (= `editedMessageId` записи правки). Сервис берёт `editedMessageId || deletedMessageId`, то есть первую ссылку, и убирает запись правки. Оригинал, окажись он в ответе, убрала бы сама запись правки: `replacedIds` в `mergeMessages` собирается по всем записям, до фильтрации. Пока API даёт ссылки в такой форме, дублирования нет. Это наблюдение на одном случае, а не гарантия формы.
- **Позиция заглушек.** Удаление #0 стоит в 12:44:22, через 14 с после правки #1 (12:44:08), на которую оно ссылается. Это подтверждает вывод разработчика: `timestamp` записи удаления — время удаления. Заглушка #4 стоит на 4 октября в 13:53, перед правленым 13:54: по своему времени, как задумано в поправке.
- **Квота.** Вход — `getStateInstance` (1). Свежая синхронизация — `getChats`, `getContactInfo` (**1**), `getAccountSettings`, `getChatHistory` `count:1`. Ещё 2 открытия чата реальным кликом — 2 × `getChatHistory` `count:100`. Все ответы 200, 429 не было. `checkAccount` и `sendMessage` — 0.
- **Креды и секреты.** Одноразовый helper на `127.0.0.1:5199` прочитал `.env.local` и отдал креды один раз. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Сеть снималась обёрткой `fetch`, которая записывала только имя метода из пути, `count`, статус и время. Сырые тела `getChatHistory` разбирались в браузере, наружу уходили только флаги, длины, совпадения id и короткие начала текстов. Ключ сессии не читался: была только булева проверка до входа. `browser_network_requests` и `browser_console_messages` не вызывались. **Токен и idInstance в вывод инструментов не попадали.** chatId тестового чата виден в выводе инструментов как часть URL страницы (`Page URL`), в отчёт не перенесён.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` (снапшоты страниц) и скрипт helper удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
