import * as core from '@actions/core'
import { context } from '@actions/github'
import { GitHubClient } from './githubClient.js'

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
      (workflow_run) =>
        (workflow_run.head_branch === 'master' ||
          workflow_run.head_branch === 'main') &&
        workflow_run.status === 'completed' &&
        workflow_run.conclusion == 'success'
    )

    const startedAt = currentRun.data.run_started_at
    if (!startedAt) {
      throw new Error('Missing run_started_at for current workflow run')
    }

    const currentTime = new Date().getTime()
    const currentRunDurationInMillis =
      currentTime - new Date(startedAt).getTime()

    let outputMessage = ''
    if (!latestRunOnMaster) {
      outputMessage =
        "No data for historical runs on master/main branch found. Can't compare."
    } else {
      if (!latestRunOnMaster.run_started_at) {
        throw new Error('Missing run_started_at for latest run on master')
      }
      const latestMasterRunDurationInMillis =
        new Date(latestRunOnMaster.updated_at).getTime() -
        new Date(latestRunOnMaster.run_started_at).getTime()
      const diffInSeconds =
        (currentRunDurationInMillis - latestMasterRunDurationInMillis) / 1000
      const percentageDiff =
        (1 - currentRunDurationInMillis / latestMasterRunDurationInMillis) * 100
      const outcome = diffInSeconds > 0 ? 'an increase' : 'a decrease'

      outputMessage =
        '🕒 Workflow "' +
        context.workflow +
        '" took ' +
        currentRunDurationInMillis / 1000 +
        's which is ' +
        outcome +
        ' with ' +
        Math.abs(diffInSeconds) +
        's (' +
        Math.abs(percentageDiff).toFixed(2) +
        '%) compared to latest run on master/main.'
    }

    const existingComments = await ghClient.listComments()
    const existingComment = existingComments.data.reverse().find((comment) => {
      return (
        comment?.user?.login === 'github-actions[bot]' &&
        comment?.user?.type === 'Bot' &&
        comment?.body?.startsWith(`🕒 Workflow "${context.workflow}" took `)
      )
    })

    if (existingComment) {
      await ghClient.updateComment(existingComment.id, outputMessage)
    } else {
      await ghClient.createComment(outputMessage)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
