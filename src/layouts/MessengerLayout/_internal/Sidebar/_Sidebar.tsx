import { H3 } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";

import { AccountMenu } from "./_internal/AccountMenu";
import { SHeader, SRoot } from "./_styles";

/** Левая панель мессенджера: шапка с меню аккаунта. */
export function Sidebar() {
  const l = useI18nSelector(({ l }) => l.sidebar);

  return (
    <SRoot>
      <SHeader>
        <AccountMenu />
        <H3 as="h2">{l.title}</H3>
      </SHeader>
    </SRoot>
  );
}
