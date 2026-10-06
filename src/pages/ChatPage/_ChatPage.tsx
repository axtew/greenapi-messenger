import { ChatHeader } from "./_ChatHeader";
import { SColumn, SWrapper } from "./_styles";
import { useChatPage } from "./_useChatPage";

interface IChatPageProps {
  chatId: string;
}

/** Экран переписки с собеседником. */
export function ChatPage({ chatId }: IChatPageProps) {
  const { chat, isChatPending } = useChatPage(chatId);

  if (chat === undefined && !isChatPending) {
    return null;
  }

  return (
    <SWrapper>
      <SColumn>
        <ChatHeader chat={chat} />
      </SColumn>
    </SWrapper>
  );
}
