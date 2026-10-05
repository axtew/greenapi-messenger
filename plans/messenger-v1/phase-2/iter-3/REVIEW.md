MODE: review
STATUS: APPROVED
Issue source: none

## Summary
Повторное ревью Phase 2 (iter-3) по пункту **Phase 2** поправки «Phases 2, 3, 6, 7, 9 — added 2026-10-05»: строковые литеральные union и сравнения с голыми строками заменены строковыми `enum`. Все шесть пунктов поправки выполнены. Схемы сужены только там, где API не присылает значений вне набора. Блокеров нет. Команды из `Verification` перезапущены и совпадают с отчётом, подмен нет: `pnpm test` — 32/32, `pnpm lint` — exit 0, `pnpm build` — exit 0, `prettier --check src` — чисто.

## Notes

**Пункты поправки — статус**

| Пункт поправки (Phase 2) | Статус | Где |
|---|---|---|
| `GreenApiError.kind` → enum (`HTTP`, `NETWORK`, `INVALID_RESPONSE`, `RATE_LIMITED`) | Сделано. Значения прежние, все `new GreenApiError(...)` и проверки в тестах используют члены enum. | `src/api/greenApi/_types.ts:6-15`, `src/api/greenApi/_client.ts:15,27-33,60,88,92,100`, `src/api/services/chats.service.ts:28-30` |
| `httpMethod` → enum (`GET`, `POST`) | Сделано. `DELETE` не добавлен — по поправке его добавит Phase 9. | `src/api/greenApi/_types.ts:17-20,25` |
| `signOut(reason?)` → enum причины (`EXPIRED = "expired"`) | Сделано. В URL подставляется само значение enum, а не захардкоженная строка. Без причины по-прежнему уходит на `/login`. | `src/api/session.ts:8-10,60-63` |
| Значения полей GREEN-API → enum из используемых значений | Сделано для всех шести полей из поправки: `stateInstance`, `incomingWebhook`, `data.reason`, `type`, `statusMessage`, `typeMessage`. | `src/api/schemas/{account,chats,messages}.schema.ts` |
| Схемы не сужаются там, где API может прислать значение вне enum | Соблюдено. `stateInstance`, `incomingWebhook`, `data.reason`, `typeMessage`, `statusMessage` остались `z.string()`. Сужен только `type` через `z.enum(EChatHistoryEntryType)`, и это не новое сужение: в iter-2 там уже стоял `z.enum(["incoming", "outgoing"])`, а по документации у записи истории других значений нет. Неизвестные значения закреплены тестами: `notAuthorized` (`api.test.ts:246`), `stickerMessage` (`:415`), `statusMessage: "read"` (`:396`), `incomingWebhook: "no"` (`:253`). | `src/api/schemas/messages.schema.ts:28` |

**Решение по вопросу разработчика: enum значений GREEN-API в `*.schema.ts` — принимается**

- Эти enum описывают допустимые значения полей **ответа API**. Значит, они принадлежат описанию формы ответа, а это и есть файл схемы домена. В `src/types/` им не место: по `typing.md` и `architecture.md` сырые формы API не выходят за сервис, а `src/types/` — сущности проекта.
- Сравнение с лестницей `structure.md`:
  - `EChatHistoryEntryType` нужен и схеме (`z.enum`), и сервису. Самый низкий уровень, покрывающий обоих, — файл схемы, потому что сервис его и так импортирует.
  - У остальных enum единственный потребитель — сервис, и строгая ступень 1 — внутри сервиса. Но тогда в `account.service.ts` и `messages.service.ts` оказалось бы по два объявления. Это порог выноса, и следующим шагом был бы общий `src/api/services/_types.ts` со смешением доменов, что противоречит группировке «по домену» из того же `structure.md`.
  - Файл схемы своего домена — единственное место, где выполняются оба правила сразу. У каждого такого enum есть импортёр вне файла (сервис домена).
- Отступлением от конвенций не считаю. Если владелец хочет закрепить правило, хватит одной строки в `structure.md` или `architecture.md`: «enum значений полей GREEN-API — в `*.schema.ts` своего домена». Это на его усмотрение.

**`ESignOutReason` — экспорт обоснован**

- Сейчас импортёр — только тест (`api.test.ts:13`). Но для Phase 2 план прямо принимает тест как импортёра (`Verification`: «Экспорты сервисов имеют импортёра — тест»). Тот же стандарт уже применён к `signOut`, `saveSession` и сервисам.
- Довод о завершении контракта тоже верен. `signOut` экспортирован и принимает строковый enum, а литерал `"expired"` ему не присвоить. Без экспорта enum параметр `reason` никто не смог бы передать.
- Потребители в Phase 3 названы: `_queryClient` и `validateSearch` роута логина. Находкой не считаю.

**Размещение `src/api/greenApi/_types.ts` — по правилам**

- Два enum и `IGreenApiRequestOptions` в `_client.ts` дали бы три объявления, а порог выноса по `structure.md` — два. Поэтому в `_types.ts` переехали все типы клиента.
- В barrel добавлены только два enum, их импортируют сервисы и тест. `IGreenApiRequestOptions` в barrel нет: его импортирует только `./_client`. Это соответствует правилу barrel.

**Литералов, которые могли бы стать enum, не осталось**

- Перепроверил grep'ом по всему `src`: нет `=== "…"` / `!== "…"`, нет `case "…"`.
- Строковый литеральный union остался один — `TTextColor` (`src/components/Typography/_styles.ts:7`). Это проп компонента из Phase 1, исключение владельца.
- `z.literal(true/false)` и `TCheckAccountResult.exists` — булевы дискриминанты. `"status" in result` — проверка наличия ключа, а не сравнение значения.

**На решение владельца (не блокирует)**

- **Имена методов GREEN-API.** Это `IGreenApiRequestOptions.method: string` и `GreenApiError.method: string` (`src/api/greenApi/_types.ts:24`, `_client.ts:18`).
  - Набор закрыт, так что по формулировке владельца «везде, где может быть enum» сюда подошёл бы `EGreenApiMethod`.
  - Это не union и не сравнение, и поправка этот пункт не перечисляет. Поэтому разработчик правильно не стал его делать сам, а вынес на решение.
  - Если делать, решить это нужно до Phase 9: она добавит `receiveNotification` / `deleteNotification`. Тогда нужна будет поправка плана и место enum. Логичное место — `src/api/greenApi/_types.ts`. Правда, по `architecture.md` имена методов знают только сервисы, поэтому можно рассмотреть и уровень сервисов.
  - Заодно уйдёт повтор строки `"checkAccount"` в `src/api/services/chats.service.ts:31`: сейчас оно записано и в `method:` запроса, и в `new GreenApiError(...)`.
- **`src/api/greenApi/_client.ts:26-33`.** Причина в `message` выбирается вложенным тернарником по `kind`.
  - `INVALID_RESPONSE` — неявная ветка «иначе». Если enum пополнится, новый член молча получит текст «ответ неожиданной формы».
  - Исчерпывающий `switch` или справочник `Record<EGreenApiErrorKind, …>` (`typing.md`) превратил бы забытый член в ошибку компиляции. Ветке `HTTP` нужен `status`, поэтому справочнику понадобится функция для этого значения.
  - Логика не менялась с iter-2, а поправка требовала только заменить литералы. Поэтому это наблюдение, а не находка.
- **Комментарии новых enum** проверены: устойчивые факты, первая строка — назначение, следов пайплайна нет. Мелкое несоответствие: у `EIncomingWebhook` (`account.schema.ts:8`) нет оговорки «схема не сужает», которая есть у соседних `EStateInstance` / `ETypeMessage` / `EStatusMessage`. Поведение от этого не меняется.
- **Текст плана.** В разделе Phase 2 плана (п. 1–3) всё ещё стоят литералы (`kind: "http" | …`, `signOut(reason?: "expired")`). Их перекрывает поправка, в коде расхождения нет. Синхронизировать текст — на усмотрение владельца. То же уже отмечалось в iter-2 про `clearSession`.
