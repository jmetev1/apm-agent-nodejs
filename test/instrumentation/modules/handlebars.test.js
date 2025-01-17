/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

'use strict'

if (process.env.GITHUB_ACTIONS === 'true' && process.platform === 'win32') {
  console.log('# SKIP: GH Actions do not support docker services on Windows')
  process.exit(0)
}

process.env.ELASTIC_APM_TEST = true

const agent = require('../../..').start({
  serviceName: 'test',
  secretToken: 'test',
  captureExceptions: false,
  metricsInterval: 0,
  centralConfig: false,
  spanStackTraceMinDuration: 0 // Always have span stacktraces.
})

const handlebars = require('handlebars')
const test = require('tape')

const mockClient = require('../../_mock_http_client')
const findObjInArray = require('../../_utils').findObjInArray

test('handlebars compile and render', function userLandCode (t) {
  resetAgent(function (data) {
    t.strictEqual(data.transactions.length, 1)
    t.strictEqual(data.spans.length, 2)

    const trans = data.transactions[0]

    t.ok(/^foo\d$/.test(trans.name))
    t.strictEqual(trans.type, 'custom')

    const actions = ['compile', 'render']
    for (const action of actions) {
      const span = findObjInArray(data.spans, 'action', action)
      t.ok(span, 'should have span of action ' + action)
      t.strictEqual(span.name, 'handlebars')
      t.strictEqual(span.type, 'template')
      t.strictEqual(span.subtype, 'handlebars')
      t.ok(span.stacktrace.some(function (frame) {
        return frame.function === 'userLandCode'
      }), 'include user-land code frame')
    }

    t.end()
  })

  agent.startTransaction('foo1')

  const template = handlebars.compile('Hello, {{name}}!')
  template({ name: 'world' })

  agent.endTransaction()
  agent.flush()
})

function resetAgent (cb) {
  agent._instrumentation.testReset()
  agent._apmClient = mockClient(3, cb)
  agent.captureError = function (err) { throw err }
}
