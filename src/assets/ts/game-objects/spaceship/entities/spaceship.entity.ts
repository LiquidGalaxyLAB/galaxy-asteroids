import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnDestroy,
  IOnFixedLoop,
  IOnLateLoop,
  IOnStart,
  ISocketData,
  Rect,
  v4,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Asteroid } from '../../asteroid/entities/asteroid.entity'
import { Bullet } from '../../bullet/entities/bullet.entity'

import { GameService } from '../../../shared/services/game.service'

import { AudioSource } from '../../../shared/components/audio-source.component'
import { CircleCollider2 } from '../../../shared/components/colliders/circle-collider2.component'
import { Drawer } from '../../../shared/components/drawer.component'
import { Health } from '../../../shared/components/health.component'
import { RenderOverflow } from '../../../shared/components/renderers/render-overflow.component'
import { Rigidbody } from '../../../shared/components/rigidbody.component'
import { Transform } from '../../../shared/components/transform.component'
import { Input } from '../components/input.component'

import { ICollision2 } from '../../../shared/interfaces/collision2.interface'
import { IOnTriggerEnter } from '../../../shared/interfaces/on-trigger-enter.interface'

import { assetPath } from '../../../utils/assets'

import { Subscription } from 'rxjs'

/**
 * Entity that represents the spaceship used by the `master` screen,
 * with all of its methods and properties.
 */
@Entity({
  order: 1,
  services: [GameService, SocketService],
  components: [
    Drawer,
    RenderOverflow,
    {
      id: '__spaceship_transform__',
      class: Transform,
    },
    {
      id: '__spaceship_rigidbody__',
      class: Rigidbody,
    },
    {
      class: CircleCollider2,
      use: {
        localPosition: new Vector2(0, 15),
        dimensions: new Rect(20, 20),
      },
    },
    {
      class: CircleCollider2,
      use: {
        localPosition: new Vector2(0, -10),
        dimensions: new Rect(30, 30),
      },
    },
    {
      class: CircleCollider2,
      use: {
        localPosition: new Vector2(20, -17),
        dimensions: new Rect(12, 12),
      },
    },
    {
      class: CircleCollider2,
      use: {
        localPosition: new Vector2(-20, -17),
        dimensions: new Rect(12, 12),
      },
    },
    {
      class: Input,
      use: {
        force: 0.01,
        angularForce: 0.15,
      },
    },
    {
      id: '__spaceship_health__',
      class: Health,
    },
    {
      class: AudioSource,
      use: {
        spatial: true,
        loop: true,
      },
    },
    {
      class: AudioSource,
      use: {
        spatial: true,
        loop: true,
      },
    },
  ],
})
export class Spaceship
  extends AbstractEntity
  implements
    IOnAwake,
    IOnStart,
    IOnDestroy,
    IDraw,
    IOnLateLoop,
    IOnFixedLoop,
    IOnTriggerEnter
{
  /**
   * Property that contains the spaceship position, dimensions and rotation.
   */
  private transform: Transform

  /**
   * Property that contains the spaceship physics.
   */
  private rigidbody: Rigidbody

  /**
   * Property that contains the spaceship health.
   */
  private health: Health

  /**
   * Property that contains the spaceship audio source.
   */
  private audioSources: AudioSource[]

  /**
   * Property that defines the game service.
   */
  private gameService: GameService

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
   * Property responsible for the spaceship bullet velocity.
   */
  private readonly bulletVelocity = 0.6

  /**
   * Property responsible for the spaceship last bullet time.
   */
  private lastShot: Date

  /**
   * @inheritDoc
   */
  tag = Spaceship.name

  /**
   * Property that defines the spaceship model image.
   */
  image: HTMLImageElement

  /**
   * Property that defines the spaceship color.
   *
   * @default "grey"
   */
  color = 'grey'

  /**
   * Property that represents whether the spaceship is shooting.
   */
  shooting = false

  /**
   * Property that represents whether the spaceship is boosting.
   */
  boosting = false

  /**
   * Property that links the spaceship to its user by the user id.
   */
  userId = ''

  /**
   * Property that defines the time in miliseconds between each
   * shot.
   */
  fireRate = 400

  /**
   * Property that represents the spaceship direction.
   */
  get direction() {
    return new Vector2(
      Math.sin(this.transform.rotation),
      Math.cos(this.transform.rotation),
    )
  }

  onAwake() {
    this.gameService = this.getService(GameService)
    this.socketService = this.getService(SocketService)

    this.audioSources = this.getComponents(AudioSource)
    this.health = this.getComponent(Health)
    this.rigidbody = this.getComponent(Rigidbody)
    this.transform = this.getComponent(Transform)
  }

  onStart() {
    this.image = new Image()
    this.image.src = `${assetPath}/svg/spaceship-${this.color}.svg`

    this.audioSources[0].play('./assets/audios/spaceship-thruster-v2.mp3', 0.5)

    this.subscriptions.push(
      this.health.health$.subscribe((value) => {
        if (value > 0 || this.gameService.gameOver) {
          return
        }

        this.gameService.gameOver = true
        this.destroy(this)
      }),
    )
  }

  onLateLoop() {
    if (!this.audioSources[1].playing && this.boosting) {
      this.audioSources[1].play('./assets/audios/spaceship-thruster.mp3', 1)
    } else if (this.audioSources[1].playing && !this.boosting) {
      this.audioSources[1].stop()
    }

    this.socketService.emit('update-slaves', {
      id: this.id,
      data: {
        position: this.transform.position,
        dimensions: this.transform.dimensions,
        rotation: this.transform.rotation,
        health: this.health.health,
        maxHealth: this.health.maxHealth,
      },
    })
  }

  onFixedLoop() {
    this.refreshDeltaTime()
  }

  onTriggerEnter(collision: ICollision2): void {
    if (!this.enabled) {
      return
    }

    if (
      collision.entity2.tag?.includes(Bullet.name) &&
      (collision.entity2 as unknown as Bullet).userId === this.userId
    ) {
      return
    }

    if (collision.entity2.tag?.includes(Asteroid.name)) {
      this.audioSources[0].playOneShot(
        './assets/audios/spaceship-collision.mp3',
        this.transform.position,
        0.6,
      )

      const asteroid = collision.entity2 as unknown as Asteroid
      this.health.hurt((asteroid.size + 1) * 8)
    }
  }

  onDestroy() {
    this.socketService.emit('destroy', this.id)
    this.subscriptions.forEach((s) => s.unsubscribe())
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
   * Shoots new bullets according to the spaceship last shot time.
   */
  public shoot() {
    if (
      (this.lastShot &&
        new Date().getTime() - this.lastShot.getTime() <
          this.fireRate / this.timeScale) ||
      this.hasTag('intangible')
    ) {
      return
    }

    this.lastShot = new Date()

    this.audioSources[0].playOneShot(
      './assets/audios/blaster-shot.mp3',
      this.transform.position,
    )

    const groupId = v4()

    this.createBullet((2 * Math.PI) / 5, 7.5, groupId)
    this.createBullet(-(2 * Math.PI) / 5, 5.5, groupId)

    this.createBullet((2 * Math.PI) / 7, 9.5, groupId)
    this.createBullet(-(2 * Math.PI) / 7, 7.5, groupId)
  }

  /**
   * Instantiates a new bullet from the spaceship.
   *
   * @param localPosition The bullet initial position.
   * @param offset The bullet position offset.
   * @param groupId The bullet group id.
   *
   * @example
   * createBullet(Math.PI, 5.5, 'f783aDe20dDaf90')
   */
  private createBullet(localPosition: number, offset: number, groupId: string) {
    const rotation = this.transform.rotation
    const position = Vector2.sum(
      this.transform.position,
      Vector2.multiply(
        new Vector2(
          Math.sin(this.transform.rotation + localPosition),
          Math.cos(this.transform.rotation + localPosition),
        ),
        this.transform.dimensions.width / 2 - offset,
      ),
    )
    const velocity = Vector2.sum(
      this.rigidbody.velocity,
      Vector2.multiply(this.direction, this.bulletVelocity),
    )

    const bullet = this.instantiate({
      use: {
        tag: `${Bullet.name}`,
        userId: this.userId,
        groupId,
      },
      entity: Bullet,
      components: [
        {
          id: '__bullet_transform__',
          use: {
            position,
            rotation,
          },
        },
        {
          id: '__bullet_rigidbody__',
          use: {
            velocity,
          },
        },
      ],
    })

    this.socketService.emit('instantiate', {
      id: bullet.id,
      type: Bullet.name,
      data: {
        userId: bullet.userId,
        position,
        rotation,
        velocity,
      },
    } as ISocketData)
  }
}
