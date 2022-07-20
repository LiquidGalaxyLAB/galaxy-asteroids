import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnDestroy,
  IOnLateLoop,
  IOnStart,
  Rect,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { CircleCollider2 } from '../../../shared/components/colliders/circle-collider2.component'
import { Drawer } from '../../../shared/components/drawer.component'
import { RenderOverflow } from '../../../shared/components/renderers/render-overflow.component'
import { Rigidbody } from '../../../shared/components/rigidbody.component'
import { Transform } from '../../../shared/components/transform.component'
import { Input } from '../components/input.component'

/**
 * Entity that represents the spaceship used by the `master` screen,
 * with all of its methods and properties.
 */
@Entity({
  order: 1,
  services: [SocketService],
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
  ],
})
export class Spaceship
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy, IDraw, IOnLateLoop
{
  /**
   * Property that defines the spaceship model image.
   */
  image: HTMLImageElement

  /**
   * Property that contains the spaceship position, dimensions and rotation.
   */
  private transform: Transform

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that represents the spaceship direction.
   */
  public get direction(): Vector2 {
    return new Vector2(
      Math.sin(this.transform.rotation),
      Math.cos(this.transform.rotation),
    )
  }

  onAwake() {
    this.socketService = this.getService(SocketService)

    this.transform = this.getComponent(Transform)
  }

  onStart() {
    this.image = new Image()
    this.image.src = './assets/svg/spaceship-grey.svg'
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
