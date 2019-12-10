const util = require('util')
const MongoClient = require('mongodb').MongoClient

class MongoInserter {
  constructor(collection, logger) {
    this._coll = collection
    this._logger = logger
  }

  start(items, callback) {
    this._items = items
    this._callback = callback
    this._insertNext()
    this._insertedCount = 0
  }

  async _insertNext() {
    const item = this._items.shift()
    if (item == undefined) {
      this._callback(null, this._insertedCount)
      return
    }

    if (!("key" in item)) {
      this._logger.warn("Ignored item without 'key'.")
      this._insertNext()
      return
    }

    if (!("priority" in item)) {
      item.priority = 10
    }

    this._logger.debug("db." + this._coll.collectionName + ".upsert: " + util.inspect(item))

    const updateSet = { 
      $inc : { priority: item.priority }
    }

    if ("value" in item) {
      updateSet["$set"] = { value: item.value }
    }

    try {
      await this._coll.updateOne({ key: item.key }, updateSet, { safe: true, upsert:true })
      this._insertedCount++
      this._insertNext()
    } catch(err) {
      this._callback(err, this._insertedCount)
    }
  }
}

class Queue {
  constructor(logger) {
    this._logger = logger
  }

  async initialize(dbUri, params = {}) {
    if (!("auto_reconnect" in params)) {
      params["auto_reconnect"] = true
    }

    const { suffix: suffix_, ...otherParams } = params
    this._suffix = suffix_ || ''

    const lastSlashPost = dbUri.lastIndexOf('/')
    const dbEndpoint = dbUri.substr(0, lastSlashPost)
    const dbName = dbUri.substr(lastSlashPost + 1)

    this._client = await MongoClient.connect(dbEndpoint, otherParams)
    this._db = this._client.db(dbName)
  }

  async terminate() {
    if (this._client) {
      this._client.close()
      this._client = null
    }
  }

  dataIn(target, items, callback) {
    const coll = this._db.collection(target + this._suffix)
    new MongoInserter(coll, this._logger).start(items, callback)
  }

  async dataOut(target, cb) {
    const coll = this._db.collection(target + this._suffix)
    const sort = [ ["priority", -1], ["_id", 1] ];
    const cursor = await coll.find({}, { limit: 1, sort })
    const docs = await cursor.toArray()

    if (!docs || docs.length == 0) {
      return cb(null, null)
    }

    const doc = docs[0]
    const docId = doc._id
    this._logger.debug("Data-out: " + util.inspect(doc));

    delete doc._id

    if ( cb(null, doc) ) {
      const result = await coll.deleteOne({ _id: docId })
      this._logger.debug("Removed document _id:" + docId)
    } else {
      this._logger.error("Client not received document _id:" + docId)
    }
  }

  async clear(target) {
    const coll = this._db.collection(target + this._suffix)
    await coll.deleteMany({})
  }
}

module.exports = Queue
