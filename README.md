# Galaxy Asteroids

### Summary

- [About](#about)
- [Requirements](#requirements)
- [Installing the game](#installing-the-game)
- [Playing](#playing)
- [LG Retro Gaming](#lg-retro-gaming)
- [Project structure](#project-structure)
  - [Libs](#libs)
  - [index.js](#indexjs)
  - [src/index.ts](#srcindexts)
  - [src/index.html](#srcindexhtml)
  - [src/global.scss](#srcglobalscss)
  - [src/assets/](#srcassets)
    - [ts/game-objects/](#tsgame-objects)
    - [ts/shared/](#tsshared)
    - [ts/ui/](#tsui)
    - [Life cycle](#life-cycle)
    - [Service](#service)
    - [Component](#component)
    - [Entity](#entity)
    - [Scene](#scene)
  - [License](#license)

## About

<p align="justify">
Galaxy Asteroids consists of a singleplayer/multiplayer and multi-screen game that looks like the old Asteroids with the Diep.io mechanics. Players will control their spaceships in a limited battlefield (the space), visible into the Liquid Galaxy system (screens), with their virtual joystick (mobile app), fighting each other in a thirsty competition in order to achieve the highest score, being what most players like.
</p>

## Requirements

Before installing the game, it's necessary to have some other tools installed as well.

First, make sure _Node.js_ version **14+** is installed on the master machine by running:

```bash
$ node -v
```

This command should print something like `v16.17.0`. In case it doesn't, install _Node.js_ by following the 3 first steps at the link: [How To Install Latest Node.js on Ubuntu 16.04](https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/).

With _Node.js_ installed, the next tool that must be installed is _pm2_. Run the command below to install it:

```bash
$ sudo npm i -g pm2
```

Finally, make sure to have Chromium Browser installed on all machines.

> _**Chromium Browser** is usually installed into the Liquid Galaxy systems._

## Installing the game

There's a few steps to be able to run and play the game.

First, open a new terminal and make sure you're into the **HOME** directory by running the `cd` command.

Then, clone the **Galaxy Asteroids** repository by running:

```bash
$ git clone https://github.com/LiquidGalaxyLAB/galaxy-asteroids.git
```

Having the game in the local machine is not enough. Install it by running:

```bash
$ cd galaxy-asteroids
$ bash install.sh {password}
```

> _The {password} is the password from you system_.

That's it for the installation! The game is running on the _pm2_ using the **8129** port.

> _The **8129** port can't be accessed until you reboot the machine._

All of the installation logs is kept into the `./logs` directory. Make sure to check it out if you experience any problems throughout the installation.

## Playing

To be able to play the game, you must execute the `open.sh` script.

To do so, navigate to the game directory by running:

```bash
$ cd ~/galaxy-asteroids
```

Then run the `open.sh` script:

```bash
$ bash ./scripts/open.sh
```

To close the game, execute the `close.sh` script:

```bash
$ bash ./scripts/close.sh
```

With the game running, open the `http://<master-ip>:<game-port>/` with a mobile device to access the joystick controller.

## LG Retro Gaming

To have a better experience, use the [LG Retro Gaming](https://github.com/LiquidGalaxyLAB/lg-retro-gaming) application to install and play the game. You must install it by following its documentation and download the app from the [Google Play Store](https://play.google.com/store/apps/details?id=com.leoruas.lg_retro_gaming) to be able to access the joystick controller.

## Project structure

The project is divided into `libs`, `src` and `index.js`:

<details>
  <summary>libs/</summary>

- asteroids/
  - src/
    - decorators/
    - interfaces/
    - math/
    - utils/
    - abstract-component.ts
    - abstract-entity.ts
    - abstract-scene.ts
    - abstract-service.ts
    - asteroids.factory.ts
    - constants.ts
  - index.ts
  - tsconfig.lib.json

</details>

<details>
  <summary>src/</summary>

- @types/
- assets/
  - fonts/
  - html/
  - scss/
  - svg/
  - ts/
    - game-objects/
      - some-game-object/
        - components/
        - entities/
        - enums/
        - interfaces/
    - scenes/
      - some-scene.scene.ts
    - shared/
      - components/
      - entities/
      - enums/
      - interfaces/
      - services/
    - ui/
      - some-ui-element/
        - entities/
        - enums/
        - interfaces/
    - utils/
- global.scss
- index.html
- index.ts
</details>

index.js

### libs/

Contains the `asteroids` library, which keeps all of the project main functionalities, such as `entities`, `components`, `scenes` and `services` logic and instantiating. It may be referenced as `@asteroids` when importing classes, interfaces and other files.

```ts
import { AbstractEntity, Entity, IOnAwake } from '@asteroids'
```

### index.js

Being the starting point of the application, deals with its initializing using express. Also contains all of the socket server logic.

### src/index.ts

Deals with the game initialization using the `bootstrap` function, which is responsible for getting the given `scene` and using it to create the game instance.

### src/index.html

Is the entry point for keeping all of the game `canvas` elements.

### src/global.scss

Contains global styles and imports from other `scss` files.

### src/assets/

Keeps almost all of the game elements and logic.

- fonts: contains all game fonts.
- html: contains all of the UI html elements. I.e.: score.
- scss: keeps the UI elements styling.
- svg: keeps all game svg images. I.e.: spaceship.
- ts: contains all of the game logic.

### ts/game-objects/

Keeps all the main game objects and their own components, entities, interfaces and more.

Example: `game-objects/`

- spaceship/
  - components/
    - input.component.ts
  - entities/
    - spaceship-slave.entity.ts
    - spaceship.entity.ts
  - interfaces/
    - input.interface.ts

### ts/shared/

Keeps all shared/common components, enums, interfaces, services and more.

Example: `shared/`

- components/
  - drawer.component.ts
- enums/
  - player.enum.ts
- interfaces/
  - player.interface.ts
- services/
  - socket.service.ts

### ts/ui/

Keeps all UI related entities.

Example: `ui/`

- background/
  - entities/
    - space-background.entity.ts
    - background.entity.ts
- score/
  - entities/
    - score.entity.ts

#### Life cycle

Life cycle methods are used to run code on different times on each loop.

- onAwake: called when the dependencies of some component, entity or service are resolved.
- onStart: called after the `onAwake` method at the beginning of the loop.
- onDestroy: called when the entity is destroyed.
- onLoop: called on every game cycle.
- onLateLoop: called after the `onLoop` method.
- onFixedLoop: called on every game _physics_ cycle.

#### Service

Services keeps a set of methods and properties that won't change while the application is running unstoppably. They extends the `AbstractService` and use the `@Service` decorator.

```ts
@Service()
export class MyService extends AbstractService {}
```

It may use other services using the `services` property into the `@Service` decorator and initialized it into the `onAwake` life cycle method.

```ts
import { AbstractService, IOnAwake, Service } from '@asteroids'

import { SocketService } from '@/assets/ts/shared/services/socket.service'

@Service({
  services: [SocketService],
})
export class MyService extends AbstractService implements IOnAwake {
  private socketService: SocketService

  onAwake() {
    this.socketService = this.getService(SocketService)
  }
}
```

#### Component

Represents a group of behavior and properties that may be applied to one or more [entities](#entity). It must extend the `AbstractComponent` class and use the `@Component` decorator.

```ts
@Component()
export class MyComponent extends AbstractComponent {}
```

A component may use another by passing the `required` property. It may also use services by passing the `services` properties. The required components and services must be initialized into the `onAwake` life cycle method.

```ts
import { AbstractComponent, Component, IOnAwake } from '@asteroids'

import { Drawer } from '@/assets/ts/shared/components/drawer.component'
import { MyService } from '@/assets/ts/shared/services/my-service.service'

import { MyComponent } from '@/assets/ts/.../components/my-component.component'

@Component({
  required: [Drawer, MyComponent],
  services: [MyService],
})
export class MyComponent extends AbstractComponent implements IOnAwake {
  private drawer: Drawer

  private myComponent: MyComponent

  private myService: MyService

  onAwake() {
    this.drawer = this.getComponent(Drawer)
    this.myComponent = this.getComponent(MyComponent)

    this.myService = this.getService(MyService)
  }
}
```

#### Entity

Represents a renderable unique object/entity, such as a `spaceship`, `asteroid`, `background`, `bullet` and others.

To create an entity, the `@Entity` decorator and `AbstractEntity` class must be used.

```ts
@Entity()
export class MyEntity extends AbstractEntity {}
```

Entities use [components](#components) to acquire generic behaviors: `transform`, `physics`, `rendering`, etc. This components may be inserted into the entity decorator: `@Entity`.

Also, entities may also have services passed into the decorator to be used by using the `services` property. To initialize them, use the `onAwake` life cycle method.

```ts
import { AbstractEntity, Entity, IOnAwake } from '@asteroids'

import { Drawer } from '@/assets/ts/shared/components/drawer.component'
import { Render } from '@/assets/ts/shared/components/renderers/render.component'
import { Rigidbody } from '@/assets/ts/shared/components/rigidbody.component'
import { Transform } from '@/assets/ts/shared/components/transform.component'
import { MyService } from '@/assets/ts/shared/services/my-service.component'

import { MyComponent } from '@/assets/ts/.../components/my-component.component'

@Entity({
  components: [
    Drawer,
    Render,
    Transform,
    {
      id: '__my_entity_rigidbody__',
      class: Rigidbody,
    },
    {
      class: MyComponent,
      use: {
        property: 'value',
      },
    },
  ],
  services: [MyService],
})
export class MyEntity extends AbstractEntity implements IOnAwake {
  private drawer: Drawer

  private render: Render

  private transform: Transform

  private rigidbody: Rigidbody

  private myService: MyService

  onAwake() {
    this.drawer = this.getComponent(Drawer)
    this.render = this.getComponent(Render)
    this.transform = this.getComponent(Transform)
    this.rigidbody = this.getComponent(Rigidbody)
    // The MyComponent component is not going to be used directly in
    // the entity, we just need its behavior.

    this.myService = this.getService(MyService)
  }
}
```

#### Scene

Scenes are used to create a base canvas and instantiate a set of entities. They must extends the `AbstractService` class and use the `@Scene` decorator.

```ts
import { AbstractScene, Scene } from '@asteroids'

import { MyEntity } from '@/assets/ts/.../entities/my-entity.entity'

@Scene()
export class MyScene extends AbstractScene {
  this.createCanvas({
    name: 'my-scene',
    mode: 'clear',
  })

  this.instantiate({ entity: MyEntity })
}
```

## License

The Galaxy Asteroids project is licensed under the [MIT license](https://opensource.org/licenses/MIT).
