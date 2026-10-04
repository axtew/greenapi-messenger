# Pipeline profile — greenapi-messenger

Машиночитаемые факты, которые глобальный фронтенд-пайплайн (скиллы `frontend-plan` / `frontend-run` / `brainstorming`,
агенты `frontend-developer` / `frontend-reviewer` / `frontend-visual-reviewer`) читает первыми. Ищется через Glob `**/pipeline-profile.md`;
корень репозитория — `repo_root` ниже (не родитель этого файла).

**`pipeline_spec: none`.** Разделы, на которые ссылается `frontend-run` («Status & routing vocabulary», «Artifact layout», «Review scopes»),
скилл описывает у себя; «Commit & EXECUTION.md protocol» не нужен — при `commit_policy: owner` пайплайн не коммитит.
Владелец ревьюит фазу сам и отдельной командой говорит оркестратору «коммить» или «поправить».

**Язык артефактов.** Проза в `plans/` — на русском; заголовки разделов, статусы и ключи из шаблонов скиллов — как в шаблонах (их парсят скиллы).

**Живые проверки.** Креды тестового Telegram-инстанса GREEN-API — в `.env.local` (gitignored; формат — `.env.example`).
Ответ собеседника агент вызвать не может: получение на живом инстансе проверяет владелец руками, агент — через e2e со стабом GREEN-API.
`apiTokenInstance` не попадает ни в отчёты, ни в логи, ни в снапшоты.

**Дизайн.** Figma нет. Референс — веб-версии Telegram / MAX; скриншоты владелец даёт по запросу (`docs/design/`).

```yaml
project: greenapi-messenger
repo_root: C:/Users/stevv/Desktop/greenapi-messenger # frontend-run читает этот ключ явно; при переносе папки поправить
conventions: AGENTS.md # короткая карта; агенты идут по её таблице «что читать» в docs/agents/
pipeline_spec: none
plans_dir: plans/ # plans/<slug>/plan.md, baseline/, <phase>/iter-<N>/
commands:
  dev: pnpm dev
  format: pnpm format # только `src` — так задан скрипт в package.json
  lint: pnpm lint # всегда целиком, не по файлам
  build: pnpm build
  test: pnpm test # vitest run
design:
  source: none # Figma нет: экраны — `Free choice` по референсу веб-версии Telegram / MAX
visual_verification:
  enabled: true # frontend-visual-reviewer через Playwright MCP на `pnpm dev`; креды из .env.local
i18n:
  enabled: true
  dictionaries: public/dictionaries/ # только ru.json
comments_language: ru
commit_policy: owner # пайплайн не коммитит; владелец ревьюит фазу и сам говорит, когда коммитить
```
