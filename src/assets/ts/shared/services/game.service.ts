import { AbstractService, Service } from '@asteroids'

import { BehaviorSubject } from 'rxjs'

/**
 * Service responsible for the management of the game.
 */
@Service()
export class GameService extends AbstractService {
  /**
   * Property responsible for keeping whether the player died.
   */
  private _gameOver = new BehaviorSubject(false)

  /**
   * Property responsible for keeping the current asteroid amount
   * on the game.
   */
  private _asteroidsAmount = new BehaviorSubject(0)

  /**
   * Property that defines the maximum asteroid amount in game,
   * limiting the generation of new non fragment asteroid.
   *
   * @default 10
   */
  maxAsteroidsAmount = 10

  /**
   * An observable that is triggered every time the game over is
   * updated.
   */
  get gameOver$() {
    return this._gameOver.asObservable()
  }

  /**
   * Property responsible for keeping the current game over status.
   */
  get gameOver() {
    return this._gameOver.value
  }

  /**
   * Property responsible for keeping the current game over status.
   */
  set gameOver(value: boolean) {
    this._gameOver.next(value)
  }

  /**
   * An observable that is triggered every time the asteroids amount
   * is updated.
   */
  get asteroidsAmount$() {
    return this._asteroidsAmount.asObservable()
  }

  /**
   * Property responsible for keeping the current asteroid amount
   * on the game.
   */
  get asteroidsAmount() {
    return this._asteroidsAmount.value
  }

  /**
   * Property responsible for keeping the current asteroid amount
   * on the game.
   */
  set asteroidsAmount(value: number) {
    this._asteroidsAmount.next(value)
  }
}
