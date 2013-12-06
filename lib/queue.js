/*
 * queue.js
 */
var util = require('util');
var MongoClient = require('mongodb').MongoClient;

var logger, client;


function MongoInserter(collection){
  this._coll = collection;
}
MongoInserter.prototype.start = function(items, callback){
  this._items = items;
  this._callback = callback;
  this._insertNext();
  this._insertedCount = 0; 
}
MongoInserter.prototype._insertNext = function(){
  var item = this._items.shift();
  if (item == undefined) {
    this._callback(null, this._insertedCount);
    return;
  }

  if (!("key" in item)) {
    logger.warn("Ignored item without 'key'.");
    this._insertNext();
    return;
  }

  if (!("priority" in item)) {
    item.priority = 10;
  }

  logger.debug("db." + this._coll.collectionName + ".upsert: " + util.inspect(item));

  var me = this;

  var updateSet = { 
      $inc : { priority: item.priority }
    };

  if ("value" in item) {
    updateSet["$set"] = { value: item.value };
  }

  me._coll.update({ "key" : item.key }, updateSet,
      { safe: true, upsert:true },
      function(err) {
        if (err) {
          me._callback(err, me._insertedCount);
          return;
        }

        me._insertedCount++;
        me._insertNext();
      });
}


exports.initialize = function(dbUri, param, mylogger, callback){
  logger = mylogger;
  callback = callback || (function(){});

  var params = param || {};
  if (!("auto_reconnect" in params))
     params["auto_reconnect"] = true;

  suffix = params.suffix || "";
  delete params.suffix;

  MongoClient.connect(dbUri, params, function(err, db){
      if (err) {
        callback(err);
        return;
      }
      client = db;
      
      callback(null);
    });
};


exports.terminate = function(){
  if (client) {
    client.close();
  }
}


exports.dataIn = function(target, items, callback){
  client.collection(target + suffix, function(err, coll) {
      if (err) {
        callback(err);
        return;
      }

      new MongoInserter(coll).start(items, callback);
    });
};


exports.dataOut = function(target, callback){
  var cb = function(err, result){
      result = result || null;
      return callback(err, result);
  };

  client.collection(target + suffix, function(err, coll) {
      if (err) {
        cb(err);
        return;
      }

      var sort = [ ["priority", -1], ["_id", 1] ];

      coll.find({}, {'limit': 1, 'sort': sort },
        function(err, cursor){
          if (err) {
            cb(err);
            return;
          }

          cursor.toArray(function(err, docs){
              if (!docs || docs.length == 0) {
                cb(null, null);
                return;
              }

              var doc = docs[0];
              var docId = doc._id;
              logger.debug("Data-out: " + util.inspect(doc));

              delete doc["_id"];

              if ( cb(null, doc) ) {
                coll.remove({ "_id": docId }, function(err, result){
                  logger.debug("Removed document _id:" + docId);
                });
              } else {
                logger.error("Client not received document _id:" + docId);
              }
            });
        });
    });
};


exports.clear = function(target, callback){
  client.collection(target + suffix, function(err, coll) {
      if (err) {
        callback(err);
        return;
      }

      coll.remove({}, function(err, result){
          callback(err);
        });
    });
};


