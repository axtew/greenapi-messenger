import { ChatHeader } from "./_ChatHeader";
import { MessageList } from "./_internal/MessageList";
import { SColumn, SWrapper } from "./_styles";
import { useChatPage } from "./_useChatPage";

interface IChatPageProps {
  chatId: string;
}

/**
 * Экран переписки с собеседником.
 *
 * Лента пересоздаётся при смене чата: её прокрутка и «первое получение данных» относятся к одному чату.
 * Пока чат ищут в списке, лента не запрашивается — адрес может указывать на чат, которого нет.
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
        {chat !== undefined && <MessageList key={chatId} chatId={chatId} />}
      </SColumn>
    </SWrapper>
  );
}
