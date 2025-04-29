import { DurationReport } from './types.js'

export function previousCommentFor(workflowName: string) {
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

export function generateComment(
  workflowName: string,
  durationReport?: DurationReport
) {
  if (!durationReport) {
    return `🕒 Workflow "${workflowName}" has no historical runs on master/main branch. Can't compare.`;
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
