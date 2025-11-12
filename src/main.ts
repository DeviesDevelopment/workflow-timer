import GitHubClient from './githubClient.js'
import { calculateDuration as calculateDuration } from './durationCalculator.js'
import { generateComment, previousCommentFor } from './commentManager.js'
import { GhActionsContext } from './types.js'

export async function run(
  context: GhActionsContext,
  token: string,
  compareBranch: string,
  percentageThreshold: number = 0
): Promise<void> {
  const ghClient = new GitHubClient(token, context)
  if (context.eventName != 'pull_request') {
    return
  }

  const currentRun = await ghClient.getCurrentWorkflowRun()
  const historical_runs = await ghClient.listWorkflowRuns(
    currentRun.data.workflow_id
  )
  const latestRunOnCompareBranch = historical_runs.data.workflow_runs.find(
    (run) => succeededOnBranch(run, compareBranch)
  )

  const durationReport = calculateDuration(
    currentRun.data,
    latestRunOnCompareBranch
  )

  const meetsThreshold =
    !durationReport ||
    Math.abs(durationReport.diffInPercentage) >= percentageThreshold

  const existingComments = await ghClient.listComments()
  const existingComment = existingComments.data
    .reverse()
    .find(previousCommentFor(context.workflow))

  if (meetsThreshold) {
    const outputMessage = generateComment(
      context.workflow,
      compareBranch,
      durationReport
    )

    if (existingComment) {
      await ghClient.updateComment(existingComment.id, outputMessage)
    } else {
      await ghClient.createComment(outputMessage)
    }
  } else if (existingComment) {
    await ghClient.deleteComment(existingComment.id)
  }
}

function succeededOnBranch(
  workflowRun: {
    head_branch: string | null
    status: string | null
    conclusion: string | null
  },
  target_branch: string
) {
  const { head_branch, status, conclusion } = workflowRun
  return (
    head_branch === target_branch &&
    status === 'completed' &&
    conclusion === 'success'
  )
}
