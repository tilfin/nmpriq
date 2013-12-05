/*
 * nmpriq.js
 */

var http = require('http');

var datamodel = require("./queue");
var servercore = require("./servercore");

var logger;

function setDefaultLogger(){
  if (!logger) {
    logger = {
        debug: function(str){ console.log("[DEBUG] " + str) },
        info : function(str){ console.log("[INFO]  " + str) },
        warn : function(str){ console.log("[WARN]  " + str) },
        error: function(str){ console.log("[ERROR] " + str) },
      };
  }
} 


function HttpServer(port, dbUri, logger_){
  this._port = port;
  this._dbUri = dbUri;
}
HttpServer.prototype.setLogger = function(logger){
  logger = logger_;
}
HttpServer.prototype.start = function(param){
  setDefaultLogger();
  
  datamodel.initialize(this._dbUri, param || null, logger);

  this._app = servercore(datamodel, logger);
  this._instance = http.createServer(this._app);
  this._instance.listen(this._port);

  logger.info("start server listening on port " + this._port);
}
HttpServer.prototype.stop = function(cb){
  logger.info("stopping server");

  this._instance.close(cb);
  this._instance = null;

  datamodel.terminate();
}
HttpServer.prototype.restart = function(cb){
  var me = this;
  this.stop(function(){
    me.start();
    if (cb) cb();
  });
}


var httpServer;

function exit(){
  logger.info('exiting...');
  httpServer.stop(function(){
    logger.info('exited.');
  });
}

process.on('SIGINT', function(){
  logger.info('Got INT');
  exit();
});

process.on('SIGTERM', function(){
  logger.info('Got TERM');
  exit();
});

process.on('SIGHUP', function(){
  logger.info('Got HUP. restarting...');
  httpServer.restart(function(){
    logger.info('restarted.');
  });
});


function run(){
  try {
    if (process.argv.length == 3) {
      var dbUri = process.argv[2];
      httpServer = new HttpServer(process.env.PORT || 2045, dbUri);
      httpServer.start();
      return;
    }
  } catch (e) {}
  console.log("Usage node nmpriq.js <MongoDB URI>");
  process.exit(1);
}

if (module.parent) {
  module.exports = HttpServer;
} else {
  run();
}

