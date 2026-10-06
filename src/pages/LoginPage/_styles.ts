import styled from "styled-components";

import { Button } from "@/components/Button";

export const SWrapper = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 18px;
  background: ${({ theme }) => theme.palette.chatBackground};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    align-items: stretch;
    padding: 0;
    background: ${({ theme }) => theme.palette.surface};
  }
`;

export const SCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  border-radius: ${({ theme }) => theme.radii.panel};
  background: ${({ theme }) => theme.palette.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    justify-content: center;
    max-width: none;
    padding: max(32px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right))
      max(32px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));
    border-radius: 0;
  }
`;

export const SNotice = styled.div`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.item};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;

export const SHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/** Отступ над кнопкой больше, чем между полями: кнопка отделена от группы полей. */
export const SSubmit = styled(Button)`
  margin-top: 8px;
`;
