import { Vector2 } from '@asteroids'

/**
 * Interfaces that represents the bullet entity.
 */
export interface IBullet {
  /**
   * Property that indicates the direction that the bullet is heading to.
   */
  get direction(): Vector2

  /**
   * Property that indicates the user id that took the shot.
   */
  userId: string
}
