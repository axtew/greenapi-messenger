import { Outlet, useParams } from "@tanstack/react-router";

import { Sidebar } from "./_internal/Sidebar";
import { SContent, SLayout } from "./_styles";

/**
 * Каркас защищённой части: левая панель и экран текущего роута справа.
 *
 * `data-chat-open` переключает узкий экран между панелью и открытым чатом — раскладку меняет только CSS.
 */
export function MessengerLayout() {
  const { chatId } = useParams({ strict: false });

  return (
    <SLayout data-chat-open={chatId !== undefined}>
      <Sidebar />
      <SContent>
        <Outlet />
      </SContent>
    </SLayout>
  );
}
