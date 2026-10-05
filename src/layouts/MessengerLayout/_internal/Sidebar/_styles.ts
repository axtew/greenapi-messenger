import styled from "styled-components";

/** Левая панель: на широком экране — карточка с отступом от краёв окна, на узком — весь экран. */
export const SRoot = styled.aside`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 420px;
  min-height: 0;
  margin: 18px;
  margin-right: 0;
  border-radius: ${({ theme }) => theme.radii.panel};
  background: ${({ theme }) => theme.palette.surface};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    width: 100%;
    margin: 0;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
    border-radius: 0;
  }
`;

export const SHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
`;
