import { Outlet } from "@tanstack/react-router";

import { Sidebar } from "./_internal/Sidebar";
import { SContent, SLayout } from "./_styles";

/** Каркас защищённой части: левая панель и экран текущего роута справа. */
export function MessengerLayout() {
  return (
    <SLayout>
      <Sidebar />
      <SContent>
        <Outlet />
      </SContent>
    </SLayout>
  );
}
