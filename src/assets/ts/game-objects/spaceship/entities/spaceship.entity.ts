import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnDestroy,
  IOnLateLoop,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Drawer } from '../../../shared/components/drawer.component'
import { Render } from '../../../shared/components/renderers/render.component'
import { Transform } from '../../../shared/components/transform.component'

/**
 * Entity that represents the spaceship used by the `master` screen,
 * with all of its methods and properties.
 */
@Entity({
  order: 1,
  services: [SocketService],
  components: [
    Drawer,
    Render,
    {
      id: '__spaceship_transform__',
      class: Transform,
    },
  ],
})
export class Spaceship
  extends AbstractEntity
  implements IOnAwake, IOnDestroy, IDraw, IOnLateLoop
{
  /**
   * Property that contains the spaceship position, dimensions and rotation.
   */
  private transform: Transform

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  onAwake() {
    this.socketService = this.getService(SocketService)

    this.transform = this.getComponent(Transform)
  }

  onLateLoop() {
    this.socketService.emit('update-slaves', {
      id: this.id,
      data: {
        position: this.transform.position,
        dimensions: this.transform.dimensions,
        rotation: this.transform.rotation,
      },
    })
  }

  onDestroy() {
    this.socketService.emit('destroy', this.id)
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
