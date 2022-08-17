import {
  AbstractEntity,
  addClass,
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

import { LGService } from '../../../shared/services/lg.service'
import { UserService } from '../../../shared/services/user.service'

import { Singleplayer } from '../../../scenes/single.scene'
import { StorageEnum } from '../../../shared/enums/storage.enum'
import { firstValueFrom, Subscription } from 'rxjs'

@Entity({
  services: [LGService, SocketService, UserService],
})
export class Menu
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
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
    this.lgService = this.getService(LGService)
    this.socketService = this.getService(SocketService)
    this.userService = this.getService(UserService)
  }

  onStart() {
    this.subscriptions.push(
      this.socketService.on<string>('change-scene').subscribe((scene) => {
        switch (scene) {
          case 'single':
            this.scene.unload(this.scene)
            this.scene.load(Singleplayer)
            break
        }
      }),

      this.lgService.getScreenAmount().subscribe(async (amount) => {
        if (!amount) {
          return
        }

        this.lgService.screenAmount = amount
        await firstValueFrom(
          this.lgService.connectScreen(this.lgService.getPathScreenNumber()),
        )

        this.lgService.setCanvasSize()

        this.getContexts().forEach((context) => {
          context.canvas.width = this.lgService.canvasWidth
          context.canvas.height = this.lgService.canvasHeight
          context.canvas.style.transform = `translateX(-${this.lgService.displacement}px)`
        })

        if (this.lgService.master) {
          this.insertHtml()
        } else {
          this.insertSlaveHtml()
        }
      }),
    )
  }

  onDestroy() {
    destroyMultipleElements('ast-menu')
    destroyMultipleElements('ast-controller-menu')
    destroyMultipleElements('.overlay')

    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  private loadMenu() {
    const inputName = getElement<HTMLInputElement>('#nickname-input')

    const spaceshipSkin = getElement<HTMLImageElement>('.spaceship-skin')
    const colorPicker = getElement('.spaceship-color-picker')

    const localNickname = window.localStorage.getItem(StorageEnum.NICKNAME)
    const localColor = window.localStorage.getItem(StorageEnum.COLOR)

    const colorButtons: HTMLButtonElement[] = []

    if (!(spaceshipSkin && inputName && colorPicker)) {
      return
    }

    if (localNickname) {
      inputName.value = localNickname
    }

    const spaceshipColors = [
      {
        name: 'grey',
        color: '#888888',
      },
      {
        name: 'red',
        color: '#ff0055',
      },
      {
        name: 'blue',
        color: '#0084ff',
      },
      {
        name: 'orange',
        color: '#ff9c41',
      },
      {
        name: 'green',
        color: '#59c832',
      },
      {
        name: 'purple',
        color: '#d45aff',
      },
    ]

    inputName.addEventListener('input', (e: InputEvent) => {
      window.localStorage.setItem(
        StorageEnum.NICKNAME,
        (e.target as HTMLInputElement).value,
      )
    })

    spaceshipColors.forEach(({ name, color }, index) => {
      const colorButton = createElement<HTMLButtonElement>('button')
      addClass(colorButton, 'color-button', name)

      if (index === 0) {
        addClass(colorButton, 'active')
      }

      colorButton.style.backgroundColor = color
      colorButtons.push(colorButton)

      if (colorPicker) {
        appendChildren(colorPicker, colorButton)
      }

      colorButton.addEventListener('click', () => {
        if (colorButton.classList.contains('active')) {
          return
        }

        this.userService.color = colorButton.style.backgroundColor
        this.userService.image = name

        this.socketService.emit('update-player', {
          nickname: this.userService.nickname,
          color: name,
        })

        removeClass('.color-button.active', 'active')
        addClass(colorButton, 'active')

        window.localStorage.setItem(
          StorageEnum.COLOR,
          JSON.stringify({
            rgb: colorButton.style.backgroundColor,
            name,
          }),
        )

        spaceshipSkin.src = `./assets/svg/spaceship-${name}.svg`
      })
    })

    if (localColor) {
      const colorName = JSON.parse(localColor).name

      colorButtons.forEach((button) =>
        button.classList.contains(colorName)
          ? addClass(button, 'active')
          : removeClass(button, 'active'),
      )

      spaceshipSkin.src = `./assets/svg/spaceship-${colorName}.svg`
    }
  }

  /**
   * Inserts the menu HTML into the body.
   */
  private async insertHtml() {
    destroyMultipleElements('ast-menu')

    const html = await getHtml('menu', 'ast-menu')
    html.style.position = 'absolute'
    html.style.top = '0'
    html.style.left = '0'

    appendChildren(document.body, html)

    this.loadMenu()

    const spButton = getElement<HTMLButtonElement>('.play-singleplayer')
    const colorButtons = getMultipleElements(
      '.color-button',
    ) as HTMLButtonElement[]

    const inputName = getElement<HTMLInputElement>('#nickname-input')

    if (!spButton || !inputName) {
      return
    }

    spButton.addEventListener('click', () => {
      setTimeout(() => {
        this.lgService.changeScene('single')
      }, 400)
    })

    colorButtons.forEach((button) => {
      if (button.classList.contains('active')) {
        this.userService.color = button.style.backgroundColor
        this.userService.image = button.classList.item(1)
      }
    })

    this.userService.nickname = inputName.value

    inputName.addEventListener('input', (event: InputEvent) => {
      const value = (event.target as HTMLInputElement).value
      this.userService.nickname = value

      this.socketService.emit('update-player', {
        nickname: value,
        color: this.userService.image,
      })
    })

    this.socketService
      .on<Record<string, string>>('update-player')
      .subscribe((player) => {
        this.userService.nickname = player.nickname
        inputName.value = player.nickname

        const colorButton = getElement<HTMLButtonElement>(
          `.color-button.${player.color}`,
        )

        if (!colorButton) {
          return
        }

        removeClass(`.color-button.${this.userService.image}`, 'active')
        addClass(colorButton, 'active')

        this.userService.color = colorButton.style.backgroundColor
        this.userService.image = player.color

        window.localStorage.setItem(StorageEnum.NICKNAME, player.nickname)
        window.localStorage.setItem(
          StorageEnum.COLOR,
          JSON.stringify({
            rgb: colorButton.style.backgroundColor,
            name: player.color,
          }),
        )

        const skin = getElement<HTMLImageElement>('.spaceship-skin')
        skin.src = `./assets/svg/spaceship-${player.color}.svg`
      })
  }

  /**
   * Inserts the menu HTML into the body.
   */
  private async insertSlaveHtml() {
    destroyMultipleElements('.overlay')

    const div = createElement('div')
    addClass(div, 'overlay')

    appendChildren(document.body, div)
  }
}
