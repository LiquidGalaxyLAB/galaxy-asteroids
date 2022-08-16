import { AbstractService, Service } from '@asteroids'

import { BehaviorSubject } from 'rxjs'

/**
 * Service responsible for the management of the game.
 */
@Service()
export class GameService extends AbstractService {
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
  public maxAsteroidsAmount = 10

  /**
   * An observable that is triggered every time the asteroids amount
   * is updated.
   */
  public get asteroidsAmount$() {
    return this._asteroidsAmount.asObservable()
  }

  public get asteroidsAmount() {
    return this._asteroidsAmount.value
  }

  public set asteroidsAmount(value: number) {
    this._asteroidsAmount.next(value)
  }
}
