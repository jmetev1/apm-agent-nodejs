/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

'use strict'

// DEPRECATED: New tests should not use this wrapper. Instead using the
// real Agent directly, and its `agent.destroy()` method to clean up state
// and the end of tests. E.g.:
//
// const Agent = require('.../lib/agent')
// test('test name', t => {
//   const agent = new Agent().start({ ... })
//   ...
//   agent.destroy()
//   t.end()
// })

const Agent = require('../lib/agent')
const symbols = require('../lib/symbols')

const Filters = require('object-filter-sequence')

let uncaughtExceptionListeners = process._events.uncaughtException
let agent

module.exports = setup

function setup () {
  clean()
  uncaughtExceptionListeners = process._events.uncaughtException
  process.removeAllListeners('uncaughtException')
  agent = new Agent()
  return agent
}

function clean () {
  global[symbols.agentInitialized] = null
  process._events.uncaughtException = uncaughtExceptionListeners
  if (agent) {
    agent._errorFilters = new Filters()
    agent._transactionFilters = new Filters()
    agent._spanFilters = new Filters()
    if (agent._instrumentation) {
      agent._instrumentation._started = false
      if (agent._instrumentation._hook) {
        agent._instrumentation._hook.unhook()
      }
    }
    agent._metrics.stop()
    if (agent._apmClient && agent._apmClient.destroy) {
      agent._apmClient.destroy()
    }
    agent._apmClient = null
  }
}
