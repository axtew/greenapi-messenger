import { type FocusEvent, type KeyboardEvent, useId, useRef, useState } from "react";

import { useAccountQuery } from "@/api/queries/account.queries";
import { signOut } from "@/api/session";
import { IconButton } from "@/components/IconButton";
import { LogoutIcon, MenuIcon } from "@/components/icons";
import { Skeleton } from "@/components/Skeleton";
import { B1, Caption } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import { EKeyboardKey } from "@/types/common.types";
import { formatContactHandle } from "@/utils/helpers/contactFormat";

import { SAccount, SBackdrop, SDropdown, SLogoutButton, SRoot } from "./_styles";

/**
 * Ref-callback выпадающего блока: переводит в него фокус при открытии меню.
 *
 * Без этого фокус после клика остаётся на `body` (Safari и Firefox на macOS не фокусируют кнопку по клику),
 * и `Escape` не доходит до обработчика корня. Функция объявлена вне компонента: стабильная ссылка вызывается
 * только при монтировании и размонтировании, а не на каждом рендере — иначе фокус возвращался бы в блок при каждом обновлении.
 */
function focusOnMount(node: HTMLElement | null) {
  node?.focus();
}

/** Кнопка-гамбургер с выпадающим меню: подключённый аккаунт и выход. */
export function AccountMenu() {
  const l = useI18nSelector(({ l }) => l.sidebar);
  const dropdownId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: account, isPending } = useAccountQuery();

  const accountLine = account === undefined ? null : formatContactHandle(account);

  const close = () => setIsOpen(false);

  const onKeyDown = (event: KeyboardEvent) => {
    if (isOpen && event.key === EKeyboardKey.ESCAPE) {
      // Отмена события: это `Escape` закрывает только меню, открытый чат остаётся.
      event.preventDefault();
      close();
      menuButtonRef.current?.focus();
    }
  };

  /**
   * Закрывает меню, когда фокус ушёл на элемент вне него (например, `Tab` из последнего пункта).
   *
   * `relatedTarget === null` (фокус ушёл на `body` или из окна) меню не закрывает: так бывает и при клике мышью
   * по кнопке в Safari, и закрытие на `mousedown` съело бы клик по «Выйти» или подложке. Клик вне меню закрывает подложка.
   */
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (
      isOpen &&
      event.relatedTarget !== null &&
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      close();
    }
  };

  return (
    <SRoot onKeyDown={onKeyDown} onBlur={onBlur}>
      <IconButton
        ref={menuButtonRef}
        aria-label={l.menuButton}
        aria-expanded={isOpen}
        aria-controls={isOpen ? dropdownId : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <MenuIcon />
      </IconButton>

      {isOpen && (
        <>
          <SBackdrop type="button" tabIndex={-1} aria-hidden onClick={close} />

          <SDropdown id={dropdownId} ref={focusOnMount} tabIndex={-1}>
            {(isPending || accountLine !== null) && (
              <SAccount>
                <Caption color="textMuted">{l.accountLabel}</Caption>
                {isPending ? <Skeleton width="60%" height="22px" /> : <B1>{accountLine}</B1>}
              </SAccount>
            )}

            <SLogoutButton type="button" onClick={() => signOut()}>
              <LogoutIcon />
              <B1 as="span">{l.logoutButton}</B1>
            </SLogoutButton>
          </SDropdown>
        </>
      )}
    </SRoot>
  );
}
