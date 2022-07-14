const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const { createServer } = require('http')
const { Server } = require('socket.io')

dotenv.config()

/**
 * @typedef {Object} Screen
 * @property {string} id The screen id.
 * @property {number} number The screen number.
 * @property {number} position The screen position in the screens object.
 */

/**
 * @typedef {Object} SocketData
 * @property {string} id The entity id;
 * @property {string} type The entity type;
 * @property {any} data The entity data;
 */

/**
 * The arguments passed by the command line.
 *
 * @type {string[]}
 */
const args = process.argv.slice(2)

/**
 * Represents the connected screens.
 *
 * @type {Object.<string, Screen>}
 */
let screens = {}

/**
 * The amount of screens that will be connected together. Default is 3.
 *
 * @type {number}
 */
let screenAmount =
  args.find((arg) => arg.includes('nscreens'))?.split('=')[1] ||
  process.env.SCREEN_AMOUNT ||
  5

/**
 * The screen socket for screen connections.
 *
 * @type {Server<import('socket.io-client/build/typed-events').DefaultEventsMap, import('socket.io-client/build/typed-events').DefaultEventsMap, import('socket.io-client/build/typed-events').DefaultEventsMap>}
 */
let ioScreen = null

/**
 * Function that starts the application, serving the main "index.html" and
 * making public the "dist" folder.
 */
function setupServer() {
  const app = express()
  const httpServer = createServer(app)
  ioScreen = new Server().listen(httpServer)

  const router = express.Router()

  router.use('/', express.static(path.resolve(__dirname, 'dist')))

  router.use('/:screenNumber', express.static(path.resolve(__dirname, 'dist')))

  router.get('/', (_, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept',
    )

    res.sendFile(path.resolve(__dirname, 'dist/index.html'))
  })

  app.use('/', router)

  httpServer.listen(process.env.PORT || 8080)

  console.log('Listening on port ' + process.env.PORT || 8080)
}
setupServer()

/**
 * Method that setups the screen socket server for multiple screen connection.
 */
function setupSocketScreen() {
  ioScreen.on('connection', (socket) => {
    console.log('Connected: ' + socket.id)

    /**
     * Gets the screen amount set into the arguments.
     *
     * @param {(screenAmount: number) => void} callback A function that emits to
     * the client the screen amount.
     */
    function getScreenAmount(_, callback) {
      callback(screenAmount)
    }
    socket.on('screen-amount', getScreenAmount)

    /**
     * Connects a screen to the socket server.
     *
     * @param {number} number The screen number.
     * @param {(screen: Screen) => void} callback A function that emits to the
     * client the screen data.
     */
    function connectScreen(number, callback) {
      const screen = setScreen(socket.id, number)
      if (!screen) {
        return callback(null)
      }

      socket.join(screen.number === 1 ? 'master' : 'slave')
      callback(screen)
    }
    socket.on('connect-screen', connectScreen)

    /**
     * Updates the entity data in the slaves screens.
     *
     * @param {SocketData} data The master entity vector.
     */
    function updateSlaves(data) {
      ioScreen.to('slave').emit('update-screen', data)
    }
    socket.on('update-slaves', updateSlaves)

    /**
     * Emits to all slaves screens that the scene has changed.
     *
     * @param {string} scene The scene name.
     */
    function changeScene(scene) {
      ioScreen.emit('change-scene', scene)
    }
    socket.on('change-scene', changeScene)

    /**
     * Creates a new entity.
     *
     * @param {SocketData} data The data used to create the new entity.
     */
    function onInstantiate(data) {
      ioScreen.to('slave').emit('instantiate', data)
    }
    socket.on('instantiate', onInstantiate)

    /**
     * Destroys an entity.
     *
     * @param {string} id The entity id to be destroyed.
     */
    function onDestroy(id) {
      ioScreen.to('slave').emit('destroy', id)
    }
    socket.on('destroy', onDestroy)

    /**
     * Updates the entity data in the slaves screens.
     *
     * @param {SocketData} data The master entity data.
     */
    function updateSlaves(data) {
      ioScreen.to('slave').emit('update-screen', data)
    }
    socket.on('update-slaves', updateSlaves)

    /**
     * Called when a screen is disconnected.
     *
     * @param {string} reason The reason for the disconnection.
     */
    function disconnect(reason) {
      console.log(`(${socket.id}) disconnected: ${reason}`)
    }
    socket.on('disconnect', disconnect)
  })
}
setupSocketScreen()

/**
 * Sets the new screen to the screens object.
 *
 * @param {string} id The screen socket id.
 * @param {number} screenN The screen number.
 * @returns The connected screen data.
 */
function setScreen(id, screenN) {
  /**
   * @type {Screen}
   */
  const screen = {
    id,
    number: screenN,
    position: 0,
  }

  screens[screenN.toString()] = screen
  return screen
}
