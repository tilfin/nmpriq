
var request = require('supertest');
var mongodb = require("mongodb");
var datamodel = require("./datamodel_err_stub");
var server = require("../servercore");


var dummyLogger = {
        debug: function(){},
        info : function(){},
        warn : function(){},
        error: function(){}
    };

var app = server(datamodel, dummyLogger);


describe('Simple DB Error', function() {
  describe('POST /foo', function() {
    it('respond error with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({"key": "irohanihoheto", "priority": 30 })
        .expect(500, done);
    })
  });

  describe('GET /foo', function() {
    it('respond error with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500, done);
    })
  });
});


describe('POST to 2 collection foo,bar on the same time', function() {
  describe('POST /foo,bar', function() {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", priority: 40 })
        .expect(500, done);
    })
  });
});


describe('Delete test', function(){
  describe('DELETE /foo', function(){
    it('respond error', function(done){
      request(app)
        .del('/foo')
        .expect(500, done);
    })
  });
});


describe('Delete 2 targets', function(){
  describe('DELETE /foo,bar', function(){
    it('respond no content', function(done){
      request(app)
        .del('/foo,bar')
        .expect(500, done);
    })
  });
});

