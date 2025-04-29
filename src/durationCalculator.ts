import { DurationReport } from './types.js'

type WorkflowRun = {
  run_started_at?: string
  updated_at: string
}

export function calculateDuration(
  current: WorkflowRun,
  last?: WorkflowRun
): DurationReport | undefined {
  if (!last) {
    return undefined
  }
  if (!current.run_started_at || !last?.run_started_at) {
    throw new Error('Missing run_started_at')
  }
  const currentTime = new Date().getTime()
  const currentRunDurationInMillis =
    currentTime - new Date(current.run_started_at).getTime()

  const lastRunDurationInMillis =
    new Date(last.updated_at).getTime() -
    new Date(last.run_started_at).getTime()
  const diffInSeconds =
    (currentRunDurationInMillis - lastRunDurationInMillis) / 1000
  const percentageDiff =
    (1 - currentRunDurationInMillis / lastRunDurationInMillis) * 100

  return {
    durationInSeconds: currentRunDurationInMillis / 1000,
    diffInSeconds,
    diffInPercentage: percentageDiff
  }
}
