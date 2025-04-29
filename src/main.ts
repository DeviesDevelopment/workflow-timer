import { GitHubClient } from './githubClient.js'
import { calculateDuration as calculateDuration } from './durationCalculator.js'
import { generateComment, previousCommentFor } from './commentManager.js'
import { Context } from '@actions/github/lib/context.js'

export async function run(context: Context, token: string): Promise<void> {
  const ghClient = new GitHubClient(token, context)
  if (context.eventName != 'pull_request') {
    return
  }

  const currentRun = await ghClient.getCurrentWorkflowRun()
  const historical_runs = await ghClient.listWorkflowRuns(
    currentRun.data.workflow_id
  )
  const latestRunOnMaster = historical_runs.data.workflow_runs.find(
    succeededOnMainBranch
  )

  const durationReport = calculateDuration(currentRun.data, latestRunOnMaster)
  const outputMessage = generateComment(context.workflow, durationReport)

  const existingComments = await ghClient.listComments()
  const existingComment = existingComments.data
    .reverse()
    .find(previousCommentFor(context.workflow))

  if (existingComment) {
    await ghClient.updateComment(existingComment.id, outputMessage)
  } else {
    await ghClient.createComment(outputMessage)
  }
}

function succeededOnMainBranch(workflowRun: {
  head_branch: string | null
  status: string | null
  conclusion: string | null
}) {
  const { head_branch, status, conclusion } = workflowRun
  return (
    (head_branch === 'master' || head_branch === 'main') &&
    status === 'completed' &&
    conclusion === 'success'
  )
}
