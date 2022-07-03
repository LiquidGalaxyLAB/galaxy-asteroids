const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const { createServer } = require('http')
const { Server } = require('socket.io')

dotenv.config()

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
