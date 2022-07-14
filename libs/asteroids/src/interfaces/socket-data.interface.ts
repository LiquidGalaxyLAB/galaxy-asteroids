/**
 * Interface that represents the entity data emitted through socket.
 */
export interface ISocketData {
  /**
   * Property that represents the entity id.
   */
  id: string

  /**
   * Property that represents the entity type.
   *
   * @example
   * ```
   * 'spaceship'
   * ```
   */
  type: string

  /**
   * Property that represents the entity data.
   */
  data: Record<string, any>
}
