import { Vector2 } from '.'

/**
 * Returns the module or absolute value from the given value.
 *
 * @param value defines the value that will be converted.
 * @returns the value absolute value.
 *
 * @example
 * abs(10) => 10
 * abs(-10) => 10
 */
export function abs(value: number) {
  return Math.sqrt(value * value)
}

/**
 * Given a value, checks whether the value is within the given range
 * (min & max), if it's not, converts the value to the closest value
 * of the range.
 *
 * @param value defines the value that will be clamped.
 * @param min the min value.
 * @param max the max value.
 * @returns the converted value.
 *
 * @example
 * clamp(10, 2, 12) => 10
 * clamp(10, 12, 20) => 12
 * clamp(10, 2, 8) => 8
 */
export function clamp(value: number, min: number, max: number) {
  if (value <= min) {
    return min
  }

  if (value >= max) {
    return max
  }

  return value
}

/**
 * Returns a vector based on the given angle.
 *
 * @param angle defines the vector angle.
 * @returns the calculated vector.
 */
export function angleToVector2(angle: number) {
  return new Vector2(Math.cos(angle), Math.sin(angle))
}

/**
 * Returns the vector's angle using the whole trigonometry circle.
 *
 * @param vector defines an object that represents the vector.
 * @returns a number that represents the vector angle.
 */
export function vector2ToAngle(vector: Vector2) {
  const normalized = vector.normalized
  const value = Math.atan2(normalized.y, normalized.x)
  return value < 0 ? 2 * Math.PI + value : value
}
