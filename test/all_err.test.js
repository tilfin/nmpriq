const request = require('supertest')
const Datamodel = require("./datamodel_err_stub")
const servercore = require("../lib/servercore")

const dummyLogger = require('./logger')

const datamodel = new Datamodel(dummyLogger)
const app = servercore(datamodel, dummyLogger).createServer()


describe('Simple DB Error', () => {
  describe('POST /foo', () => {
    it('respond error with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({"key": "irohanihoheto", "priority": 30 })
        .expect(500, done);
    })
  });

  describe('GET /foo', () => {
    it('respond error with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500, done);
    })
  });
});


describe('POST to 2 collection foo,bar on the same time', () => {
  describe('POST /foo,bar', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", priority: 40 })
        .expect(500, done);
    })
  });
});


describe('Delete test', () => {
  describe('DELETE /foo', () => {
    it('respond error', function(done){
      request(app)
        .del('/foo')
        .expect(500, done);
    })
  });
});


describe('Delete 2 targets', () => {
  describe('DELETE /foo,bar', () => {
    it('respond no content', function(done){
      request(app)
        .del('/foo,bar')
        .expect(500, done);
    })
  })
})
