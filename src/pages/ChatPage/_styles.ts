import styled from "styled-components";

import { IconButton } from "@/components/IconButton";
import { H3 } from "@/components/Typography";

export const SWrapper = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  min-height: 0;
  padding: 18px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  }
`;

/** Колонка переписки по центру: шапка сверху, под ней лента и поле ввода. */
export const SColumn = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-width: 880px;
`;

export const SHeader = styled.header`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 6px 16px 6px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.surface};
`;

/** Возврат к списку чатов нужен только на узком экране: на широком список виден рядом. */
export const SBackButton = styled(IconButton)`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    display: flex;
  }
`;

export const SHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const SHeaderTitle = styled(H3)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
