/*
 * nmpriq.js
 */

const Datamodel = require("./queue")
const servercore = require("./servercore")


function defaultLogger() {
  return {
    debug: (str) => { console.log("[DEBUG] " + str) },
    info : (str) => { console.log("[INFO]  " + str) },
    warn : (str) => { console.log("[WARN]  " + str) },
    error: (str) => { console.log("[ERROR] " + str) },
  }
} 

class HttpServer {
  constructor(port, dbUri) {
    this._port = port
    this._dbUri = dbUri
    this._logger = defaultLogger()
  }

  get logger() {
    return this._logger
  }

  set logger(logger) {
    this._logger = logger
  }

  async start(param) {
    this._datamodel = new Datamodel()
    await this._datamodel.initialize(this._dbUri, param || null, logger)

    this._svcore = servercore(datamodel, this._logger)
    this._svcore.createServer().listen(this._port)
    
    this._logger.info("start server listening on port " + this._port)
  }

  async stop() {
    this._logger.info("stopping server")
    await this._datamodel.terminate()
    this._datamodel = null

    this._svcore.close()
    this._svcore = null
  }

  async restart() {
    this.logger.info('server restarting...')
    await this.stop()
    await this.start()
  }
}


let server

function exit() {
  server.stop().then(() => {
    server.logger.info('server terminated.')
    setTimeout(() => {
      process.exit(1)
    }, 400)
  })
}

process.on('SIGINT', () => {
  server.logger.info('Received Signal INT')
  exit()
})

process.on('SIGTERM', () => {
  server.logger.info('Received Signal TERM')
  exit()
})

process.on('SIGHUP', () => {
  server.logger.info('Received Signal HUP')
  server.restart().then(() => {
    logger.info('server restarted.')
  })
})


module.exports = (port, dbUri) => {
  server = new HttpServer(port, dbUri)
  return server
}
