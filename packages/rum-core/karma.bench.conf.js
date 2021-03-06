/**
 * MIT License
 *
 * Copyright (c) 2017-present, Elasticsearch BV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

const { join } = require('path')
const { mkdirSync, existsSync } = require('fs')
const { baseConfig, prepareConfig } = require('../../dev-utils/karma')
const { getWebpackConfig, BUNDLE_TYPES } = require('../../dev-utils/build')

const BENCHMARKS_DIR = join(__dirname, 'test', 'benchmarks')
const REPORTS_DIR = join(__dirname, 'reports')

module.exports = function(config) {
  /**
   * create reports directory if it does not exist
   */
  try {
    if (!existsSync(REPORTS_DIR)) {
      mkdirSync(REPORTS_DIR)
    }
  } catch (err) {
    console.error('Failed to create reports directory', err)
    process.exit(1)
  }

  config.set(baseConfig)

  const specPattern = `${BENCHMARKS_DIR}/**/*.bench.js`
  config.set({
    files: [require.resolve('regenerator-runtime/runtime'), specPattern],
    webpack: getWebpackConfig(BUNDLE_TYPES.BROWSER_ESM_PROD),
    autoWatch: false,
    singleRun: true,
    concurrency: 1,
    frameworks: ['benchmark'],
    reporters: ['benchmark', 'benchmark-json'],
    plugins: [
      'karma-webpack',
      'karma-benchmark',
      'karma-benchmark-reporter',
      'karma-benchmark-json-reporter'
    ],
    benchmarkJsonReporter: {
      pathToJson: `${REPORTS_DIR}/rum-core-benchmarks.json`,
      formatOutput(results) {
        const summary = results.map(
          ({ suite, name, mean, count, cycle, browser, hz }) => {
            /**
             * Ignore version and os in browser
             */
            const browserName = browser.toLowerCase().split(' ')[0]
            return {
              suite,
              name,
              mean,
              count,
              cycle,
              browser: browserName,
              hz,
              unit: 'ops/sec'
            }
          }
        )
        console.log(
          '@elastic/apm-rum-core benchmarks',
          JSON.stringify(summary, undefined, 2)
        )
        return { type: 'benchmarkjs', summary }
      }
    }
  })
  const preparedConfig = prepareConfig(config)
  preparedConfig.preprocessors = {
    [specPattern]: ['webpack']
  }
  config.set(preparedConfig)
}
