import { Fragment } from "react";

import { ChatHeader } from "./_ChatHeader";
import { Composer } from "./_internal/Composer";
import { MessageList } from "./_internal/MessageList";
import { SColumn, SWrapper } from "./_styles";
import { useChatPage } from "./_useChatPage";

interface IChatPageProps {
  chatId: string;
}

/**
 * Экран переписки с собеседником.
 *
 * Лента и поле ввода пересоздаются при смене чата (ключ — на общей обёртке): прокрутка, «первое получение данных»
 * и набранный текст относятся к одному чату. Пока чат ищут в списке, лента не запрашивается и поля ввода нет — адрес
 * может указывать на чат, которого нет.
 */
export function ChatPage({ chatId }: IChatPageProps) {
  const { chat, isChatPending } = useChatPage(chatId);

  if (chat === undefined && !isChatPending) {
    return null;
  }

  return (
    <SWrapper>
      <SColumn>
        <ChatHeader chat={chat} />
        {chat !== undefined && (
          <Fragment key={chatId}>
            <MessageList chatId={chatId} />
            <Composer chatId={chatId} />
          </Fragment>
        )}
      </SColumn>
    </SWrapper>
  );
}
