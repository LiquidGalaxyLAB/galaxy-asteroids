import { AbstractEntity, Entity, IOnStart } from '@asteroids'

@Entity()
export class ManagerSingleplayer extends AbstractEntity implements IOnStart {
  onStart() {
    // TODO: implement screens amount and number setting
    const screenAmount = 3
    const screenNumber = 1

    this.getContexts().forEach((context) => {
      context.canvas.width = window.innerWidth * screenAmount
      context.canvas.height = window.innerHeight
      context.canvas.style.transform = 'translateX(0px)'
    })

    setTimeout(() => {
      screenNumber === 1 ? this.master() : this.slave()
    }, 100)
  }

  private master() {
    // TODO: implement master screen logic
  }

  private slave() {
    // TODO: implement slave screen logic
  }
}
