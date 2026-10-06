/**
 * Текст, который поле ввода отправит, или `null`, если отправлять нельзя.
 *
 * Пустой после обрезки пробелов текст не отправляется. До загрузки истории чата — тоже: локальная запись отправленного
 * сообщения создала бы данные ленты раньше запроса истории, и ни история, ни её ошибка в этом заходе не показались бы.
 */
export function getMessageToSend(text: string, isHistoryLoaded: boolean): string | null {
  const message = text.trim();

  return message !== "" && isHistoryLoaded ? message : null;
}
