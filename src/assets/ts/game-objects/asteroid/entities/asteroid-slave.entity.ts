import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnDestroy,
  IOnLoop,
  IOnStart,
  isOverflowingX,
  isOverflowingY,
  Rect,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Drawer } from '../../../shared/components/drawer.component'
import { Health } from '../../../shared/components/health.component'
import { RenderOverflow } from '../../../shared/components/renderers/render-overflow.component'
import { Render } from '../../../shared/components/renderers/render.component'
import { Rigidbody } from '../../../shared/components/rigidbody.component'
import { Transform } from '../../../shared/components/transform.component'

/**
 * Entity that represents the asteroid used by the `master` screen,
 * with all of its methods and properties.
 */
@Entity({
  components: [
    Render,
    Drawer,
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
  services: [SocketService],
})
export class AsteroidSlave
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy, IDraw, IOnLoop
{
  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines the asteroid image.
   */
  private image: HTMLImageElement

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
   * Property that defines whether the asteroid is a fragment.
   */
  fragment: boolean

  /**
   * Property that contains the asteroid health status.
   */
  health: Health

  /**
   * Property that defines the asteroid image url.
   */
  imageSrc: string

  onAwake() {
    this.transform = this.getComponent(Transform)
    this.health = this.getComponent(Health)

    this.socketService = this.getService(SocketService)
  }

  onStart() {
    if (this.getComponent(Render) || this.getComponent(RenderOverflow)) {
      this.image = new Image()
      this.image.src = this.imageSrc
    }

    this.transform.dimensions = new Rect(
      10 * ((this.size + 2) * 2),
      10 * ((this.size + 2) * 2),
    )

    this.socketService.on<string>('destroy').subscribe((id) => {
      if (id === this.id) {
        this.destroy(this)
      }
    })
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
