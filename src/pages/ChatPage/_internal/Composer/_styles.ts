import styled from "styled-components";

/** Высота строки текста в поле; от неё — вертикальные отступы и потолок высоты. */
const LINE_HEIGHT_PX = 22;

/** Сколько строк поле показывает без прокрутки. */
const MAX_VISIBLE_LINES = 5;

/** Вертикальный отступ поля: однострочное поле той же высоты, что кнопка отправки (44px). */
const TEXTAREA_PADDING_Y_PX = 11;

/** Белая плашка под лентой: поле ввода и кнопка отправки, прижатая к низу при многострочном тексте. */
export const SForm = styled.form`
  display: flex;
  flex-shrink: 0;
  align-items: flex-end;
  gap: 8px;
  margin-top: 8px;
  padding: 6px 6px 6px 20px;
  border-radius: ${({ theme }) => theme.radii.panel};
  background: ${({ theme }) => theme.palette.surface};
`;

export const STextarea = styled.textarea`
  flex: 1;
  min-width: 0;
  max-height: ${MAX_VISIBLE_LINES * LINE_HEIGHT_PX + 2 * TEXTAREA_PADDING_Y_PX}px;
  margin: 0;
  padding: ${TEXTAREA_PADDING_Y_PX}px 0;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
  /* 16px — иначе Safari на iOS зумит страницу при фокусе на поле. Не токен типографики:
     ограничение платформы, а не размер из шкалы. */
  font-size: 16px;
  line-height: ${LINE_HEIGHT_PX}px;
  color: ${({ theme }) => theme.palette.text};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.palette.textMuted};
  }
`;
