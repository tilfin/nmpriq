
var assert = require('assert');
var mongodb = require("mongodb");
var datamodel = require("../queue");


var dummyLogger = {
        debug: function(){},
        info : function(){},
        warn : function(){},
        error: function(){}
    };


describe('dataModel#initialize', function() {
  afterEach(function(done){
    datamodel.terminate();
    done();
  });

  describe('not specify db name', function() {
    it('should return error', function(done){
      var dbUri = "mongodb://user:pass@localhost/";
      datamodel.initialize(dbUri, null, dummyLogger, function(err){
        assert.ok(!!err);
        done();
      });
    })
  });

  describe('specify wrong user and pass', function() {
    it('should return err', function(done){
      var dbUri = "mongodb://user:pass@localhost/testdb";
      datamodel.initialize(dbUri, null, dummyLogger, function(err){
        assert.ok(!!err);
        done();
      });
    })
  });
});

