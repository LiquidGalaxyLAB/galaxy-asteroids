import { AbstractScene, IOnStart, Scene } from '@asteroids'

import { ManagerSingleplayer } from '../game-objects/manager-sp/entities/manager-sp.entity'
import { Background } from '../ui/background/entities/background.entity'
import { SpaceBackground } from '../ui/background/entities/space-background.entity'

@Scene()
export class Singleplayer extends AbstractScene implements IOnStart {
  onStart() {
    this.createCanvas({
      name: 'singleplayer',
      mode: 'clear',
      sortingLayer: '1',
    })
    this.createCanvas({
      name: 'trailing',
    })

    this.instantiate({ entity: Background })
    this.instantiate({ entity: SpaceBackground })

    this.instantiate({ entity: ManagerSingleplayer })
  }
}
