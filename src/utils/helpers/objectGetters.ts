/**
 * `Object.entries` с ключами исходного объекта.
 *
 * Встроенный `Object.entries` типизирует ключи как `string`, и каждому вызову пришлось бы приводить их обратно к `keyof T`.
 */
export function getEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
