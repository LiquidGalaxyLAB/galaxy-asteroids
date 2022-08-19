import { AbstractService, IOnAwake, Service } from '@asteroids'

import { SocketService } from './socket.service'

import { IScreen } from '../interfaces/screen.interface'

import { Observable, of } from 'rxjs'

/**
 * Service that deals with the Liquid Galaxy system management.
 */
@Service({
  services: [SocketService],
})
export class LGService extends AbstractService implements IOnAwake {
  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines the current screen data.
   */
  screen: IScreen

  /**
   * Property that defines the Liquid Galaxy screens amount.
   *
   * @default 5
   */
  screenAmount = 5

  /**
   * Property that defines the amount of screens by side (around Master).
   *
   * @default 2
   */
  screensBySide = 2

  /**
   * Property that defines all screens.
   */
  screens: IScreen[] = []

  /**
   * Property that defines how much the canvas will displace to fit screen
   * position.
   *
   * @default 0
   */
  displacement = 0

  /**
   * Property that defines the canvas total width.
   */
  canvasWidth = 0

  /**
   * Property that defines the canvas total height.
   */
  canvasHeight = 0

  /**
   * Property that defines whether the current screen is the master.
   */
  get master() {
    return this.screen?.number === 1
  }

  onAwake() {
    this.socketService = this.getService(SocketService)
  }

  /**
   * Emits to all screens to change to a specific scene.
   *
   * @param scene the scene to be loaded.
   */
  changeScene(scene: string) {
    this.socketService.emit('change-scene', scene)
  }

  /**
   * Connects a screens to the LG socket system.
   *
   * @param screenNumber The screen number to connect.
   * @returns An observable that returns the connected screen.style.
   */
  connectScreen(screenNumber?: number): Observable<void> {
    if (!screenNumber) {
      return of()
    }

    return new Observable((subscriber) => {
      this.socketService
        .emit<number, IScreen>('connect-screen', screenNumber)
        .subscribe((screen: IScreen) => {
          if (!screen) {
            return
          }

          console.log(screen)

          this.screen = screen
          subscriber.next()
        })
    })
  }

  /**
   * Computes the canvas total width and height and its displacement.
   */
  setCanvasSize() {
    if (!this.screen) {
      return
    }

    this.screen.position = this.getScreenLayout(this.screenAmount).findIndex(
      (s) => s === this.screen.number,
    )

    this.canvasWidth = this.screenAmount * window.innerWidth
    this.canvasHeight = window.innerHeight

    this.displacement = this.screen.position * window.innerWidth
  }

  /**
   * Sets an specific amount to the screen amount.
   *
   * @param amount The screen amount to be set.
   */
  setScreenAmount(amount: number) {
    this.screenAmount = amount
    this.screensBySide = Math.floor(amount / 2)
  }

  /**
   * Gets a screen by it's number.
   *
   * @param number The number of the screen.
   * @returns The screen that matches the given number.
   */
  getScreenByNumber(number: number) {
    return this.screens.find((s) => s.number === number)
  }

  /**
   * Gets a screens layout according to the given amount.
   *
   * @param amount The screen amount.
   * @returns The screens layout.
   *
   * @example
   * ```ts
   * getScreenByNumber(5) => [4, 5, 1, 2, 3]
   * ```
   */
  getScreenLayout(amount: number) {
    const layout = [...Array(amount).keys()].map((n) => n + 1)
    const amountBySide = Math.floor(amount / 2)

    return [
      ...layout.slice(amountBySide + 1),
      ...layout.slice(0, amountBySide + 1),
    ]
  }

  /**
   * Gets the window location path screen number.
   *
   * @returns The number that is present in the browser path.
   */
  getPathScreenNumber() {
    let pathNumber = window.location.pathname.split('/')[1]

    if (pathNumber?.includes('/')) {
      pathNumber = pathNumber.split('/')[0]
    }

    return pathNumber ? +pathNumber : null
  }

  /**
   * Gets the Liquid Galaxy screens amount.
   */
  getScreenAmount(): Observable<number> {
    return this.socketService.emit('screen-amount')
  }
}
