import { AbstractScene, IOnStart, Scene } from '@asteroids'

import { Background } from '../ui/background/entities/background.entity'
import { Menu as MenuEntity } from '../ui/menu/entity/menu.entity'

@Scene()
export class Menu extends AbstractScene implements IOnStart {
  onStart() {
    this.createCanvas({
      name: 'menu',
      mode: 'clear',
    })

    this.instantiate({ entity: Background })
    this.instantiate({ entity: MenuEntity })
  }
}
