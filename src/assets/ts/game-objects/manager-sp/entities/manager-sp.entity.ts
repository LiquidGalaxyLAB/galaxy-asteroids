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

import { SpaceshipSlave } from '../../spaceship/entities/spaceship-slave.entity'
import { Spaceship } from '../../spaceship/entities/spaceship.entity'

import { LGService } from '../../../shared/services/lg.service'

import { firstValueFrom, Subscription } from 'rxjs'

/**
 * Entity that managers the Singleplayer game mode.
 */
@Entity({
  services: [LGService, SocketService],
})
export class ManagerSingleplayer
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
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
    const spaceship = this.instantiate({
      entity: Spaceship,
      components: [
        {
          id: '__spaceship_transform__',
          use: {
            rotation: 0,
            dimensions: new Rect(1000, 500),
          },
        },
      ],
    })

    this.socketService.emit('instantiate', {
      id: spaceship.id,
      type: Spaceship.name,
      data: {
        position: new Vector2(),
        dimensions: new Rect(1000, 500),
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
                      position: data.position,
                    },
                  },
                ],
              })
          }
        }),
    )
  }
}
