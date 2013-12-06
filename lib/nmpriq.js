/*
 * nmpriq.js
 */

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


var httpServer;

function HttpServer(port, dbUri){
  this._port = port;
  this._dbUri = dbUri;
}
HttpServer.prototype.setLogger = function(logger_){
  logger = logger_;
}
HttpServer.prototype.start = function(param){
  setDefaultLogger();
  
  datamodel.initialize(this._dbUri, param || null, logger);

  this._svcore = servercore(datamodel, logger);
  this._svcore.createServer().listen(this._port);

  logger.info("start server listening on port " + this._port);
}
HttpServer.prototype.stop = function(cb){
  logger.info("stopping server");

  datamodel.terminate();

  this._svcore.close(cb);
  this._svcore = null;
}
HttpServer.prototype.restart = function(cb){
  var me = this;
  this.stop(function(){
    me.start();
    if (cb) cb();
  });
}



function exit(){
  httpServer.stop(function(){
    logger.info('server terminated.');
    setTimeout(function(){
      process.exit(1);
    }, 400);
  });
}

process.on('SIGINT', function(){
  logger.info('Received Signal INT');
  exit();
});

process.on('SIGTERM', function(){
  logger.info('Received Signal TERM');
  exit();
});

process.on('SIGHUP', function(){
  logger.info('Received Signal HUP');
  logger.info('server restarting...');
  httpServer.restart(function(){
    logger.info('server restarted.');
  });
});


module.exports = function(port, dbUri){
  httpServer = new HttpServer(port, dbUri);
  return httpServer;
}
