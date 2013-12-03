
var assert = require('assert');
var http = require('http');
var request = require('supertest');
var mongodb = require("mongodb");
var datamodel = require("../queue");
var server = require("../servercore");


var dummyLogger = {
        debug: function(){},
        info : function(){},
        warn : function(){},
        error: function(){}
    };

var app = server(datamodel, dummyLogger);


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


describe('Simple POST and GET', function() {
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo', function() {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({"key": "irohanihoheto", "priority": 30 })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond entity with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "irohanihoheto", priority: 30 }, done);
    })
  });
});


describe('POST 3 entities and 3 GET', function() {
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo 3 entities with json', function() {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "A" }, { key: "B" }, { key: "C" }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond first entity A with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "A", priority: 10 }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond second entity B with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "B", priority: 10 }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond third entity C with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "C", priority: 10 }, done);
    })
  });
});


describe('POST 3 entities with distinct prority and 3 GET', function() {
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo 3 entities with json', function() {
    it('respond with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "A" }, { key: "B", priority: 5 }, { key: "C", priority: 50 }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });
 
  describe('GET /foo', function() {
    it('respond C entity that is high priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "C", priority: 50 }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond A entity that is default priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "A", priority: 10 }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond B entity that is low priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "B", priority: 5 }, done);
    })
  });
});


describe('POST to 2 collection foo,bar on the same time', function() {
  before(function(done){
    datamodel.clear('foo', function(){
      datamodel.clear('bar', done);
    });
  });

  describe('POST /foo,bar', function() {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", priority: 40 })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', function() {
    it('respond entity with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "abc", priority: 40 }, done);
    })
  });

  describe('GET /bar', function() {
    it('respond entity with json', function(done){
      request(app)
        .get('/bar')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "abc", priority: 40 }, done);
    })
  });
});


describe('Default priority is 10 and value', function() {
  before(function(done){
    datamodel.clear('foo', done);
  });

  it('POST respond with json', function(done){
    request(app)
      .post('/foo')
      .set('Content-Type', 'application/json')
      .send({ key: "abc", value: { str: "str", num: -1 } })
      .expect(200)
      .expect({ message: "success" }, done);
  })

  it('GET respond with json', function(done){
    request(app)
      .get('/foo')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({ key: "abc", priority: 10, value: { str: "str", num: -1 } }, done);
  })
});


describe('Increment priority', function() {
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo 2 entities', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "abc" }, { key: "def" }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('POST /foo entity that has the key already exists', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "def" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', function(){
    it('respond entity updated priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "def", priority: 20 }, done);
    })
  });
});


describe('Update value', function(){
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo entity', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "record", value: "old" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('POST /foo entity has key exists with json ', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "record", value: "new" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', function(){
    it('respond new value and incremented priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "record", priority: 20, value: "new" }, done);
    })
  });
});


describe('Delete test', function(){
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('POST /foo', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", value: { str: "str", num: -1 } })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('DELETE /foo', function(){
    it('respond no content', function(done){
      request(app)
        .del('/foo')
        .expect(204, done);
    })
  });
});


describe('Delete 2 targets', function(){
  before(function(done){
    datamodel.clear('foo', function(){
      datamodel.clear('bar', done);
    });
  });

  describe('POST /foo,bar', function(){
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", value: { str: "str", num: -1 } })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('DELETE /foo,bar', function(){
    it('respond no content', function(done){
      request(app)
        .del('/foo,bar')
        .expect(204, done);
    })
  });
});


describe('Not Found Error', function(){
  before(function(done){
    datamodel.clear('foo', done);
  });

  describe('GET /', function(done){
    it('respond 404 with json', function(done){
      request(app)
        .get('/')
        .set('Content-Type', 'application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .expect({ message: "Target not found" }, done);
    })
  });
});


describe('Bad Request Error', function(){
  describe('POST /foo with wrong json', function(){
    it('respond 400 with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send('{{ key: "abc" }}')
        .expect(400)
        .expect('Content-Type', /json/)
        .expect({ message: "Wrong JSON" }, done);
    })
  });
});


describe('Method now allow Error', function(){
  describe('HEAD /foo', function(done){
    it('respond 405 with json', function(done){
      request(app)
        .head('/foo')
        .expect(405, done);
    })
  });
});

