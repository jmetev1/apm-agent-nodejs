/*
 * Copyright Elasticsearch B.V. and other contributors where applicable.
 * Licensed under the BSD 2-Clause License; you may not use this file except in
 * compliance with the BSD 2-Clause License.
 */

'use strict'

// Benchmark APM agent overhead with (a) a stable simulated number of spans
// and callstack depth per transaction and (b) a configuration that ensures
// span stacktrace collection.
//
// Compare to 'transaction-and-span-overhead-realistic-size' which is the
// same simulation, but with the default config.

/* eslint-disable no-unused-vars, no-undef */

const bench = require('./utils/bench')

bench('transaction-and-span-overhead-realistic-size-with-stack-trace', {
  agentConf: {
    spanStackTraceMinDuration: 0 // ensure span stacktrace collection
  },
  setup () {
    const agent = this.benchmark.agent
    const callstack = this.benchmark.callstack

    // To avoid randomness, but still generate what appears to be natural random
    // call stacks, number of spans etc, use a pre-defined set of numbers
    const numbers = [2, 5, 10, 1, 2, 21, 2, 5, 6, 9, 1, 11, 9, 8, 12]
    const numbersSpanIndex = 5
    const numbersStackLevelIndex = 0

    function addSpan (amount, cb) {
      setImmediate(() => {
        const span = agent && agent.startSpan()
        setImmediate(() => {
          if (agent) span.end()
          if (--amount === 0) cb()
          else addSpan(amount, cb)
        })
      })
    }
  },
  fn (deferred) {
    if (agent) agent.startTransaction()
    const amount = numbers[numbersStackLevelIndex++ % numbers.length]
    callstack(amount, () => {
      const amount = numbers[numbersSpanIndex++ % numbers.length]
      addSpan(amount, () => {
        if (agent) agent.endTransaction()
        deferred.resolve()
      })
    })
  }
})
