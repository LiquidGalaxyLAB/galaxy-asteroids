/**
 * Generates a new `uuid v4` string.
 *
 * @returns the `uuid` value.
 *
 * @example
 * v4() => '9fc79f9f-a681-48ee-9726-1ac7eab937fd'
 * v4() => '6ab70dd4-f746-4dd5-90f4-b42259b621c9'
 */
export function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8

    return v.toString(16)
  })
}
