/*
 * longpoll.js
 */

function LongPollManager(logger, sendJson){
  this.logger = logger;
  this._set = {};
  this.sendJson = sendJson;
}

LongPollManager.prototype.register = function(target, res){
  var me = this;
  me.logger.info("start long polling...");

  if (target in this._set) {
    this._set[target].push(res);
  } else {
    this._set[target] = new Array(res);
  }

  var mySet = this._set[target];

  res.on("close", function(){
      me.logger.info("long polling closed by client.");

      for (var i = 0; i < mySet.length; i++) {
        if (mySet[i] == this) {
          mySet.splice(i, 1);
          me.logger.debug("removed at:" + i + " from set.");
          break;
        }
      }
    });
}

LongPollManager.prototype.notify = function(datamodel, target, count){
  if (!(target in this._set)) return;

  var res = this._set[target].shift();
  if (!res) return;

  this.logger.debug("long poll respond");
  this.respond(datamodel, target, res, count);
}

LongPollManager.prototype.respond = function(datamodel, target, res, restCount){
  var me = this;
  datamodel.dataOut(target, function(err, item){
      var result = true;
      try {
        if (err) {
          me.sendJson(res, 500, err);
        } else if (item) {
          me.sendJson(res, 200, item);
        } else {
          res.writeHead(204);
          res.end();
        }
      } catch (e) {
        result = false;
      }
      
      if (restCount > 1) {
        setTimeout(function(){
          me.notify(datamodel, target, restCount-1);
        }, 0);
      }

      return result;
    });
}

LongPollManager.prototype.reset = function(){
  var target, copiedSet = {};
  for (target in this._set) {
    copiedSet[target] = this._set[target].concat();
  }

  for (target in copiedSet){
    copiedSet[target].forEach(function(res){
      res.writeHead(500);
      res.end();
    });
  }
}

function CreateLongPollManager(logger, sendJson){
  return new LongPollManager(logger, sendJson);
}
exports = module.exports = CreateLongPollManager;

