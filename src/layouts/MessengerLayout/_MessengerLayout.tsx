import { Outlet } from "@tanstack/react-router";

import { Sidebar } from "./_internal/Sidebar";
import { SContent, SLayout } from "./_styles";
import { useMessengerLayout } from "./_useMessengerLayout";

/**
 * Каркас защищённой части: левая панель и экран текущего роута справа; пока каркас на экране, приходят новые сообщения.
 *
 * `data-chat-open` переключает узкий экран между панелью и открытым чатом — раскладку меняет только CSS.
 */
export function MessengerLayout() {
  const { isChatOpen } = useMessengerLayout();

  return (
    <SLayout data-chat-open={isChatOpen}>
      <Sidebar />
      <SContent>
        <Outlet />
      </SContent>
    </SLayout>
  );
}
