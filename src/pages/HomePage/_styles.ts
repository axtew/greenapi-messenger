import styled from "styled-components";

export const SWrapper = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 18px;
`;

export const SPill = styled.div`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.datePill};
`;
