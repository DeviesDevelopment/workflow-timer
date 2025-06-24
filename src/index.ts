import { context } from '@actions/github'
import * as core from '@actions/core'
import { run } from './main.js'

try {
  const token = core.getInput('token')
  const compareBranch = core.getInput('compareBranch')
  run(context, token, compareBranch)
} catch (error) {
  if (error instanceof Error) {
    core.setFailed(error.message)
  }
}
