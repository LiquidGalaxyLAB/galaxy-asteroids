import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnStart,
  ISocketData,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Drawer } from '../../../shared/components/drawer.component'
import { Health } from '../../../shared/components/health.component'
import { RenderOverflow } from '../../../shared/components/renderers/render-overflow.component'
import { Transform } from '../../../shared/components/transform.component'

import { Subscription } from 'rxjs'

/**
 * Entity that represents the spaceship used by the `slave` screens,
 * with all of its methods and properties.
 */
@Entity({
  services: [SocketService],
  components: [
    Drawer,
    RenderOverflow,
    Transform,
    { id: '__spaceship_health__', class: Health },
  ],
})
export class SpaceshipSlave
  extends AbstractEntity
  implements IOnAwake, IOnStart, IDraw
{
  /**
   * Property that contains the spaceship position, dimensions and rotation.
   */
  private transform: Transform

  /**
   * Property that contains the spaceship health status.
   */
  private health: Health

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines an array of subscriptions, used to unsubscribe all when
   * destroyed.
   */
  private subscriptions: Subscription[] = []

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

  onAwake() {
    this.socketService = this.getService(SocketService)

    this.health = this.getComponent(Health)
    this.transform = this.getComponent(Transform)
  }

  onStart() {
    this.image = new Image()
    this.image.src = `./assets/svg/spaceship-${this.color}.svg`

    this.subscriptions.push(
      this.socketService
        .on<ISocketData>('update-screen')
        .subscribe(({ id, data }) => {
          if (this.id !== id) {
            return
          }

          this.transform.position = data.position
          this.transform.dimensions = data.dimensions
          this.transform.rotation = data.rotation
          this.health.health = data.health
          this.health.maxHealth = data.maxHealth
        }),

      this.socketService.on<string>('destroy').subscribe((id) => {
        if (this.id === id) {
          this.destroy(this)
        }
      }),
    )
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
}
