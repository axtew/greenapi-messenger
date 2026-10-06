import styled from "styled-components";

export const SRoot = styled.div`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.palette.datePill};
`;
