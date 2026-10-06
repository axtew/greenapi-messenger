import { Fragment } from "react";

import { B1, Caption } from "@/components/Typography";
import { useI18nSelector } from "@/context/I18nContext";
import { EMessageDirection, EMessageStatus } from "@/types/messages.types";
import { formatMessageTime } from "@/utils/helpers/dateFormat";

import { splitTextWithLinks } from "./_helpers";
import { SBubble, SLink, SMeta, SNotice, SRow } from "./_styles";
import { ETextPartKind, type IMessageBubbleProps } from "./_types";

/**
 * Пузырь сообщения: текст с кликабельными ссылками и время отправки.
 *
 * Удалённое сообщение показывается приглушённой пометкой «Сообщение удалено», нетекстовое (стикер, фото…) — пометкой о том,
 * что тип не поддерживается. Недоставленное — пометкой с причиной вместо времени; ещё не принятое сервером — полупрозрачным временем.
 */
export function MessageBubble({ message, isLastInGroup }: IMessageBubbleProps) {
  const l = useI18nSelector(({ l }) => l.chat);

  const isOutgoing = message.direction === EMessageDirection.OUTGOING;
  const isFailed = message.status === EMessageStatus.FAILED;

  return (
    <SRow $isOutgoing={isOutgoing} $isLastInGroup={isLastInGroup}>
      <SBubble $isOutgoing={isOutgoing} $isLastInGroup={isLastInGroup}>
        <B1 as="div" color={message.isDeleted ? "textMuted" : undefined}>
          {message.isDeleted || message.text === null ? (
            <SNotice>{message.isDeleted ? l.deletedMessage : l.unsupportedMessage}</SNotice>
          ) : (
            splitTextWithLinks(message.text).map((part, index) =>
              part.kind === ETextPartKind.LINK ? (
                <SLink key={index} href={part.value} target="_blank" rel="noopener noreferrer">
                  {part.value}
                </SLink>
              ) : (
                <Fragment key={index}>{part.value}</Fragment>
              ),
            )
          )}

          <SMeta $isPending={message.status === EMessageStatus.SENDING}>
            {isFailed ? (
              <Caption as="span" color="danger">
                {message.failReason === null
                  ? l.failedLabel
                  : `${l.failedLabel}: ${message.failReason}`}
              </Caption>
            ) : (
              <Caption as="span" color={isOutgoing ? "metaOutgoing" : "textMuted"}>
                {formatMessageTime(message.timestamp)}
              </Caption>
            )}
          </SMeta>
        </B1>
      </SBubble>
    </SRow>
  );
}
