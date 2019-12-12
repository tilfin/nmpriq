const http = require('http')
const URL  = require('url')
const LongPollManager = require('./longpoll')
const { sendJson } = require('./util')

let logger

class ServerCore {
  constructor(datamodel, longPollManager) {
    this._datamodel = datamodel
    this._longPollManager = longPollManager
  }

  createServer() {
    this._server = http.createServer((req, res, next) => { this.listener(req, res, next) })
    return this._server
  }

  async close() {
    logger.info("closing servercore...")
    this._longPollManager.reset()

    return new Promise(resolve => {
      this._server.close(resolve) 
    })    
  }

  listener(req, res, next) {
    const request = URL.parse(req.url, true)

    const targets = request.pathname.substr(1).split(',')
    if (targets[0].length == 0) {
      sendJson(res, 404, { message: "Target not found" })
      return
    }

    const syncInfo = { count: targets.length }

    if (req.method === 'GET') {
      this._dataOut(targets[0], res)
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', data => {
        body += data;
      }).on('end', () => {
        try {
          let item = JSON.parse(body)
          let items = (item instanceof Array) ? item : new Array(item);

          targets.forEach(target => {
            this._dataIn(target, items, res, syncInfo)
          })
        } catch(err) {
          sendJson(res, 400, { message: "Wrong JSON" })
        }
      })
    } else if (req.method === 'DELETE') {
      targets.forEach(target => {
        this._dataClear(target, res, syncInfo)
      })
    } else {
      res.writeHead(405, { 'Content-Length': 0 })
      res.end() 
    }
  }

  _dataOut(target, res) {
    this._datamodel.dataOut(target, (err, item) => {
      try {
        if (err) {
          sendJson(res, 500, err)
        } else if (item) {
          sendJson(res, 200, item)
        } else {
          this._longPollManager.register(target, res)
        }
        return true
      } catch (err) {
        logger.error(err)
        return false
      }
    })
  }

  _dataIn(target, items, res, syncInfo) {
    const copiedItems = items.concat()
    this._datamodel.dataIn(target, copiedItems, (err, itemCount) => {
      syncInfo.count--;

      if (err) {
        if (syncInfo.count == 0) sendJson(res, 500, err)
        return
      }

      if (syncInfo.count == 0) sendJson(res, 200, { message: "success" })

      if (itemCount > 0) {
        logger.debug("long poll notify target:" + target)
        this._longPollManager.notify(this._datamodel, target, itemCount)
      }
    })
  }

  _dataClear(target, res, syncInfo) {
    this._datamodel.clear(target)
    .then(() => null).catch(err => err)
    .then(err => {
      if (--syncInfo.count > 0) return

      if (err) {
        sendJson(res, 500, err)
      } else {
        this._sendNoContent(res)
      }
    })
  }

  _sendNoContent(res) {
    res.writeHead(204)
    res.end()
  }
}


function cServer(datamodel, mylogger) {
  logger = mylogger
  return new ServerCore(datamodel, new LongPollManager(logger, sendJson))
}

exports = module.exports = cServer
