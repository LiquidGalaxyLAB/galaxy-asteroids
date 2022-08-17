import {
  AbstractEntity,
  appendChildren,
  destroyMultipleElements,
  Entity,
  getElement,
  getHtml,
  IOnAwake,
  IOnDestroy,
  IOnStart,
} from '@asteroids'

import { UserService } from '../../../shared/services/user.service'

import { Subscription } from 'rxjs'

@Entity({
  services: [UserService],
})
export class Score
  extends AbstractEntity
  implements IOnAwake, IOnStart, IOnDestroy
{
  /**
   * Property that defines the user service.
   */
  private userService: UserService

  /**
   * Property that defines an array of subscriptions that will be unsubscribed when
   * the entity is destroyed.
   */
  private subscriptions: Subscription[] = []

  score = 0

  onAwake() {
    this.userService = this.getService(UserService)
  }

  onStart() {
    this.subscriptions.push(
      this.userService.score$.subscribe((score) => {
        this.setScore(score)
      }),
    )

    this.insertHtml()
  }

  onDestroy() {
    destroyMultipleElements('ast-score')
    this.subscriptions.forEach((s) => s.unsubscribe())
  }

  /**
   * Sets the given score `amount` into the HTML.
   * @param amount the amount of points to be set.
   * @returns the amount of points.
   */
  setScore(amount: number) {
    this.score = amount

    const el = getElement('.score-container > .score')
    if (el) {
      el.innerHTML = this.score.toString()
    }

    return amount
  }

  /**
   * Inserts the score HTML into the body.
   */
  private async insertHtml() {
    destroyMultipleElements('ast-score')

    const html = await getHtml('score', 'ast-score')
    const score = html.querySelector('.score')

    if (score) {
      this.score = +score.innerHTML
      this.userService.setScore(this.score)
    }

    appendChildren(document.body, html)
  }
}
