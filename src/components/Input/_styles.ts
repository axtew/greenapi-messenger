import styled from "styled-components";

export const SField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const SInput = styled.input`
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.palette.border};
  border-radius: ${({ theme }) => theme.radii.item};
  /* 16px — иначе Safari на iOS зумит страницу при фокусе на поле. Не токен типографики:
     ограничение платформы, а не размер из шкалы. */
  font-size: 16px;
  color: ${({ theme }) => theme.palette.text};
  background: ${({ theme }) => theme.palette.surface};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.palette.primary};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.palette.primary};
  }

  &[aria-invalid="true"] {
    border-color: ${({ theme }) => theme.palette.danger};
  }
`;
