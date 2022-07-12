import { AbstractComponent, Component, IDraw, IOnAwake } from '@asteroids'
import { hasDraw } from '@asteroids/src/utils/validations'

import { Transform } from './transform.component'

/**
 * Component responsible for drawing entities.
 */
@Component({
  required: [Transform],
})
export class Drawer extends AbstractComponent implements IOnAwake, IDraw {
  private transform: Transform

  onAwake(): void {
    this.transform = this.getComponent(Transform)
  }

  draw(): void {
    if (!this.enabled) {
      return
    }

    const entities = [
      this.entity,
      ...this.transform.children.map((t: any) => t.entity),
    ]
    const components = entities
      .map((e) => e.getAllComponents())
      .flat()
      .filter((c) => c.constructor.name !== Drawer.name)

    ;[...entities, ...components]
      .sort((current, previous) => current.order - previous.order)
      .filter((instance) => hasDraw(instance))
      .forEach((instance) => (instance as any).draw())
  }
}
