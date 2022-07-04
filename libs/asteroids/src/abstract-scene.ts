import { AbstractEntity, clamp, v4, IContext, Type } from '..'

import { IAsteroidsApplication } from './interfaces/asteroids-application.interface'
import { ICanvasOptions } from './interfaces/canvas-options.interface'
import { IEnabled } from './interfaces/enabled.interface'
import { IInstantiateOptions } from './interfaces/instantiate-options.interface'

/**
 * The scene represents a handler for entities in the game.
 *
 * Scenes can be created using the `load` method and passing the
 * scene class type as parameter. When a scene is unloaded, through the
 * `unload` method, all it child entities are destroyed like it
 * components.
 */
export abstract class AbstractScene implements IEnabled {
  /**
   * Property that enables the scene.
   *
   * All "loop" methods such as "onLoop" or "onLateLoop" are only executed
   * when the structure is activated, as well as its children's "loop"
   * methods.
   *
   * In this case, when the scene is disabled, child entities and
   * their components are also.
   */
  enabled = true

  /**
   * Property that defines an object that represents the canvas context
   */
  private _contexts: IContext[] = []

  get timeScale(): number {
    return this.game.timeScale
  }

  set timeScale(value: number) {
    this.game.timeScale = clamp(value, 0, 1)
  }

  constructor(
    readonly id: number | string,
    readonly game: IAsteroidsApplication,
    public entities: AbstractEntity[] = [],
  ) {}

  /**
   * Method that can create a new project scene
   *
   * @param scene defines the scene type
   * @returns the created scene
   */
  load<S extends AbstractScene>(scene: Type<S>): S {
    return this.game.load(scene)
  }

  /**
   * Method that unloads some specified scene.
   *
   * @param scene defines the scene id, type or instance
   */
  unload<S extends AbstractScene>(scene: string | S | Type<S>): void {
    this.game.unload(scene)
    for (const context of this._contexts) {
      if (document.getElementById(context.canvas.id)) {
        document.querySelector('body').removeChild(context.canvas)
      }
    }
  }

  /**
   * Method that creates a new canvas for rendering the game entities
   *
   * @param options defines an object that represents the canvas
   * creation options
   * @returns the created canvas context
   */
  createCanvas(options?: ICanvasOptions): IContext {
    const canvas = document.createElement('canvas')
    canvas.id = options.name ?? '' + v4()

    options ??= {} as ICanvasOptions
    canvas.style.zIndex = options.sortingLayer ?? '0'
    canvas.width = options.width ?? window.innerWidth
    canvas.height = options.height ?? window.innerHeight

    document.querySelector('body').appendChild(canvas)

    const context: IContext = canvas.getContext('2d')
    context.mode = options.mode

    this._contexts.push(context)
    return context
  }

  /**
   * Method that can create new entities
   *
   * @param options defines the entity options when intantiating it
   * @returns the created entity
   */
  instantiate<E extends AbstractEntity>(
    options?: IInstantiateOptions<E>,
  ): E extends AbstractEntity ? E : AbstractEntity {
    options.scene ??= this
    return this.game.instantiate(options)
  }

  /**
   * Method that returns the game context
   *
   * @returns an object that represents the game context
   */
  getContexts(): IContext[] {
    return this._contexts
  }

  /**
   * Method that returns all the entities instantiated in this scene
   *
   * @returns an array with all the found entities
   */
  getEntities(): AbstractEntity[] {
    return this.entities
  }

  /**
   * Adds an intent to the intents array.
   *
   * @param intent a callback to be called in the end of the loop.
   */
  addIntent(intent: () => void): void {
    this.game.addIntent(intent)
  }

  /**
   * Removes an intent from the intents array.
   *
   * @param intent the intent to be removed.
   */
  removeIntent(intent: () => void): void {
    this.game.removeIntent(intent)
  }
}
