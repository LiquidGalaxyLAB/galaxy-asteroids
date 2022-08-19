import {
  AbstractEntity,
  appendChildren,
  createElement,
  destroyMultipleElements,
  Entity,
  getElement,
  getHtml,
  getMultipleElements,
  IOnAwake,
  IOnDestroy,
  IOnStart,
  removeClass,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { GameService } from '../../../shared/services/game.service'
import { LGService } from '../../../shared/services/lg.service'
import { UserService } from '../../../shared/services/user.service'

import { mobile } from '../../../utils/platform'

import { Joystick } from '../../../scenes/joystick.scene'
import { Menu } from '../../../scenes/menu.scene'
import { Singleplayer } from '../../../scenes/single.scene'
import { Subscription } from 'rxjs'

@Entity({
  services: [GameService, LGService, SocketService, UserService],
})
export class GameOver
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
  /**
   * Property that defines the game service.
   */
  private gameService: GameService

  /**
   * Property that defines the Liquid Galaxy service.
   */
  private lgService: LGService

  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines the user service.
   */
  private userService: UserService

  /**
   * Property that defines an array of subscriptions that will be unsubscribed when
   * the entity is destroyed.
   */
  private subscriptions: Subscription[] = []

  onAwake() {
    this.gameService = this.getService(GameService)
    this.lgService = this.getService(LGService)
    this.socketService = this.getService(SocketService)
    this.userService = this.getService(UserService)
  }

  onStart() {
    if (this.lgService.master || mobile) {
      this.insertHtml()
    } else {
      this.insertSlaveHtml()
    }

    this.subscriptions.push(
      this.socketService.on<string>('change-scene').subscribe((scene) => {
        switch (scene) {
          case 'single':
            this.scene.unload(this.scene)
            this.scene.load(mobile ? Joystick : Singleplayer)
            break
          case 'menu':
            this.scene.unload(this.scene)
            this.scene.load(Menu)
            break
        }
      }),
    )
  }

  onDestroy() {
    destroyMultipleElements('ast-game-over')
    destroyMultipleElements('.overlay')

    this.gameService.gameOver = false
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  /**
   * Inserts the game over HTML into the body.
   */
  private async insertHtml() {
    destroyMultipleElements('ast-score')
    getMultipleElements('canvas').forEach((canvas) => {
      canvas.style.pointerEvents = 'none'
    })

    const html = await getHtml('game-over', 'ast-game-over')
    html.style.position = 'absolute'
    html.style.top = '0'
    html.style.left = '0'

    appendChildren(document.body, html)
    removeClass('.game-over-container', 'hide')

    const score = getElement('ast-game-over .score .amount')
    if (score) {
      score.innerHTML = this.userService.score.toString()
    }

    const respawnButton = getElement<HTMLButtonElement>('.respawn')
    const backButton = getElement<HTMLButtonElement>('.back-menu')

    if (!respawnButton || !backButton) {
      return
    }

    respawnButton.addEventListener('click', () => {
      getMultipleElements('canvas').forEach((canvas) => {
        canvas.style.pointerEvents = 'unset'
      })

      this.lgService.changeScene('single')
    })

    backButton.addEventListener('click', () => {
      this.lgService.changeScene('menu')
    })
  }

  /**
   * Inserts the game over overlay HTML into the body.
   */
  private async insertSlaveHtml() {
    destroyMultipleElements('.overlay')

    const div = createElement('div')
    div.classList.add('overlay')

    appendChildren(document.body, div)
  }
}
