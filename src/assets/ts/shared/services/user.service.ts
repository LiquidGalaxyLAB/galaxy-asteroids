import { AbstractService, Service, v4 } from '@asteroids'

import { BehaviorSubject } from 'rxjs'

/**
 * Service that deals with the user management.
 */
@Service()
export class UserService extends AbstractService {
  /**
   * Property that keeps the user score.
   */
  private readonly _score = new BehaviorSubject(0)

  /**
   * Property that defines the user id.
   */
  userId = v4()

  /**
   * Property that defines the user nickname.
   */
  nickname = 'GUEST'

  /**
   * Property that defines the user spaceship color.
   */
  color = '#888888'

  /**
   * Property that defines the user spaceship image.
   */
  image = 'grey'

  /**
   * Observable that keeps tracking the user score changes.
   */
  get score$() {
    return this._score.asObservable()
  }

  /**
   * Property that defines the user current score.
   */
  get score() {
    return this._score.value
  }

  /**
   * Increases the current user score according to the given `amount`.
   *
   * @param amount the amount of points to be increased.
   */
  increaseScore(amount: number) {
    this._score.next(this.score + amount)
  }

  /**
   * Sets the user current score according to the given `amount`.
   *
   * @param amount the score to be set.
   */
  setScore(amount: number) {
    this._score.next(amount)
  }

  /**
   * Resets the user score to 0.
   */
  resetScore() {
    this._score.next(0)
  }
}
