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
import { Render } from '../../../shared/components/renderers/render.component'
import { Transform } from '../../../shared/components/transform.component'

import { Subscription } from 'rxjs'

/**
 * Entity that represents the spaceship used by the `slave` screens,
 * with all of its methods and properties.
 */
@Entity({
  services: [SocketService],
  components: [Drawer, Render, Transform],
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
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines an array of subscriptions, used to unsubscribe all when
   * destroyed.
   */
  private subscriptions: Subscription[] = []

  onAwake() {
    this.socketService = this.getService(SocketService)

    this.transform = this.getComponent(Transform)
  }

  onStart() {
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
    this.getContexts()[0].fillStyle = '#5500ff'
    this.getContexts()[0].fillRect(
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
