import { jest } from '@jest/globals'
import type { GhActionsContext } from '../src/types'

const getCurrentWorkflowRun = jest.fn()
const listWorkflowRuns = jest.fn()
const listComments = jest.fn()
const createComment = jest.fn()
const updateComment = jest.fn()

jest.unstable_mockModule('../src/githubClient.js', () => ({
  default: class {
    getCurrentWorkflowRun = getCurrentWorkflowRun
    listWorkflowRuns = listWorkflowRuns
    listComments = listComments
    createComment = createComment
    updateComment = updateComment
  }
}))

const DEFAULT_CONTEXT: GhActionsContext = {
  eventName: '',
  workflow: '',
  issue: {
    number: 0
  },
  repo: {
    owner: '',
    repo: ''
  },
  runId: 0
}

const DEFAULT_WORKFLOW_RUN = {
  workflow_id: 0,
  head_branch: '',
  status: '',
  conclusion: '',
  run_started_at: '2025-04-29T14:05:00Z',
  updated_at: '2025-04-29T14:07:00Z'
}

const DEFAULT_COMMENT = {
  id: 0
}

describe('main', () => {
  let run: typeof import('../src/main.js').run

  beforeEach(async () => {
    const mainModule = await import('../src/main.js')
    run = mainModule.run
  })

  it('does nothing for non-pull_request events', async () => {
    await run(
      { ...DEFAULT_CONTEXT, eventName: 'not-pull_request' },
      'fake-token'
    )
    expect(createComment).not.toHaveBeenCalled()
    expect(updateComment).not.toHaveBeenCalled()
  })

  it('creates comment if no previous one is found', async () => {
    getCurrentWorkflowRun.mockReturnValueOnce(
      Promise.resolve({
        data: {
          ...DEFAULT_WORKFLOW_RUN
        }
      })
    )
    listWorkflowRuns.mockReturnValueOnce(
      Promise.resolve({
        data: {
          workflow_runs: [{ ...DEFAULT_WORKFLOW_RUN }]
        }
      })
    )
    listComments.mockReturnValueOnce(
      Promise.resolve({
        data: [{ ...DEFAULT_COMMENT }]
      })
    )
    await run({ ...DEFAULT_CONTEXT, eventName: 'pull_request' }, 'fake-token')

    expect(createComment).toHaveBeenCalledWith(
      '🕒 Workflow "" has no historical runs on master/main branch. Can\'t compare.'
    )
  })
})
