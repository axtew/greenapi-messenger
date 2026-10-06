import { useInstanceSettingsQuery } from "@/api/queries/account.queries";
import { B2, Caption } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { SRoot } from "./_styles";

/**
 * Предупреждение о настройках инстанса, с которыми новые сообщения сюда не приходят.
 *
 * Только подсказка: пока настройки грузятся, не загрузились или в порядке, ничего не показывается.
 */
export function SettingsWarning() {
  const l = useI18nSelector(({ l }) => l.settingsWarning);

  const { data: settings } = useInstanceSettingsQuery();

  if (settings === undefined) {
    return null;
  }

  const hasWebhookUrl = settings.webhookUrl !== "";

  if (!hasWebhookUrl && settings.isIncomingEnabled) {
    return null;
  }

  return (
    <SRoot role="status">
      {hasWebhookUrl && <B2 color="danger">{l.webhookUrl}</B2>}
      {!settings.isIncomingEnabled && <B2 color="danger">{l.incomingDisabled}</B2>}
      <Caption color="textMuted">{l.hint}</Caption>
    </SRoot>
  );
}
