/*
 * server.js
 */
var URL  = require('url');
var longpoll = require('./longpoll');

var logger, longPollManager;


function sendJson(res, statusCode, entity){
  var json, code = statusCode;
  try {
    json = JSON.stringify(entity);
  } catch(err) {
    code = 500;
    json = '{"message":"Broken content"}';
  }

  res.writeHead(code, { 'Content-Length': Buffer.byteLength(json, 'utf8'),
                        'Content-Type': 'application/json;charset=UTF-8' });
  res.end(json);
}

function sendNoContent(res){
  res.writeHead(204);
  res.end();
}



function ServerCore(datamodel){
  this._datamodel = datamodel;
}
ServerCore.prototype.listener = function(req, res, next){
  var me = this;
  var request = URL.parse(req.url, true);

  var targets = request.pathname.substr(1).split(',');
  if (targets[0].length == 0) {
    sendJson(res, 404, { message: "Target not found" });
    return;
  }

  var syncInfo = { count: targets.length };

  if (req.method === 'GET') {
    me._dataOut(targets[0], res);

  } else if (req.method === 'POST') {
    var body = '';
    req.on('data', function(data){
      body += data;
    }).on('end', function(){
      try {
        var item = JSON.parse(body);
        var items = (item instanceof Array) ? item : new Array(item);

        targets.forEach(function(target){
            me._dataIn(target, items, res, syncInfo);
          });
      } catch(err) {
        sendJson(res, 400, { message: "Wrong JSON" });
      }
    });

  } else if (req.method === 'DELETE') {
    targets.forEach(function(target){
        me._dataClear(target, res, syncInfo);
      });

  } else {
    res.writeHead(405, { 'Content-Length': 0 });
    res.end(); 
  }
}
ServerCore.prototype._dataOut = function(target, res){
  this._datamodel.dataOut(target, function(err, item){
      try {
        if (err) {
          sendJson(res, 500, err);
        } else if (item) {
          sendJson(res, 200, item);
        } else {
          // Long poll start
          logger.debug("start long poll...");
          longPollManager.register(target, res);
        }
        return true;
      } catch (e) {
        logger.error(e);
        return false;
      }
    });
}
ServerCore.prototype._dataIn = function(target, items, res, syncInfo){
  var copiedItems = items.concat();
  var datamodel = this._datamodel;

  datamodel.dataIn(target, copiedItems, function(err, itemCount){
      syncInfo.count--;

      if (err) {
        if (syncInfo.count == 0)
           sendJson(res, 500, err);
        return;
      }

      if (syncInfo.count == 0) 
         sendJson(res, 200, { message: "success" });

      if (itemCount > 0) {
        logger.debug("long poll notify target:" + target);
        longPollManager.notify(datamodel, target, itemCount);
      }
    });
}
ServerCore.prototype._dataClear = function(target, res, syncInfo){
  this._datamodel.clear(target, function(err){
      syncInfo.count--;
      if (syncInfo.count > 0) return;

      if (err) {
        sendJson(res, 500, err);
      } else {
        sendNoContent(res);
      }
    });
}


function cServer(datamodel, mylogger){
  logger = mylogger;
  longPollManager = longpoll(logger, sendJson);

  var serverCore = new ServerCore(datamodel);
  function app(req, res, next){
    serverCore.listener(req, res, next);
  }
  return app;
}

exports = module.exports = cServer;

