import { AbstractEntity } from './abstract-entity'
import { Entity } from './decorators/entity.decorator'

import { AbstractService } from './abstract-service'

import { AbstractComponent } from './abstract-component'

import { AbstractScene } from './abstract-scene'

import {
  IAsteroidsApplication,
  GameFactoryOptions,
  IInstantiateOptions,
  IProvider,
  Type,
} from './interfaces'

import {
  hasOnStart,
  hasOnLoop,
  hasOnAwake,
  isEntity,
  hasOnFixedLoop,
  hasOnLateLoop,
  hasOnDestroy,
  isScene,
  hasOnRender,
} from './utils/validations'

import { COMPONENT_OPTIONS, ENTITY_OPTIONS, SERVICE_OPTIONS } from './constants'

import { v4 } from '..'

/**
 * Class that represents an empty entity, used to instantiate an entity
 * with only components, without any logic or behaviour inside of it
 */
@Entity()
export class DefaultEntity extends AbstractEntity {}

/**
 * Class that represents the main application behaviour
 */
class AsteroidsApplication implements IAsteroidsApplication {
  timeScale = 1

  /**
   * Property that defines an array of scenes, that represents all the
   * loaded entities in the game
   */
  private scenes: AbstractScene[] = []

  /**
   * Property that defines an array of entities, that represents all the
   * instantiated entities in the game
   */
  private entities: AbstractEntity[] = []

  /**
   * Property that defines an array of components, that represents all the
   * instantiated components in the game
   */
  private components: AbstractComponent[] = []

  /**
   * Property that defines an array of services, that represents all the
   * instantiated services in the game
   */
  private services: AbstractService[] = []

  /**
   * Property that defines an array of intents (callbacks), that are called
   * at the end of the loop.
   */
  private intents: (() => void)[] = []

  constructor(private readonly bootstrap: Type<AbstractScene>[]) {}

  /**
   * Method that starts the game lifecycle
   */
  start(): void {
    this.bootstrap.forEach((scene) => this.load(scene))

    this.startRenderLoop()
    this.startLoop()
  }

  /**
   * Method that can create a new project scene
   *
   * @param scene defines the scene type
   * @returns the created scene
   */
  load<S extends AbstractScene>(scene: Type<S>): S {
    const instance = new scene(v4(), this)

    if (hasOnStart(instance)) {
      instance.onStart()
    }

    this.scenes.push(instance)
    return instance
  }

  /**
   * Method that unloads some specified scene.
   *
   * @param scene defines the scene id, type or instance
   */
  unload<S extends AbstractScene>(scene: string | S | Type<S>): void {
    let instance: AbstractScene
    if (typeof scene === 'string') {
      instance = this.scenes.find((s) => s.id === scene)
    } else if (typeof scene === 'function') {
      instance = this.scenes.find((s) => s.constructor.name === scene.name)
    } else {
      instance = scene
    }

    this.destroy(instance)
  }

  /**
   * Method that can create new entities
   *
   * @param options defines an object that contains all the options
   * needed to create a new entity
   * @returns the created entity
   */
  instantiate<E extends AbstractEntity>(
    options?: IInstantiateOptions<E>,
  ): E extends AbstractEntity ? E : AbstractEntity {
    const instance =
      options && options.entity
        ? new options.entity(v4(), options.scene)
        : new DefaultEntity(v4(), options.scene)

    options.scene.entities.push(instance)

    if (options.use) {
      for (const key in options.use) {
        ;(instance as any)[key] = options.use[key]
      }
    }

    instance.order =
      options.order ?? this.getOrderFromMetadata(options.entity) ?? 0

    // convert all the components and providers to providers
    const components = this.toProviders([
      ...(this.getComponentsFromMetadata(options.entity) ?? []),
      ...(options.components ?? []),
    ])

    // convert all the services and providers to providers
    const services = this.toProviders([
      ...(this.getServicesFromMetadata(options.entity) ?? []),
      ...(options.services ?? []),
      ...components
        .map((c) => this.getServicesFromMetadata(c.class) ?? [])
        .flat(),
    ])

    if (services && services.length) {
      // creates the services
      instance.services = services
        .filter((p) => !!p.class)
        .map((provider) => this.findOrCreateService(provider.class))
    }

    if (components && components.length) {
      // validate the `required` property in all the components passed as dependency
      components
        .filter((c) => !!c.class)
        .map((c) => this.getRequiredComponentsInMetadata(c.class) ?? [])
        .flat()
        .forEach((r) => {
          if (!components.find((c) => c.class === r)) {
            throw new Error(
              `Component ${r.name} is required in ${options.entity.name} entity`,
            )
          }
        })

      // creates the components
      instance.components = components
        .filter((c) => !!c.class)
        .map((c) => {
          const order = this.getOrderFromMetadata(c.class) ?? 0
          const component = new c.class(c.id, instance)
          component.order = order
          return component
        })
    }

    const instances = [instance, ...instance.components, ...instance.services]

    // invoke the `onAwake` method for the entity and it components and services
    instances.forEach((value) => {
      if (hasOnAwake(value)) {
        value.onAwake()
      }
    })

    // set all the components or services properties
    if (instance.components && instance.components.length) {
      instance.components.forEach((c) => {
        components
          .filter((p) => p.id === c.id)
          .filter((provider) => !!provider.use)
          .forEach((provider) => {
            for (const key in provider.use) {
              ;(c as any)[key] = provider.use[key]
            }
          })
      })
    }

    // invoke the `onStart` method for the entity and it components and services
    instances.forEach((value) => {
      if (hasOnStart(value)) {
        value.onStart()
      }
    })

    this.entities.push(instance)
    this.components.push(...instance.components)

    return instance as E extends AbstractEntity ? E : AbstractEntity
  }

  /**
   * Method that finds some scene with the specified type
   *
   * @param type defines the scene type
   * @returns an object that represents the scene instance
   */
  getScene<S extends AbstractScene>(type: Type<S>) {
    return this.scenes.find(
      (scene) => scene.constructor.name === type.name,
    ) as S
  }

  /**
   * Method that adds a new component to a specific entity instance
   *
   * @param component defines the component type
   * @returns an object that represents the component instance
   */
  addComponent<E extends AbstractEntity, C extends AbstractComponent>(
    entity: E,
    component: Type<C> | IProvider<C>,
  ): C {
    const provider = this.toProviders([component])[0]

    const c = new provider.class(v4(), entity)
    entity.components.push(c)

    if (provider.use) {
      for (const key in provider.use) {
        ;(c as any)[key] = provider.use[key]
      }
    }

    if (hasOnAwake(c)) {
      c.onAwake()
    }

    if (hasOnStart(c)) {
      c.onStart()
    }

    this.components.push(c)
    return c
  }

  /**
   * Method that adds a new service to a specific entity instance
   *
   * @param service defines the service type
   * @returns an object that represents the service instance
   */
  addService<E extends AbstractEntity, P extends AbstractService>(
    entity: E,
    service: Type<P>,
  ): P {
    const p = this.findOrCreateService(service)

    if (hasOnAwake(p)) {
      p.onAwake()
    }

    entity.services.push(p)

    return p as P
  }

  /**
   * Adds an intent to the intents array.
   *
   * @param intent a callback to be called in the end of the loop.
   */
  addIntent(intent: () => void): void {
    this.intents.push(intent)
  }

  /**
   * Removes an intent from the intents array.
   *
   * @param intent the intent to be removed.
   */
  removeIntent(intent: () => void): void {
    this.intents = this.intents.filter((i) => i !== intent)
  }

  /**
   * Method that finds all the components of some type
   *
   * @param component defines the component type
   * @returns an array with all the found components
   */
  find<C extends AbstractComponent>(component: Type<C>): C[] {
    return this.components.filter(
      (c) => c.constructor.name === component.name,
    ) as C[]
  }

  /**
   * Method that detroyes some entity
   *
   * @param instance defines the instance that will be destroyed
   */
  destroy<T extends AbstractEntity | AbstractComponent | AbstractScene>(
    instance: T,
  ): void {
    instance.enabled = false

    if (hasOnDestroy(instance)) {
      instance.onDestroy()
    }

    if (isScene(instance)) {
      this.scenes = this.scenes.filter((scene) => scene !== instance)
      instance.entities.forEach((entity) => {
        this.destroy(entity)
      })
      return
    }

    if (isEntity(instance)) {
      instance.scene.entities.filter((entity) => entity !== instance)

      this.entities = this.entities.filter((entity) => entity !== instance)
      instance.components.forEach((component) => this.destroy(component))
      return
    }

    instance.entity.components = instance.entity.components.filter(
      (component) => component !== instance,
    )

    this.components = this.components.filter(
      (component) => component !== instance,
    )
  }

  /**
   * Method that stars the game rendering loop.
   */
  private startRenderLoop(): void {
    requestAnimationFrame(() => this.startRenderLoop())

    const cleanableContexts = this.scenes
      .map((s) => s.getContexts())
      .flat()
      .filter((c) => c.mode === 'clear')

    cleanableContexts.forEach((c) =>
      c.clearRect(0, 0, c.canvas.width, c.canvas.height),
    )
    ;[...this.entities, ...this.components].forEach((value) => {
      if (hasOnRender(value) && value.enabled) {
        value.onRender()
      }
    })
  }

  /**
   * Method that starts the game loop.
   */
  private startLoop(): void {
    requestAnimationFrame(() => this.startLoop())
    ;[...this.entities, ...this.components].forEach((value) => {
      if (hasOnFixedLoop(value) && value.enabled) {
        value.onFixedLoop()
      }
    })
    ;[...this.entities, ...this.components].forEach((value) => {
      if (hasOnLoop(value) && value.enabled) {
        value.onLoop()
      }
    })
    ;[...this.entities, ...this.components].forEach((value) => {
      if (hasOnLateLoop(value) && value.enabled) {
        value.onLateLoop()
      }
    })

    this.intents.forEach((intent) => intent())
  }

  /**
   * Method that, given an array of components or services or provider
   * objects with references to components or services converts their all
   * in providers, to make easier working with their properties and ids
   *
   * @param providers defines an array of types or providers
   * @returns an array with all the providers passed in providers
   */
  private toProviders<T = AbstractComponent | AbstractService>(
    providers: (Type<T> | IProvider<T>)[],
  ): IProvider<T>[] {
    return providers.map((p) => {
      if ('class' in p || 'id' in p) {
        return {
          ...p,
          id: p.id ?? v4(),
        }
      }
      return {
        id: v4(),
        class: p,
      }
    })
  }

  /**
   * Method tat, given a component or entity type, it returns it
   * rendering order value.
   *
   * @param target defines the entity or component type.
   * @returns the entity or component order.
   */
  private getOrderFromMetadata<T extends AbstractEntity | AbstractComponent>(
    target: Type<T>,
  ): number {
    return (
      Reflect.getMetadata(ENTITY_OPTIONS, target)?.order ??
      Reflect.getMetadata(COMPONENT_OPTIONS, target)?.order
    )
  }

  /**
   * Method that, given an entity, it takes from the metadata all it
   * components, passed in the "components" property
   *
   * @param entity defines the entity type
   * @returns an array with all the component types
   */
  private getComponentsFromMetadata<E extends AbstractEntity>(
    entity: Type<E>,
  ): Type<AbstractComponent>[] {
    return Reflect.getMetadata(ENTITY_OPTIONS, entity)?.components
  }

  /**
   * Method that, given an entity, or a component or a service it can take
   * from the metadata all it services, passed in the "providers" property
   *
   * @param target defines the entity or component or service type
   * @returns an array with all the service types
   */
  private getServicesFromMetadata<
    T extends AbstractEntity | AbstractService | AbstractComponent,
  >(target: Type<T>): Type<AbstractService>[] {
    return !target
      ? []
      : Reflect.getMetadata(ENTITY_OPTIONS, target)?.services ??
          Reflect.getMetadata(SERVICE_OPTIONS, target)?.services ??
          Reflect.getMetadata(COMPONENT_OPTIONS, target)?.services
  }

  /**
   * Method that creates a new service and resolve all it dependecies
   *
   * @param service defines the service type
   * @returns an object that represents the created service
   */
  private findOrCreateService(service: Type<AbstractService>): AbstractService {
    let instance = this.services.find(
      (p) => p.constructor.name === service.name,
    )
    if (!instance) {
      const services = this.getServicesFromMetadata(service).map((p) =>
        this.findOrCreateService(p),
      )
      instance = new service(v4(), this, services)
      this.services.push(instance)
    }
    return instance
  }

  /**
   * Method that, given an component, founds all it required components,
   * that must be passed as dependency for the parent entity in order to
   * make this component work as expected
   *
   * @param component defines the component type
   * @returns an array with all the required components
   */
  private getRequiredComponentsInMetadata(
    component: Type<AbstractComponent>,
  ): Type<AbstractComponent>[] {
    return Reflect.getMetadata(COMPONENT_OPTIONS, component)?.required
  }
}

/**
 * Class that represents the factory  responsible for instantiating all the
 * needed entities and their components and setting up the game
 */
export class AsteroidsFactory {
  /**
   * Method used to define all the game options
   *
   * @param options defines an object that contains the game options
   */
  static create(options?: GameFactoryOptions): AsteroidsApplication {
    return new AsteroidsApplication(options.bootstrap)
  }
}
