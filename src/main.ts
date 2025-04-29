import * as core from '@actions/core'
import { context } from '@actions/github'
import { GitHubClient } from './githubClient.js'
import { calculateDuration as calculateDuration } from './durationCalculator.js'
import { DurationReport } from './types.js'

export async function run(): Promise<void> {
  try {
    const token = core.getInput('token')
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
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
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

function previousCommentFor(workflowName: string) {
  return (comment: {
    user: { login: string; type: string } | null
    body?: string
  }) => {
    return (
      comment.user?.login === 'github-actions[bot]' &&
      comment.user?.type === 'Bot' &&
      comment.body?.startsWith(`🕒 Workflow "${workflowName}" took `)
    )
  }
}

function generateComment(
  workflowName: string,
  durationReport?: DurationReport
) {
  if (!durationReport) {
    return "No data for historical runs on master/main branch found. Can't compare."
  }
  return (
    '🕒 Workflow "' +
    workflowName +
    '" took ' +
    durationReport.durationInSeconds +
    's which is ' +
    (durationReport.diffInSeconds > 0 ? 'an increase' : 'a decrease') +
    ' with ' +
    Math.abs(durationReport.diffInSeconds) +
    's (' +
    Math.abs(durationReport.diffInPercentage).toFixed(2) +
    '%) compared to latest run on master/main.'
  )
}
