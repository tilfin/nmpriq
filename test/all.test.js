const request = require('supertest')
const Datamodel = require("../lib/queue")
const servercore = require("../lib/servercore")


const dummyLogger = {
  debug: () => {},
  info : () => {},
  warn : () => {},
  error: () => {},
}

const datamodel = new Datamodel(dummyLogger)
const app = servercore(datamodel, dummyLogger).createServer();


before(async () => {
  await datamodel.initialize("mongodb://localhost/testdb", { suffix: "TestQueue" })
})

after(async () => {
  await datamodel.terminate()
})


describe('Simple POST and GET', () => {
  before(async () => {
    await datamodel.clear('foo')
  })

  describe('POST /foo', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({"key": "irohanihoheto", "priority": 30 })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', () => {
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


describe('POST 3 entities and 3 GET', () => {
  before(async () => {
    await datamodel.clear('foo')
  })

  describe('POST /foo 3 entities with json', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "A" }, { key: "B" }, { key: "C" }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', () => {
    it('respond first entity A with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "A", priority: 10 }, done);
    })
  });

  describe('GET /foo', () => {
    it('respond second entity B with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "B", priority: 10 }, done);
    })
  });

  describe('GET /foo', () => {
    it('respond third entity C with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "C", priority: 10 }, done);
    })
  })
})


describe('POST 3 entities with distinct prority and 3 GET', () => {
  before(async () => {
    await datamodel.clear('foo')
  })

  describe('POST /foo 3 entities with json', () => {
    it('respond with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "A" }, { key: "B", priority: 5 }, { key: "C", priority: 50 }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  })
 
  describe('GET /foo', () => {
    it('respond C entity that is high priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "C", priority: 50 }, done);
    })
  })

  describe('GET /foo', () => {
    it('respond A entity that is default priority with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ key: "A", priority: 10 }, done);
    })
  });

  describe('GET /foo', () => {
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


describe('POST to 2 collection foo,bar on the same time', () => {
  before(async () => {
    await datamodel.clear('foo')
    await datamodel.clear('bar')
  })

  describe('POST /foo,bar', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", priority: 40 })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', () => {
    it('respond entity with json', function(done){
      request(app)
        .get('/foo')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect({ key: "abc", priority: 40 }, done);
    })
  });

  describe('GET /bar', () => {
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


describe('Default priority is 10 and value', () => {
  before(async () => {
    datamodel.clear('foo')
  })

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


describe('Increment priority', () => {
  before(async () => {
    datamodel.clear('foo')
  })

  describe('POST /foo 2 entities', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send([{ key: "abc" }, { key: "def" }])
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('POST /foo entity that has the key already exists', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "def" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', () => {
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


describe('Update value', () => {
  before(async () => {
    datamodel.clear('foo')
  })

  describe('POST /foo entity', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "record", value: "old" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('POST /foo entity has key exists with json ', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "record", value: "new" })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('GET /foo', () => {
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


describe('Delete test', () => {
  before(async () => {
    datamodel.clear('foo')
  })

  describe('POST /foo', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", value: { str: "str", num: -1 } })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('DELETE /foo', () => {
    it('respond no content', function(done){
      request(app)
        .del('/foo')
        .expect(204, done);
    })
  });
});


describe('Delete 2 targets', () => {
  before(async () => {
    await datamodel.clear('foo')
    await datamodel.clear('bar')
  })

  describe('POST /foo,bar', () => {
    it('respond success message with json', function(done){
      request(app)
        .post('/foo,bar')
        .set('Content-Type', 'application/json')
        .send({ key: "abc", value: { str: "str", num: -1 } })
        .expect(200)
        .expect({ message: "success" }, done);
    })
  });

  describe('DELETE /foo,bar', () => {
    it('respond no content', function(done){
      request(app)
        .del('/foo,bar')
        .expect(204, done);
    })
  });
});


describe('Not Found Error', () => {
  before(async () => {
    datamodel.clear('foo')
  })

  describe('GET /', () => {
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


describe('Bad Request Error', () => {
  describe('POST /foo with wrong json', () => {
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


describe('Method now allow Error', () => {
  describe('HEAD /foo', () => {
    it('respond 405 with json', function(done){
      request(app)
        .head('/foo')
        .expect(405, done);
    })
  });
})
