import {
  AbstractEntity,
  addClass,
  appendChildren,
  destroyMultipleElements,
  Entity,
  getElement,
  getHtml,
  IOnAwake,
  IOnDestroy,
  IOnStart,
  removeClass,
} from '@asteroids'

import { SocketService } from '../../../shared/services/socket.service'

import { GameOver } from '../../game-over/entities/game-over.entity'

import { UserService } from '../../../shared/services/user.service'

import { IJoystickActions } from '../../../shared/interfaces/joystick.interface'
import { IPlayer } from '../../../shared/interfaces/player.interface'

import { Menu } from '../../../scenes/menu.scene'
import nipplejs, { JoystickManager } from 'nipplejs'
import { Subscription } from 'rxjs'

/**
 * Class that represents the player joystick controller and its behavior.
 */
@Entity({
  services: [SocketService, UserService],
})
export class Joystick
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
  /**
   * Property that defines the socket service.
   */
  private socketService: SocketService

  /**
   * Property that defines the user service.
   */
  private userService: UserService

  /**
   * Property that defines the analog controller manager.
   */
  private joystickManager: JoystickManager

  /**
   * Property that defines an array of subscriptions that will be unsubscribed when
   * the entity is destroyed.
   */
  private subscriptions: Subscription[] = []

  /**
   * Property that defines whether the boost lock button is active.
   */
  // private isBoostLocked = false

  /**
   * Property that defines the joystick actions status.
   */
  private actions: IJoystickActions = {
    isShooting: false,
    isBoosting: false,
    activatedSkill: false,
    rotating: null,
  }

  onAwake() {
    this.socketService = this.getService(SocketService)
    this.userService = this.getService(UserService)
  }

  onStart() {
    this.insertJoystickHtml()

    this.subscriptions.push(
      this.socketService.on<string>('change-scene').subscribe((scene) => {
        switch (scene) {
          case 'menu':
            destroyMultipleElements('ast-joystick')
            this.scene.unload(this.scene)
            this.scene.load(Menu)
            break
        }
      }),
      this.socketService.on<IPlayer>('game-over').subscribe((player) => {
        this.userService.setScore(player?.score ?? 0)
        destroyMultipleElements('ast-joystick')
        this.instantiate({ entity: GameOver })
      }),
    )
  }

  onDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  /**
   * Inserts the joystick HTML into the body element.
   */
  private async insertJoystickHtml() {
    const html = await getHtml('joystick', 'ast-joystick')
    html.style.position = 'absolute'
    html.style.top = '0'
    html.style.left = '0'

    appendChildren(document.body, html)

    this.configureJoystick()
    this.listenForEvents()
  }

  /**
   * Creates and configures the joystick manager using NippleJS.
   */
  private configureJoystick() {
    const zone = getElement('.analog-region')

    if (!zone) {
      return
    }

    this.joystickManager = nipplejs.create({
      color: '#48bdff',
      lockX: true,
      restOpacity: 0.8,
      catchDistance: 300,
      position: {
        bottom: '150px',
        left: '170px',
      },
      mode: 'static',
      zone,
    })
  }

  /**
   * Listens for DOM events, such as button pressure or analog direction.
   */
  private listenForEvents() {
    const shootButton = getElement<HTMLButtonElement>('.shoot-button')
    const boostButton = getElement<HTMLButtonElement>('.boost-button')
    // const boostLockButton = getElement<HTMLButtonElement>('.boost-lock-button')
    const skillButton = getElement<HTMLButtonElement>('.skill-button')

    if (!(shootButton && boostButton && skillButton)) {
      return
    }

    shootButton.addEventListener('touchstart', () => {
      this.actions.isShooting = true
      addClass(shootButton, 'active')
      this.emitActions()
    })

    shootButton.addEventListener('touchend', () => {
      this.actions.isShooting = false
      removeClass(shootButton, 'active')
      this.emitActions()
    })

    boostButton.addEventListener('touchstart', () => {
      // removeClass(boostLockButton, 'active')
      // this.isBoostLocked = false
      addClass(boostButton, 'active')

      this.actions.isBoosting = true
      this.emitActions()
    })

    boostButton.addEventListener('touchend', () => {
      this.actions.isBoosting = false
      removeClass(boostButton, 'active')
      this.emitActions()
    })

    // boostLockButton.addEventListener('click', () => {
    //   if (!this.isBoostLocked) {
    //     addClass(boostLockButton, 'active')
    //   } else {
    //     removeClass(boostLockButton, 'active')
    //   }

    //   this.isBoostLocked = !this.isBoostLocked
    //   this.actions.isBoosting = this.isBoostLocked
    //   this.emitActions()
    // })

    skillButton.addEventListener('click', () => {
      this.actions.activatedSkill = true
      removeClass(skillButton, 'active')
      this.emitActions()
    })

    this.joystickManager.on('dir:left', () => {
      this.actions.rotating = 'left'
      this.emitActions()
    })

    this.joystickManager.on('dir:right', () => {
      this.actions.rotating = 'right'
      this.emitActions()
    })

    this.joystickManager.on('end', () => {
      this.actions.rotating = null
      this.emitActions()
    })
  }

  /**
   * Emits to socket the current joystick actions status.
   */
  private emitActions() {
    this.socketService.emit('update-actions', {
      userId: this.userService.userId,
      actions: this.actions,
    })
    this.actions.activatedSkill = false
  }
}
