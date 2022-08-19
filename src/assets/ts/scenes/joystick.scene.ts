import { AbstractScene, IOnStart, Scene } from '@asteroids'

import { Joystick as JoystickEntity } from '../ui/joystick/entities/joystick.entity'

@Scene()
export class Joystick extends AbstractScene implements IOnStart {
  onStart() {
    this.instantiate({ entity: JoystickEntity })
  }
}
