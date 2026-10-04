# GREEN-API Messenger — инструкции для агентов

Веб-чат для отправки и получения текстовых сообщений в **Telegram** через GREEN-API: React SPA без своего бэкенда.
Тестовое задание; что требуется и что нельзя заменять — [`docs/task.md`](docs/task.md).

## Перед работой

1. [`plans/README.md`](plans/README.md) — какая задача и фаза сейчас в работе.
2. [`docs/decisions/`](docs/decisions/README.md) — принятые решения (ADR). При расхождении с чем угодно приоритет у них.
3. Файлы из таблицы ниже — по тому, что трогает задача.

## Что читать под задачу

| Задача трогает | Читать |
|---|---|
| любой код в `src/` | [`conventions/code-style.md`](docs/agents/conventions/code-style.md), [`conventions/structure.md`](docs/agents/conventions/structure.md), [`conventions/typing.md`](docs/agents/conventions/typing.md), [`conventions/stack.md`](docs/agents/conventions/stack.md) |
| компоненты, страницы | + [`conventions/components.md`](docs/agents/conventions/components.md), [`conventions/styling.md`](docs/agents/conventions/styling.md) |
| пользовательские тексты, `public/dictionaries/` | + [`conventions/i18n.md`](docs/agents/conventions/i18n.md) |
| `src/routes/`, навигацию, guard авторизации | + [`conventions/routing.md`](docs/agents/conventions/routing.md) |
| запросы к GREEN-API, poller, кэш, чаты | + [`architecture.md`](docs/agents/architecture.md) |
| тесты (vitest, Playwright) | + [`conventions/testing.md`](docs/agents/conventions/testing.md) |
| план, ревью, фазу пайплайна | [`pipeline-profile.md`](docs/agents/pipeline-profile.md) + всё, что трогает фаза |

## Команды

pnpm. Готово = `pnpm lint` и `pnpm build` проходят; есть unit-тесты — `pnpm test` тоже.

## Жёсткие правила

- **Путь данных один:** компонент → хук TanStack Query → сервис → клиент GREEN-API. Компонент не вызывает `fetch`.
- **Очередь уведомлений:** каждое полученное уведомление удаляется (включая нетекстовые), потребитель один — подробности в `architecture.md`.
- **chatId — только числовой** (из `checkAccount` или входящего), не `номер@c.us`.
- **Новые зависимости — только с разрешения владельца.**
- **Расхождение плана с реальностью** (API ведёт себя не как в плане, не хватает поля) — остановиться и сообщить, не обходить.
- **Коммиты делает владелец** после своего ревью. Формат — Conventional Commits. Никаких следов инструментов в git
  (`Co-Authored-By`, ссылок на сессии и т. п.).
- **Креды тестового инстанса** — только в `.env.local` (gitignored). `apiTokenInstance` не печатать в отчёты, логи и снапшоты.
- **Язык — русский** везде, включая комментарии, документацию и прозу в `plans/` ([ADR 0007](docs/decisions/0007-russian-language.md)).
  Заголовки, статусы и ключи из шаблонов пайплайна не переводятся — их читают скиллы.
- **Идея на будущее** — в [`BACKLOG.md`](BACKLOG.md), а не в текущую задачу.
