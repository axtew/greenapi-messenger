import styled from "styled-components";

export const SLayout = styled.div`
  display: flex;
  height: 100dvh;
  background: ${({ theme }) => theme.palette.chatBackground};
`;

/** Правая колонка — место открытого экрана; на узком экране скрыта, видна только левая панель. */
export const SContent = styled.main`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobileMax}) {
    display: none;
  }
`;
