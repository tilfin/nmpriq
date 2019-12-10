const assert = require('assert')
const Datamodel = require("../lib/queue")


const dummyLogger = {
  debug: () => {},
  info : () => {},
  warn : () => {},
  error: () => {},
}


describe('dataModel#initialize', () => {
  const datamodel = new Datamodel(dummyLogger)

  afterEach(async () => {
    await datamodel.terminate()
  })

  describe('not specify db name', () => {
    it('should return error', async () => {
      var dbUri = "mongodb://user:pass@localhost/"
      try {
        await datamodel.initialize(dbUri, null, dummyLogger)
      } catch(err) {
        assert.ok(!!err)
      }
    })
  })

  describe('specify wrong user and pass', () => {
    it('should return err', async () => {
      const dbUri = "mongodb://user:pass@localhost/testdb"
      try {
        await datamodel.initialize(dbUri, null, dummyLogger)
      } catch(err) {
        assert.ok(!!err);
      }
    })
  })
})
