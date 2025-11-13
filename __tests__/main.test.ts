import { jest } from '@jest/globals'
import type { GhActionsContext } from '../src/types'

const getCurrentWorkflowRun = jest.fn()
const listWorkflowRuns = jest.fn()
const listComments = jest.fn()
const createComment = jest.fn()
const updateComment = jest.fn()
const deleteComment = jest.fn()

jest.unstable_mockModule('../src/githubClient.js', () => ({
  default: class {
    getCurrentWorkflowRun = getCurrentWorkflowRun
    listWorkflowRuns = listWorkflowRuns
    listComments = listComments
    createComment = createComment
    updateComment = updateComment
    deleteComment = deleteComment
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

const fixedNow = new Date('2025-04-29T14:00:00Z')

describe('main', () => {
  let run: typeof import('../src/main.js').run

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(fixedNow.getTime())
    const mainModule = await import('../src/main.js')
    run = mainModule.run

    listComments.mockReturnValue(
      Promise.resolve({
        data: []
      })
    )
    listWorkflowRuns.mockReturnValue(
      Promise.resolve({
        data: {
          workflow_runs: []
        }
      })
    )
    getCurrentWorkflowRun.mockReturnValue(
      Promise.resolve({
        data: {
          ...DEFAULT_WORKFLOW_RUN
        }
      })
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does nothing for non-pull_request events', async () => {
    await run(
      { ...DEFAULT_CONTEXT, eventName: 'not-pull_request' },
      'fake-token',
      'main',
      0
    )
    expect(createComment).not.toHaveBeenCalled()
    expect(updateComment).not.toHaveBeenCalled()
  })

  it('creates comment if no previous one is found', async () => {
    await run(
      {
        ...DEFAULT_CONTEXT,
        eventName: 'pull_request',
        workflow: 'My workflow'
      },
      'fake-token',
      'main',
      0
    )

    expect(createComment).toHaveBeenCalledWith(
      '🕒 Workflow "My workflow" has no historical runs on main branch. Can\'t compare.'
    )
  })

  it('updates comment if previous one is found', async () => {
    listComments.mockReturnValueOnce(
      Promise.resolve({
        data: [
          {
            id: 42,
            user: {
              login: 'github-actions[bot]',
              type: 'Bot'
            },
            body: '🕒 Workflow "Another workflow" took...'
          }
        ]
      })
    )
    await run(
      {
        ...DEFAULT_CONTEXT,
        eventName: 'pull_request',
        workflow: 'Another workflow'
      },
      'fake-token',
      'main',
      0
    )

    expect(updateComment).toHaveBeenCalledWith(
      42,
      '🕒 Workflow "Another workflow" has no historical runs on main branch. Can\'t compare.'
    )
  })

  it('includes duration information if previous workflow run is found', async () => {
    getCurrentWorkflowRun.mockReturnValueOnce({
      data: {
        run_started_at: '2025-04-29T13:57:00Z',
        workflow_id: 42
      }
    })
    listWorkflowRuns.mockReturnValueOnce({
      data: {
        workflow_runs: [
          {
            ...DEFAULT_WORKFLOW_RUN,
            run_started_at: '2025-04-28T13:55:00Z',
            updated_at: '2025-04-28T13:56:00Z',
            head_branch: 'main',
            status: 'completed',
            conclusion: 'success'
          }
        ]
      }
    })
    await run(
      {
        ...DEFAULT_CONTEXT,
        eventName: 'pull_request',
        workflow: 'Some workflow'
      },
      'fake-token',
      'main',
      0
    )

    expect(createComment).toHaveBeenCalledWith(
      '🕒 Workflow "Some workflow" took 180s which is an increase with 120s (200.00%) compared to latest run on main.'
    )
  })

  it('does not create comment when change is below threshold', async () => {
    getCurrentWorkflowRun.mockReturnValueOnce({
      data: {
        run_started_at: '2025-04-29T13:57:00Z',
        workflow_id: 42
      }
    })
    listWorkflowRuns.mockReturnValueOnce({
      data: {
        workflow_runs: [
          {
            ...DEFAULT_WORKFLOW_RUN,
            run_started_at: '2025-04-28T13:56:30Z',
            updated_at: '2025-04-28T13:59:40Z',
            head_branch: 'main',
            status: 'completed',
            conclusion: 'success'
          }
        ]
      }
    })
    await run(
      {
        ...DEFAULT_CONTEXT,
        eventName: 'pull_request',
        workflow: 'Some workflow'
      },
      'fake-token',
      'main',
      10
    )

    expect(createComment).not.toHaveBeenCalled()
    expect(updateComment).not.toHaveBeenCalled()
  })

  it('deletes existing comment when change is below threshold', async () => {
    getCurrentWorkflowRun.mockReturnValueOnce({
      data: {
        run_started_at: '2025-04-29T13:57:00Z',
        workflow_id: 42
      }
    })
    listWorkflowRuns.mockReturnValueOnce({
      data: {
        workflow_runs: [
          {
            ...DEFAULT_WORKFLOW_RUN,
            run_started_at: '2025-04-28T13:56:30Z',
            updated_at: '2025-04-28T13:59:40Z',
            head_branch: 'main',
            status: 'completed',
            conclusion: 'success'
          }
        ]
      }
    })
    listComments.mockReturnValueOnce({
      data: [
        {
          id: 123,
          user: {
            login: 'github-actions[bot]',
            type: 'Bot'
          },
          body: '🕒 Workflow "Some workflow" took...'
        }
      ]
    })
    await run(
      {
        ...DEFAULT_CONTEXT,
        eventName: 'pull_request',
        workflow: 'Some workflow'
      },
      'fake-token',
      'main',
      10
    )

    expect(deleteComment).toHaveBeenCalledWith(123)
    expect(createComment).not.toHaveBeenCalled()
    expect(updateComment).not.toHaveBeenCalled()
  })
})
