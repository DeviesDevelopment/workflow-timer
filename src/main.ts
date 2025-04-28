import * as core from '@actions/core'
import { getOctokit, context } from '@actions/github'

export async function run(): Promise<void> {
  try {
    const github = getOctokit(core.getInput('token'))
    if (context.eventName != 'pull_request') {
      return
    }

    const currentTime = new Date().getTime()
    const currentRun = await github.rest.actions.getWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: context.runId
    })
    const startedAt = currentRun.data.run_started_at
    if (!startedAt) {
      throw new Error('Missing run_started_at for current workflow run')
    }

    const currentRunDurationInMillis =
      currentTime - new Date(startedAt).getTime()

    const workflowId = currentRun.data.workflow_id
    const historical_runs = await github.rest.actions.listWorkflowRuns({
      owner: context.repo.owner,
      repo: context.repo.repo,
      workflow_id: workflowId
    })

    const latestRunsOnMaster = historical_runs.data.workflow_runs.filter(
      (x) =>
        (x.head_branch === 'master' || x.head_branch === 'main') &&
        x.status === 'completed' &&
        x.conclusion == 'success'
    )

    let outputMessage = ''
    if (latestRunsOnMaster.length === 0) {
      outputMessage =
        "No data for historical runs on master/main branch found. Can't compare."
    } else {
      const latestRunOnMaster = latestRunsOnMaster[0]
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

    const existingComments = await github.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number
    })
    const existingComment = existingComments.data.reverse().find((comment) => {
      return (
        comment?.user?.login === 'github-actions[bot]' &&
        comment?.user?.type === 'Bot' &&
        comment?.body?.startsWith(`🕒 Workflow "${context.workflow}" took `)
      )
    })

    const commentInput = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: outputMessage
    }

    if (existingComment) {
      await github.rest.issues['updateComment']({
        ...commentInput,
        comment_id: existingComment.id
      })
    } else {
      await github.rest.issues['createComment'](commentInput)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
