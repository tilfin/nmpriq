/*
 * datamodel mock for DB Error
 */

exports.initialize = function(dbUri, param, mylogger, callback){
};


exports.terminate = function(){
};


exports.dataIn = function(target, items, callback){
  callback(new Error("DBError"));
};


exports.dataOut = function(target, callback){
  callback(new Error("DBError"), null);
};


exports.clear = function(target, callback){
  callback(new Error("DBError"));
};

