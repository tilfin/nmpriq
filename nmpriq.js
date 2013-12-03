/*
 * nmpriq.js
 */
var http = require('http');
var logger; //= require("logger");

var datamodel = require("./queue");
var servercore = require("./servercore");


function HttpServer(port, dbUri){
  this._port = port;
  this._dbUri = dbUri;
}
HttpServer.prototype.start = function(){
  datamodel.initialize(this._dbUri, null, logger);

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


if (!logger) {
  logger = {
      debug: function(str){ console.log("[DEBUG] " + str) },
      info : function(str){ console.log("[INFO]  " + str) },
      warn : function(str){ console.log("[WARN]  " + str) },
      error: function(str){ console.log("[ERROR] " + str) },
    };
}


try {
  if (process.argv.length == 3) {
    var dbUri = process.argv[2];
    httpServer = new HttpServer(process.env.port || 2045, dbUri);
    httpServer.start();
  }
} catch (e) {
  console.log("Usage node nmpriq.js <MongoDB URI>");
  process.exit(1);
}

