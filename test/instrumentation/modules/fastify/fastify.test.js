/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

'use strict'

const isFastifyIncompat = require('../../../_is_fastify_incompat')()
if (isFastifyIncompat) {
  console.log(`# SKIP ${isFastifyIncompat}`)
  process.exit()
}

const test = require('tape')

const { runTestFixtures } = require('../../../_utils')

const testFixtures = [
  {
    name: 'fastify - transaction.name, captureBody',
    script: '../fixtures/use-fastify.js',
    cwd: __dirname,
    env: {
      NODE_OPTIONS: '--require=../../../../start.js',
      ELASTIC_APM_CAPTURE_BODY: 'all'
    },
    verbose: true,
    checkApmServer: (t, apmServer) => {
      t.equal(apmServer.events.length, 2, 'expected number of APM server events')
      t.ok(apmServer.events[0].metadata, 'metadata')

      const trans = apmServer.events[1].transaction
      t.equal(trans.name, 'POST /hello/:name', 'transaction.name')
      t.equal(trans.type, 'request', 'transaction.type')
      t.equal(trans.outcome, 'success', 'transaction.outcome')
      t.equal(trans.context.request.method, 'POST', 'transaction.context.request.method')
      t.equal(trans.context.request.body, JSON.stringify({ foo: 'bar' }), 'transaction.context.request.body')
    }
  },
  {
    name: 'fastify ESM',
    script: '../fixtures/use-fastify.mjs',
    cwd: __dirname,
    env: {
      NODE_OPTIONS: '--experimental-loader=../../../../loader.mjs --require=../../../../start.js',
      NODE_NO_WARNINGS: '1', // skip warnings about --experimental-loader
      ELASTIC_APM_CAPTURE_BODY: 'all'
    },
    nodeRange: '^12.20.0 || >=14.13.0 <20', // supported range for import-in-the-middle
    verbose: true,
    checkApmServer: (t, apmServer) => {
      t.equal(apmServer.events.length, 2, 'expected number of APM server events')
      t.ok(apmServer.events[0].metadata, 'metadata')

      const trans = apmServer.events[1].transaction
      t.equal(trans.name, 'POST /hello/:name', 'transaction.name')
      t.equal(trans.type, 'request', 'transaction.type')
      t.equal(trans.outcome, 'success', 'transaction.outcome')
      t.equal(trans.context.request.method, 'POST', 'transaction.context.request.method')
      t.equal(trans.context.request.body, JSON.stringify({ foo: 'bar' }), 'transaction.context.request.body')
    }
  }
]

test('fastify fixtures', suite => {
  runTestFixtures(suite, testFixtures)
  suite.end()
})
