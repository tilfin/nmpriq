const { sendJson } = require('./util')

class LongPollManager {
  constructor(logger) {
    this._logger = logger;
    this._set = {}
  }

  register(target, res) {
    this._logger.info("start long polling...")

    if (target in this._set) {
      this._set[target].push(res)
    } else {
      this._set[target] = new Array(res)
    }

    const mySet = this._set[target]

    const me = this
    res.on("close", function () {
      me._logger.info("long polling closed by client.")

      for (let i = 0; i < mySet.length; i++) {
        if (mySet[i] == this) {
          mySet.splice(i, 1)
          me._logger.debug("removed at:" + i + " from set.")
          break
        }
      }
    })
  }

  notify(datamodel, target, count) {
    if (!(target in this._set)) return;

    const res = this._set[target].shift()
    if (!res) return

    this._logger.debug("long poll respond")
    this.respond(datamodel, target, res, count)
  }

  respond(datamodel, target, res, restCount) {
    datamodel.dataOut(target, (err, item) => {
      let result = true;
      try {
        if (err) {
          sendJson(res, 500, err)
        } else if (item) {
          sendJson(res, 200, item)
        } else {
          res.writeHead(204)
          res.end()
        }
      } catch (e) {
        console.error(e)
        result = false
      }

      if (restCount > 1) {
        setTimeout(() => {
          this.notify(datamodel, target, restCount - 1)
        }, 0)
      }

      return result
    })
  }

  reset() {
    const copiedSet = {}
    for (const target in this._set) {
      copiedSet[target] = this._set[target].concat();
    }

    for (const target in copiedSet) {
      copiedSet[target].forEach(res => {
        res.writeHead(500)
        res.end()
      })
    }
  }
}

module.exports = LongPollManager
