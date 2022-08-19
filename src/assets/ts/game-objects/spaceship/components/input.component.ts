import {
  AbstractComponent,
  Component,
  IOnAwake,
  IOnLoop,
  IOnStart,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Spaceship } from '../entities/spaceship.entity'

import { Rigidbody } from '../../../shared/components/rigidbody.component'

import { IJoystickActions } from '../../../shared/interfaces/joystick.interface'
import { IGameKeys } from '../interfaces/input.interface'

import { fromEvent, Subscription } from 'rxjs'

/**
 * Class that represents the component that allows  the user interaction
 * with the game.
 */
@Component({
  required: [Rigidbody],
  services: [SocketService],
})
export class Input
  extends AbstractComponent
  implements IOnAwake, IOnStart, IOnLoop
{
  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines an array of subscriptions that will be unsubscribed when
   * the entity is destroyed.
   */
  private subscriptions: Subscription[] = []

  /**
   * Property that contains the pressed keys and whether they are pressed
   * or not.
   *
   * @example
   * {
   *   'up': true,
   *   'left': true,
   *   'right': false,
   *   'down': false,
   *   'shoot': false
   * }
   *
   * @default {}
   */
  private gameKeys: IGameKeys = {}

  /**
   * Property that keeps the joystick controller actions.
   */
  private actions: IJoystickActions

  /**
   * Property that represents the controlled entity's rigidbody.
   */
  private rigidbody: Rigidbody

  /**
   * Property that defines the controller spaceship.
   */
  private spaceship: Spaceship

  /**
   * Property that defines the acceleration force.
   */
  force: number

  /**
   * Property that defines the angular acceleration force.
   */
  angularForce: number

  onAwake() {
    this.spaceship = this.getEntityAs<Spaceship>()
    this.rigidbody = this.getComponent(Rigidbody)

    this.socketService = this.getService(SocketService)
  }

  onStart() {
    this.listenKeys()

    this.subscriptions.push(
      this.socketService
        .on<{ actions: IJoystickActions }>('update-actions')
        .subscribe((data) => {
          this.actions = data.actions

          switch (data.actions.rotating) {
            case 'right':
              this.setGameKeyPressed('ArrowRight', true)
              this.setGameKeyPressed('ArrowLeft', false)
              break
            case 'left':
              this.setGameKeyPressed('ArrowRight', false)
              this.setGameKeyPressed('ArrowLeft', true)
              break
            default:
              this.setGameKeyPressed('ArrowRight', false)
              this.setGameKeyPressed('ArrowLeft', false)
              break
          }
        }),
    )
  }

  /**
   * Captures the pressed key and checks the corresponding action.
   */
  listenKeys() {
    fromEvent(window, 'keydown').subscribe((e: KeyboardEvent) => {
      this.setGameKeyPressed(e.code, true)
    })

    fromEvent(window, 'keyup').subscribe((e: KeyboardEvent) => {
      this.setGameKeyPressed(e.code, false)
    })
  }

  /**
   * Function that realize the player moves.
   *
   * @param key - String that represents the pressed key.
   * @param isPressed - Whether the key is pressed or not.
   */
  private setGameKeyPressed(key: string, isPressed: boolean) {
    switch (key) {
      case 'KeyW':
      case 'ArrowUp':
        this.gameKeys['up'] = isPressed
        break

      case 'KeyA':
      case 'ArrowLeft':
        this.gameKeys['left'] = isPressed
        break

      case 'KeyS':
      case 'ArrowDown':
        this.gameKeys['down'] = isPressed
        break

      case 'KeyD':
      case 'ArrowRight':
        this.gameKeys['right'] = isPressed
        break

      case 'Space':
      case 'ShiftRight':
        this.gameKeys['shoot'] = isPressed
        break
    }
  }

  onLoop() {
    if (
      !Object.entries(this.gameKeys)
        .filter((item) => item[0] === 'left' || item[0] === 'right')
        .map((item) => item[1])
        .reduce((prev, cur) => prev || cur, false)
    ) {
      this.rigidbody.angularVelocity = 0
      this.rigidbody.angularResultant = 0
    }

    if (
      this.actions?.isShooting ||
      (this.gameKeys['shoot'] && !this.spaceship.shooting)
    ) {
      this.spaceship.shooting = true
    } else if (
      !this.actions?.isShooting &&
      !this.gameKeys['shoot'] &&
      this.spaceship.shooting
    ) {
      this.spaceship.shooting = false
    }

    if (this.spaceship.shooting) {
      this.spaceship.shoot()
    }

    this.spaceship.boosting = this.gameKeys['up'] || this.actions?.isBoosting

    if (this.spaceship.boosting) {
      this.rigidbody.resultant = Vector2.sum(
        this.rigidbody.resultant,
        Vector2.multiply(this.spaceship.direction, this.force),
      )
    }

    if (this.gameKeys['right']) {
      this.rigidbody.angularResultant += this.angularForce

      if (this.gameKeys['left']) {
        this.rigidbody.angularResultant = 0
      }
    }
    if (this.gameKeys['left']) {
      this.rigidbody.angularResultant += -this.angularForce

      if (this.gameKeys['right']) {
        this.rigidbody.angularResultant = 0
      }
    }
  }
}
