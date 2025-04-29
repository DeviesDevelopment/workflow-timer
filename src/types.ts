export type GhActionsContext = {
  eventName: string
  workflow: string
  repo: {
    owner: string
    repo: string
  }
  issue: {
    number: number
  }
  runId: number
}

export type DurationReport = {
  durationInSeconds: number
  diffInSeconds: number
  diffInPercentage: number
}
