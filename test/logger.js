import assert from 'assert'
import { describe, it } from 'node:test'

import * as logger from '../lib/logger.js'

describe('logger', function () {
  const levels = [ 'info', 'error', 'debug' ]

  levels.forEach(level => {
    it(`has ${level} function`, () => {
      assert.equal(typeof logger[level], 'function')
    })
  })

  describe('emits log entries', function () {
    it('debug', () => {
      process.env.DEBUG = 1
      assert.ifError(logger.debug('test debug'))
      delete process.env.DEBUG
    })

    it('info', () => {
      delete process.env.NODE_ENV
      assert.ifError(logger.info('test info'))
      process.env.NODE_ENV = 'test'
    })

    it('error', () => {
      delete process.env.NODE_ENV
      assert.ifError(logger.error('test error'))
      process.env.NODE_ENV = 'test'
    })
  })

  if (process.env.COV) {
    it('has full coverage', () => {
      logger.debug('coverage test')
      process.env.NODE_ENV = 'test'
      logger.info('coverage test')
      logger.error('coverage test')
    })
  }
})
