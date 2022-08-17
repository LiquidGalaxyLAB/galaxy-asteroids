import {
  AbstractEntity,
  Entity,
  IDraw,
  IOnAwake,
  IOnLoop,
  IOnStart,
  Vector2,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { Drawer } from '../../../shared/components/drawer.component'
import { Render } from '../../../shared/components/renderers/render.component'
import { Rigidbody } from '../../../shared/components/rigidbody.component'
import { Transform } from '../../../shared/components/transform.component'

import { IBullet } from '../interfaces/bullet.interface'

import { Subscription } from 'rxjs'

/**
 * Class that represents the slave bullet entity and its behavior.
 */
@Entity({
  services: [SocketService],
  components: [
    Drawer,
    Render,
    {
      id: '__bullet_transform__',
      class: Transform,
    },
    {
      id: '__bullet_rigidbody__',
      class: Rigidbody,
    },
  ],
})
export class BulletSlave
  extends AbstractEntity
  implements IBullet, IDraw, IOnAwake, IOnLoop, IOnStart
{
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
   * Property that contains the bullet position, dimensions and rotation.
   */
  transform: Transform

  /**
   * Property that contains the bullet physics.
   */
  rigidbody: Rigidbody

  /**
   * Property that links the bullet to its user by the user id.
   */
  userId: string

  /**
   * Property that represents the bullet direction.
   */
  get direction() {
    return new Vector2(
      Math.sin(this.transform.rotation),
      Math.cos(this.transform.rotation),
    )
  }

  onAwake() {
    this.socketService = this.getService(SocketService)
    this.transform = this.getComponent(Transform)
    this.rigidbody = this.getComponent(Rigidbody)
  }

  onStart() {
    this.subscriptions.push(
      this.socketService.on<string>('destroy').subscribe((id) => {
        if (id === this.id) {
          this.destroy(this)
          this.subscriptions.forEach((s) => s.unsubscribe())
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

    this.getContexts()[0].shadowColor = '#00ffff'
    this.getContexts()[0].shadowBlur = 25

    this.getContexts()[0].beginPath()
    this.getContexts()[0].fillStyle = '#00ffff'
    this.getContexts()[0].rect(
      0,
      0,
      this.transform.dimensions.width,
      this.transform.dimensions.height,
    )
    this.getContexts()[0].fill()
    this.getContexts()[0].closePath()

    this.getContexts()[0].shadowColor = 'transparent'
    this.getContexts()[0].shadowBlur = 0

    this.getContexts()[0].rotate(-this.transform.rotation)
    this.getContexts()[0].translate(
      -this.transform.canvasPosition.x,
      -this.transform.canvasPosition.y,
    )
  }

  onLoop() {
    const hasOverflowX =
      this.transform.canvasPosition.x + this.transform.dimensions.width + 50 <
        0 ||
      this.transform.canvasPosition.x - this.transform.dimensions.width - 50 >
        this.getContexts()[0].canvas.width
    const hasOverflowY =
      this.transform.canvasPosition.y + this.transform.dimensions.height + 50 <
        0 ||
      this.transform.canvasPosition.y - this.transform.dimensions.height - 50 >
        this.getContexts()[0].canvas.height

    if (hasOverflowX || hasOverflowY) {
      this.destroy(this)
    }
  }
}
