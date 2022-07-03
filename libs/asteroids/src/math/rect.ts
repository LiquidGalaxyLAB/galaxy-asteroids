/**
 * Class that represents some rect, used to set dimensions to entities.
 */
export class Rect {
  /**
   * Property that defines the rect area.
   */
  get area() {
    return this.width * this.height
  }

  constructor(public width = 1, public height = 1) {}
}
