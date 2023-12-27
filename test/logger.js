
const assert = require('assert')

const logger = require('../lib/logger')

describe('logger', function () {

  [ 'info', 'error', 'debug' ].forEach(function (level) {
    it('has ' + level + ' function', function () {
      assert.equal(typeof logger[level], 'function')
    })
  })

  describe('emits log entries', function () {
    it('debug', function () {
      process.env.DEBUG=1
      assert.ifError(logger.debug('test debug'))
      delete process.env.DEBUG
    })

    it('info', function () {
      delete process.env.NODE_ENV
      assert.ifError(logger.info('test info'))
      process.env.NODE_ENV='test'
    })

    it('error', function () {
      delete process.env.NODE_ENV
      assert.ifError(logger.error('test error'))
      process.env.NODE_ENV='test'
    })
  })

  if (process.env.COV) {
    it('has full coverage', function (done) {
      logger.debug('coverage test')
      process.env.NODE_ENV = 'test'
      logger.info('coverage test')
      logger.error('coverage test')
      done()
    })
  }
})
