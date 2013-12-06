
var assert = require('assert');
var http = require('http');
var request = require('supertest');
var mongodb = require("mongodb");
var datamodel = require("../lib/queue");
var servercore = require("../lib/servercore");


var dummyLogger = {
        debug: function(){},
        info : function(){},
        warn : function(){},
        error: function(){}
    };

var app = servercore(datamodel, dummyLogger).createServer();


before(function(done) {
  datamodel.initialize("mongodb://localhost/testdb",
                       { suffix: "TestQueue" }, dummyLogger);

  setTimeout(function(){
    done();
  }, 1000);
})

after(function(done) {
  datamodel.terminate();

  setTimeout(function(){
    done();
  }, 1000);
})


describe('Long poll test', function(){
  beforeEach(function(done){
    datamodel.clear('foo', function(){
      datamodel.clear('bar', done);
    });
  });

  describe('GET /foo and POST /foo', function(done){
    it('respond 200 with json to both requests', function(done){
      var doneCnt = 0;
      function allDone(){
        if (++doneCnt == 2) done();
      }

      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "longpoll", priority: 20 }, allDone);
  
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "longpoll", priority: 20 })
        .expect(200, { message: "success" }, allDone);
    })
  });

  describe('GET /foo and GET /bar and POST /foo,bar', function(done){
    it('respond 200 with json to all requests', function(done){
      var doneCnt = 0;
      function allDone(){
        if (++doneCnt == 3) done();
      }

      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "longpoll", priority: 10, value: { kind : "some" } }, allDone);
  
      request(app)
        .get('/bar')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "longpoll", priority: 10, value: { kind : "some" } }, allDone);

      setTimeout(function(){
        request(app)
          .post('/foo,bar')
          .set('Content-Type', 'application/json')
          .send({ key: "longpoll", value: { kind: "some" } })
          .expect(200, { message: "success" }, allDone);
      }, 200);
    })
  });

  describe('GET /foo and GET /foo and POST /foo 2 entities', function(done){
    it('respond 200 with json to all requests', function(done){
      var doneCnt = 0;
      function allDone(){
        if (++doneCnt == 3) done();
      }

      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "longA", priority: 10 }, allDone);
  
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "longB", priority: 10 }, allDone);

      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "longA" }, { key: "longB" }])
        .expect(200, { message: "success" }, allDone);
    })
  });

  describe('GET /foo and timeout', function(done){
    it('abort not to raise error on server', function(done){
      var req_ = request(app).get('/foo');
      var req = http.get(req_.url, function(res){
      }).on('error', function(e){
        assert.ok(!!e);
        setTimeout(done, 100);
      });
      setTimeout(function(){ req.abort() }, 100);
    })
  });
});

