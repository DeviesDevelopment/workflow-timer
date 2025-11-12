import { context } from '@actions/github'
import * as core from '@actions/core'
import { run } from './main.js'

try {
  const token = core.getInput('token')
  const compareBranch = core.getInput('compareBranch')
  const percentageThreshold = parseFloat(core.getInput('percentageThreshold'))

  if (isNaN(percentageThreshold) || percentageThreshold < 0) {
    throw new Error('percentageThreshold must be a non-negative number')
  }

  run(context, token, compareBranch, percentageThreshold)
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message)
  }
}
