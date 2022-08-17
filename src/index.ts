import './global.scss'
import 'reflect-metadata'

import { AbstractScene, AsteroidsFactory, Type } from '@asteroids'

import { Menu } from './assets/ts/scenes/menu.scene'

/**
 * Creates and starts the game.
 */
function bootstrap<S extends AbstractScene>(scene: Type<S>) {
  const game = AsteroidsFactory.create({
    bootstrap: [scene],
  })
  game.start()
}
bootstrap(Menu)
