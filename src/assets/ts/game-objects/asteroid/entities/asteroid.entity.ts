import {
  AbstractEntity,
  Entity,
  getRandom,
  IDraw,
  IOnAwake,
  IOnDestroy,
  IOnLoop,
  IOnStart,
  isOverflowingX,
  isOverflowingY,
  Rect,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { GameService } from '../../../shared/services/game.service'

import { CircleCollider2 } from '../../../shared/components/colliders/circle-collider2.component'
import { Drawer } from '../../../shared/components/drawer.component'
import { Health } from '../../../shared/components/health.component'
import { RenderOverflow } from '../../../shared/components/renderers/render-overflow.component'
import { Render } from '../../../shared/components/renderers/render.component'
import { Rigidbody } from '../../../shared/components/rigidbody.component'
import { Transform } from '../../../shared/components/transform.component'

import { ICollision2 } from '../../../shared/interfaces/collision2.interface'

/**
 * Entity that represents the asteroid used by the `master` screen,
 * with all of its methods and properties.
 */
@Entity({
  components: [
    Render,
    Drawer,
    CircleCollider2,
    {
      id: '__asteroid_transform__',
      class: Transform,
    },
    {
      id: '__asteroid_rigidbody__',
      class: Rigidbody,
    },
    {
      id: '__asteroid_health__',
      class: Health,
    },
  ],
  services: [GameService, SocketService],
})
export class Asteroid
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy, IDraw, IOnLoop
{
  /**
   * Property that defines the game service.
   */
  private gameService: GameService

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * @inheritDoc
   */
  tag = Asteroid.name

  /**
   * Property that contains the asteroid health status.
   */
  health: Health

  /**
   * Property that defines the transform component.
   */
  transform: Transform

  /**
   * Property that defines the asteroid size.
   *
   * It may be from 0 to 4.
   */
  size: number

  /**
   * Property that defines the asteroid image.
   */
  image: HTMLImageElement

  /**
   * Property that defines whether the asteroid is a fragment from
   * another one.
   */
  fragment = false

  /**
   * Property that defines the time that the asteroid was generated.
   */
  generationTime: Date

  onAwake() {
    this.transform = this.getComponent(Transform)
    this.health = this.getComponent(Health)

    this.gameService = this.getService(GameService)
    this.socketService = this.getService(SocketService)
  }

  onStart() {
    this.generationTime = new Date()

    if (this.getComponent(Render) || this.getComponent(RenderOverflow)) {
      this.image = new Image()
      if (!this.size) {
        this.image.src = './assets/svg/asteroid-xs.svg'
      } else if (this.size === 1) {
        const smallAsteroids = [1, 2]

        this.image.src = `./assets/svg/asteroid-sm-${getRandom(
          smallAsteroids,
        )}.svg`
      } else if (this.size === 2) {
        const mediumAsteroids = [1, 2]

        this.image.src = `./assets/svg/asteroid-md-${getRandom(
          mediumAsteroids,
        )}.svg`
      } else {
        const largeAsteroids = [1, 2, 3]

        this.image.src = `./assets/svg/asteroid-lg-${getRandom(
          largeAsteroids,
        )}.svg`
      }
    }

    this.transform.dimensions = new Rect(
      10 * ((this.size + 2) * 2),
      10 * ((this.size + 2) * 2),
    )
  }

  onDestroy() {
    this.socketService.emit('destroy', this.id)
  }

  onTriggerEnter(collision: ICollision2) {
    if (!this.enabled || collision.entity2.tag?.includes(Asteroid.name)) {
      return
    }

    const generationDiff =
      this.generationTime &&
      new Date().getTime() - this.generationTime.getTime()

    if (generationDiff > 100 / this.timeScale) {
      this.health.hurt(20)
    }

    if (this.health.health > 0) {
      return
    }

    if (this.size > 0) {
      this.generateAsteroidFragments(this.size <= 2 ? 1 : 2)
    }

    this.gameService.asteroidsAmount -= 1

    this.destroy(this)
  }

  onLoop() {
    const overflowX = isOverflowingX(
      this.getContexts()[0].canvas.width,
      this.transform.position.x,
      this.transform.totalDimensions.width,
    )

    const overflowY = isOverflowingY(
      this.getContexts()[0].canvas.height,
      this.transform.position.y,
      this.transform.totalDimensions.height,
    )

    if (
      this.getComponent(Render) &&
      !this.getComponent(RenderOverflow) &&
      (this.fragment || (!overflowX && !overflowY))
    ) {
      this.addComponent(RenderOverflow)
      this.destroy(this.getComponent(Render))
    }
  }

  draw() {
    this.getContexts()[0].translate(
      this.transform.canvasPosition.x,
      this.transform.canvasPosition.y,
    )
    this.getContexts()[0].rotate(this.transform.rotation)

    this.getContexts()[0].beginPath()
    this.getContexts()[0].drawImage(
      this.image,
      0 - this.transform.dimensions.width / 2,
      0 - this.transform.dimensions.height / 2,
      this.transform.dimensions.width,
      this.transform.dimensions.height,
    )
    this.getContexts()[0].closePath()

    this.getContexts()[0].rotate(-this.transform.rotation)
    this.getContexts()[0].translate(
      -this.transform.canvasPosition.x,
      -this.transform.canvasPosition.y,
    )
  }

  /**
   * Generates a new asteroid from the current asteroid according to
   * the given amount.
   *
   * @param amount The amount of fragments to be generated.
   */
  private generateAsteroidFragments(amount: number): void {
    for (let i = 0; i < amount; i++) {
      const rotation = Math.random() * 2 * Math.PI
      const direction = new Vector2(Math.sin(rotation), Math.cos(rotation))

      const position = new Vector2(
        this.transform.position.x,
        this.transform.position.y,
      )

      const velocity = Vector2.multiply(
        direction.normalized,
        Math.floor(Math.random() * (5 - this.size - 2) + 2) * -0.07,
      )

      this.gameService.asteroidsAmount += 1

      const fragment = this.instantiate({
        use: {
          size: this.size - 1,
          fragment: true,
        },
        entity: Asteroid,
        components: [
          {
            id: '__asteroid_transform__',
            use: {
              rotation,
              position,
            },
          },
          {
            id: '__asteroid_rigidbody__',
            use: {
              velocity,
              mass: 15 * this.size,
              maxAngularVelocity: 0.005,
              angularVelocity: 0.005 / this.size,
            },
          },
          {
            id: '__asteroid_health__',
            use: {
              color: '#8d8d8d',
              maxHealth: this.size * 20,
              health: this.size * 20,
            },
          },
        ],
      })

      this.socketService.emit('instantiate', {
        id: fragment.id,
        type: Asteroid.name,
        data: {
          asteroidSize: fragment.size,
          image: fragment.image.src,
          rotation,
          position,
          velocity,
          mass: 15 * this.size,
          maxAngularVelocity: 0.005,
          angularVelocity: 0.005 / this.size,
          fragment: true,
          color: '#8d8d8d',
          maxHealth: this.size * 20,
          health: this.size * 20,
        },
      })
    }
  }
}
