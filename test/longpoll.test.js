const assert = require('assert')
const http = require('http')
const request = require('supertest')
const Datamodel = require("../lib/queue")
const servercore = require("../lib/servercore")


const dummyLogger = {
  debug: function(){},
  info : function(){},
  warn : function(){},
  error: function(){},
}

const datamodel = new Datamodel(dummyLogger)
const app = servercore(datamodel, dummyLogger).createServer();


before(async () => {
  await datamodel.initialize("mongodb://localhost/testdb", { suffix: "TestQueue" }, dummyLogger)
})

after(async () => {
  await datamodel.terminate()
})


describe('Long poll test', () => {
  beforeEach(async () => {
    await datamodel.clear('foo')
    await datamodel.clear('bar')
  })

  describe('GET /foo and POST /foo', () => {
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

  describe('GET /foo and GET /bar and POST /foo,bar', () => {
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

  describe('GET /foo and GET /foo and POST /foo 2 entities', () => {
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

  describe('GET /foo and timeout', () => {
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

