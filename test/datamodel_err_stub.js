/*
 * datamodel mock for DB Error
 */

class Dummy {
  initialize(dbUri, param, mylogger, callback) {
    return Promise.resolve()
  }

  terminate() {
    return Promise.resolve()
  }

  dataIn(target, items, callback) {
    callback(new Error("DBError"));
  }

  dataOut(target, callback) {
    callback(new Error("DBError"), null);
  }
  
  async clear(target) {
    throw new Error("DBError")
  }
}

module.exports = Dummy
