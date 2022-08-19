/**
 * Interface that represents the player data.
 */
export interface IPlayer {
  /**
   * Property that represents the player id.
   */
  id: string

  /**
   * Property that represents the player nickname.
   */
  nickname: string

  /**
   * Property that represents the player score in the current
   * match.
   */
  score: number

  /**
   * Property that defines the player health.
   */
  health: number

  /**
   * Property that defines the player maximum health.
   */
  maxHealth: number

  /**
   * Property that represents the spaceship visual details.
   */
  spaceship: {
    /**
     * Property that represents the spaceship color.
     */
    color: string

    /**
     * Property that represents the spaceship color name.
     */
    colorName: string
  }
}
