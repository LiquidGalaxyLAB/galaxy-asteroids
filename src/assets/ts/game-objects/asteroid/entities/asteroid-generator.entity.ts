import {
  AbstractEntity,
  Entity,
  getRandom,
  IOnAwake,
  IOnDestroy,
  IOnStart,
  ISocketData,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Asteroid } from './asteroid.entity'

import { GameService } from '../../../shared/services/game.service'

import { Subscription } from 'rxjs'

/**
 * Class that represents the asteroids generator entity that
 * generates new asteroids according to the current scene.
 */
@Entity({
  services: [GameService, SocketService],
})
export class AsteroidGenerator
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines the game service.
   */
  private gameService: GameService

  /**
   * Property that defines the asteroids generation interval.
   */
  private interval: ReturnType<typeof setInterval>

  /**
   * Property that defines an array of subscriptions that will be unsubscribed when
   * the entity is destroyed.
   */
  private subscriptions: Subscription[] = []

  onAwake() {
    this.gameService = this.getService(GameService)
    this.socketService = this.getService(SocketService)
  }

  onStart() {
    this.gameService.gameOver$.subscribe((value) => {
      if (value) {
        clearInterval(this.interval)
      }
    })

    for (let i = 0; i < 3; i++) {
      this.generateAsteroid()
    }

    this.interval = setInterval(() => {
      if (
        this.gameService.asteroidsAmount > this.gameService.maxAsteroidsAmount
      ) {
        return
      }

      this.generateAsteroid()
      this.generateAsteroid()
    }, 7000)
  }

  onDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe())
    clearInterval(this.interval)
  }

  /**
   * Generates an asteroid and sets its position on the canvas.
   */
  private generateAsteroid() {
    const sizes = [0, 1, 2, 3, 4]
    const asteroidSize = getRandom(sizes)

    const color = { colorName: 'grey', hex: '#8d8d8d' }

    const offset = 150

    const canvasWidth = this.getContexts()[0].canvas.width
    const canvasHeight = this.getContexts()[0].canvas.height

    let x = Math.floor(Math.random() * (canvasWidth + offset * 2)) - offset
    let y = Math.floor(Math.random() * (canvasHeight + offset * 2)) - offset

    if (x < 0) {
      x = (offset + canvasWidth / 2) * -1
    } else if (x > canvasWidth) {
      x = canvasWidth / 2 + offset
    } else {
      x -= canvasWidth / 2
      y =
        Math.random() <= 0.5
          ? (offset + canvasHeight / 2) * -1
          : canvasHeight / 2 + offset
    }

    const rotation = Math.random() * 2 * Math.PI

    const velocity = Vector2.multiply(
      new Vector2(x, y).normalized,
      Math.floor(Math.random() * (4 - asteroidSize) + 2) * -0.07,
    )
    const angularVelocity = 0.005 / (asteroidSize + 1)

    const mass = 15 * (asteroidSize + 1)

    const health = (asteroidSize - 1) * 20

    this.gameService.asteroidsAmount += 1

    const asteroid = this.instantiate({
      use: {
        size: asteroidSize,
      },
      entity: Asteroid,
      components: [
        {
          id: '__asteroid_transform__',
          use: {
            rotation,
            position: new Vector2(x, y),
          },
        },
        {
          id: '__asteroid_rigidbody__',
          use: {
            velocity,
            mass,
            angularVelocity,
            maxAngularVelocity: 0.005,
          },
        },
        {
          id: '__asteroid_health__',
          use: {
            color: color.hex,
            maxHealth: health,
            health,
          },
        },
      ],
    })

    this.socketService.emit('instantiate', {
      id: asteroid.id,
      type: Asteroid.name,
      data: {
        position: new Vector2(x, y),
        rotation,
        asteroidSize,
        image: asteroid.image.src,
        velocity,
        mass,
        angularVelocity,
        maxAngularVelocity: 0.005,
        color: color.hex,
        maxHealth: health,
        health,
      },
    } as ISocketData)
  }
}
