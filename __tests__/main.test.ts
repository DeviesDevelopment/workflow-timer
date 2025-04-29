import { jest } from '@jest/globals'
import type { GhActionsContext } from '../src/types'
import { run } from '../src/main.js'

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

// const DEFAULT_WORKFLOW_RUN = {
//   head_branch: '',
//   status: '',
//   conclusion: '',
//   run_started_at: '2025-04-29T14:05:00Z',
//   updated_at: '2025-04-29T14:07:00Z'
// }

const mockGhClient = {
  getCurrentWorkflowRun: jest.fn(),
  listWorkflowRuns: jest.fn(),
  listComments: jest.fn(),
  updateComment: jest.fn(),
  createComment: jest.fn()
}

jest.mock('../src/githubClient.js', () => {
  return jest.fn().mockImplementation(() => ({
    getCurrentWorkflowRun: mockGhClient.getCurrentWorkflowRun,
    listWorkflowRuns: mockGhClient.listWorkflowRuns,
    listComments: mockGhClient.listComments,
    updateComment: mockGhClient.updateComment,
    createComment: mockGhClient.createComment
  }))
})

describe('main', () => {
  it('does nothing for non-pull_request events', async () => {
    await run(
      { ...DEFAULT_CONTEXT, eventName: 'not-pull-request' },
      'fake-token'
    )
    expect(mockGhClient.createComment).not.toHaveBeenCalled()
    expect(mockGhClient.updateComment).not.toHaveBeenCalled()
  })
})
