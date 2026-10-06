import styled from "styled-components";

/** Плашка предупреждения под шапкой панели: красная полоса слева отделяет её от списка чатов. */
export const SRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 16px 8px;
  padding: 8px 12px;
  border-left: 3px solid ${({ theme }) => theme.palette.danger};
  border-radius: ${({ theme }) => theme.radii.item};
  background: ${({ theme }) => theme.palette.surfaceMuted};
`;
