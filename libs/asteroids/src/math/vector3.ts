/**
 * Class that represents a vector with three dimensions.
 *
 * This can be used to represents forces, velocity, position and
 * dimensions or some entity.
 *
 * @example
 * ```ts
 * const vector = new Vector3(1, 1, 1)
 * ```
 *
 * @see https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)
 */
export class Vector3 {
  /**
   * Property that returns the module of the vector.
   */
  public get magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z + this.z)
  }

  /**
   * Property that returns a vector with the same direction but with
   * magnitude 1.
   *
   * @example
   * ```ts
   * const vector = new Vector2(3, 4, 0) // { x: 3, y: 4, z: 0 }
   * const normalizedVector = vector.nomalized // { x: 0.6, y: 0.8, z: 0 }
   * ```
   */
  public get normalized() {
    if (!this.magnitude) {
      new Vector3()
    }

    return new Vector3(
      this.x / this.magnitude,
      this.y / this.magnitude,
      this.z / this.magnitude,
    )
  }

  public constructor(public x = 0, public y = 0, public z = 0) {}

  /**
   * Method that calculates the distance between two vectors using
   * `Euclidean distance`.
   *
   * @param v1 defines the first vector.
   * @param v2 defines the second vector.
   * @returns a number that represents the distance between them both.
   *
   * @see https://en.wikipedia.org/wiki/Euclidean_distance
   */
  public static distance(v1: Vector3, v2: Vector3) {
    const x = v1.x - v2.x
    const y = v1.y - v2.y
    const z = v1.z - v2.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Method that sums all vectors from the array using.
   *
   * @param vectors defines an array of vectors that will be summed.
   * @returns a vector that represent the sum of all vectors.
   */
  public static sum(...vectors: Vector3[]) {
    return vectors.reduce(
      (previous, current) =>
        new Vector3(
          previous.x + current.x,
          previous.y + current.y,
          previous.z + current.z,
        ),
    )
  }

  /**
   * Method that multiplies the vector for the number.
   *
   * @param factor defines the vector that will be mutiplied.
   * @param value defines a number that represents the mutiplier.
   * @returns the vector multiplied for the number.
   *
   * @example
   * (2, 4, 3) * 2 = (4, 8, 6)
   */
  public static multiply(factor: Vector3, value: number): Vector3 {
    return new Vector3(factor.x * value, factor.y * value, factor.z * value)
  }
}
