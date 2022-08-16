import {
  AbstractEntity,
  Entity,
  IOnAwake,
  IOnDestroy,
  IOnStart,
  ISocketData,
  Rect,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { AsteroidGenerator } from '../../asteroid/entities/asteroid-generator.entity'
import { AsteroidSlave } from '../../asteroid/entities/asteroid-slave.entity'
import { Asteroid } from '../../asteroid/entities/asteroid.entity'
import { SpaceshipSlave } from '../../spaceship/entities/spaceship-slave.entity'
import { Spaceship } from '../../spaceship/entities/spaceship.entity'

import { GameService } from '../../../shared/services/game.service'
import { LGService } from '../../../shared/services/lg.service'

import { firstValueFrom, Subscription } from 'rxjs'

/**
 * Entity that managers the Singleplayer game mode.
 */
@Entity({
  services: [GameService, LGService, SocketService],
})
export class ManagerSingleplayer
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
  /**
   * Property that defines the game service.
   */
  private gameService: GameService

  /**
   * Property that defines the Liquid Galaxy service.
   */
  private lgService: LGService

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines an array of subscriptions, used to unsubscribe all when
   * destroyed.
   */
  private subscriptions: Subscription[] = []

  onAwake() {
    this.gameService = this.getService(GameService)
    this.lgService = this.getService(LGService)
    this.socketService = this.getService(SocketService)
  }

  onStart() {
    this.subscriptions.push(
      this.lgService.getScreenAmount().subscribe(async (amount) => {
        if (!amount) {
          return
        }

        this.lgService.screenAmount = amount
        await firstValueFrom(
          this.lgService.connectScreen(this.lgService.getPathScreenNumber()),
        )

        this.lgService.setCanvasSize()

        this.getContexts().forEach((context) => {
          context.canvas.width = this.lgService.canvasWidth
          context.canvas.height = this.lgService.canvasHeight
          context.canvas.style.transform = `translateX(-${this.lgService.displacement}px)`
        })

        setTimeout(() => {
          this.lgService.screen?.number === 1 ? this.master() : this.slave()
        }, 100)
      }),
    )
  }

  onDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  /**
   * Initializes the game mode as the `master` screen.
   */
  private master() {
    this.gameService.maxAsteroidsAmount = 10

    const spaceship = this.instantiate({
      entity: Spaceship,
      components: [
        {
          id: '__spaceship_transform__',
          use: {
            rotation: 0,
            dimensions: new Rect(50, 50),
          },
        },
        {
          id: '__spaceship_rigidbody__',
          use: {
            friction: 0.00003,
            mass: 10,
            maxVelocity: 0.5,
            maxAngularVelocity: 0.007,
          },
        },
      ],
    })

    this.instantiate({
      entity: AsteroidGenerator,
    })

    this.socketService.emit('instantiate', {
      id: spaceship.id,
      type: Spaceship.name,
      data: {
        position: new Vector2(),
        dimensions: new Rect(50, 50),
      },
    } as ISocketData)
  }

  /**
   * Initializes the game mode as a `slave` screen.
   */
  private slave() {
    this.subscriptions.push(
      this.socketService
        .on<ISocketData>('instantiate')
        .subscribe(({ id, type, data }) => {
          switch (type) {
            case Spaceship.name:
              this.instantiate({
                use: {
                  id,
                },
                entity: SpaceshipSlave,
                components: [
                  {
                    id: '__spaceship_transform__',
                    use: {
                      rotation: data.rotation,
                      dimensions: data.dimensions,
                      position: new Vector2(data.position.x, data.position.y),
                    },
                  },
                ],
              })
              break
            case Asteroid.name:
              this.instantiate({
                use: {
                  id,
                  size: data.asteroidSize,
                  imageSrc: data.image,
                  fragment: !!data.fragment,
                },
                entity: AsteroidSlave,
                components: [
                  {
                    id: '__asteroid_transform__',
                    use: {
                      rotation: data.rotation,
                      position: new Vector2(data.position.x, data.position.y),
                    },
                  },
                  {
                    id: '__asteroid_rigidbody__',
                    use: {
                      mass: data.mass,
                      velocity: new Vector2(data.velocity.x, data.velocity.y),
                      angularVelocity: data.angularVelocity,
                      maxAngularVelocity: data.maxAngularVelocity,
                    },
                  },
                  {
                    id: '__asteroids_health__',
                    use: {
                      color: data.color,
                      maxHealth: data.maxHealth,
                      health: data.health,
                    },
                  },
                ],
              })
              break
          }
        }),
    )
  }
}
