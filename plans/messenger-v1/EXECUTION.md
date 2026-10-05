# EXECUTION — messenger-v1

Task base: `ad54d82`
Diff base: working-tree (`commit_policy: owner` — пайплайн не коммитит, владелец коммитит после своего ревью)

## Log

- phase-1 / iter-1 — developer: COMPLETED (lint/build зелёные, baseline снят). Изменения в рабочем дереве, без коммита. Static review запущен.
- phase-1 / iter-1 — reviewer: NEEDS_CHANGES, Issue source: both. [code] необъяснённый `as I18n` в `_I18nContext.tsx`; [plan] `H2`/`H3`/`B1`/`B2`/`Caption` без импортёров (YAGNI vs план). Ждём решения владельца: amend / re-plan / skip.
- Владелец: amend, вариант (б) — шкала Typography экспортируется целиком как контракт фазы, `H2` удаляется. Запись в `## Amendments` плана.
- phase-1 / iter-2 — developer re-run (amendment + фикс `as I18n`): COMPLETED, lint/build зелёные. `H2` удалён, `fontSizes.lg` оставлен (теперь без потребителя). Static review запущен.
- phase-1 / iter-2 — reviewer: APPROVED. Фаза ждёт ревью и коммита владельца. Открытые вопросы владельцу: `H2` в тексте фазы (plan.md:84, :241), неиспользуемый `fontSizes.lg`, импортёр `H1` после Phase 3, favicon 404 для `app_boots`/`messenger_boots`.
- phase-1 закоммичена владельцем: `90512e2`.
- phase-2 / iter-1 — developer запущен (база — `90512e2`, Diff base: working-tree).
- phase-2 / iter-1 — developer: COMPLETED (test 29/29, lint/build зелёные). Отклонения: `services/_helpers.ts` вне плана; `IChat`/`IChatLastMessage` отложены до Phase 5; возможный пробел — `checkAccount` 200 + `{status:false}` при rate limit (до Phase 6). Static review запущен.
- phase-2 / iter-1 — reviewer: NEEDS_CHANGES, Issue source: both. [plan] `checkAccount` 200 + `{status:false, data.reason:"rate_limit_exceeded"}` не принимается схемой → Phase 6 покажет genericError; [code] неверный комментарий в `chats.schema.ts:3`. Ждём решения владельца.
- Владелец поправил `brainstorm.md` (два лимита `checkAccount`) и выбрал: amend Phase 2 (`kind: "rateLimited"`, новый ключ `newChat.searchRestrictedError` для 469, таблица Phase 6) и Phase 5 (`IChat`/`IChatLastMessage`); плюс необязательные замечания ревью: `cause` у `invalidResponse` только `ZodError`, `extendedTextMessage.text` optional, `ErrorOptions`, `clearSession` без экспорта.
- phase-2 / iter-2 — developer re-run: COMPLETED (test 32/32, lint/build зелёные). Static review запущен.
- phase-2 / iter-2 — reviewer: APPROVED. Ждёт ревью и коммита владельца. Открыто до Phase 3: `GreenApiError.kind` — union литералов или enum.
- Владелец: везде enum вместо литеральных union (кроме пропсов компонентов). Запись «Phases 2, 3, 6, 7, 9 — added 2026-10-05» в `## Amendments`.
- phase-2 / iter-3 — developer re-run (enum вместо литералов в слое GREEN-API): COMPLETED (test 32/32, lint/build зелёные). Новый `src/api/greenApi/_types.ts`; enum значений API — в `*.schema.ts`. Открыто владельцу: `EGreenApiMethod` для имён методов. Static review запущен.
- phase-2 / iter-3 — reviewer: APPROVED. Ждёт коммита владельца. Открыто: `EGreenApiMethod` (до Phase 9), исчерпывающий `switch`/`Record` для `message` по `kind`, favicon в Phase 3, правило enum в `typing.md`.
- Владелец: ок по всем трём. Запись «Phase 3 — added 2026-10-05» (favicon-самолётик, `EGreenApiMethod`, исчерпывающий выбор `message` по `kind`); правило «enum вместо литералов, кроме пропсов» добавлено в `docs/agents/conventions/typing.md`. Phase 3 — после коммита Phase 2.
- Открыто: favicon (404 на `/favicon.ico`) — владелец предлагает иконку отправки (Material Symbols `send`); решение и фаза — за владельцем.
