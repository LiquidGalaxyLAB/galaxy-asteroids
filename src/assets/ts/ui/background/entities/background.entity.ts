import { AbstractEntity, Entity, IDraw } from '@asteroids'

import { Drawer } from '../../../shared/components/drawer.component'
import { Render } from '../../../shared/components/renderers/render.component'
import { Transform } from '../../../shared/components/transform.component'

@Entity({
  components: [Drawer, Transform, Render],
})
export class Background extends AbstractEntity implements IDraw {
  draw() {
    this.getContexts()[0].fillStyle = 'rgb(13, 13, 13, 1)'
    this.getContexts()[0].fillRect(
      0,
      0,
      this.getContexts()[0].canvas.width,
      this.getContexts()[0].canvas.height,
    )
  }
}
