import { getOctokit } from '@actions/github'
import { context } from '@actions/github'

type GhActionsContext = {
  repo: {
    owner: string
    repo: string
  }
  issue: {
    number: number
  }
  runId: number
}

export class GitHubClient {
  github
  ctx

  constructor(token: string, ctx: GhActionsContext) {
    this.github = getOctokit(token)
    this.ctx = ctx
  }

  async getCurrentWorkflowRun() {
    return this.github.rest.actions.getWorkflowRun({
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      run_id: this.ctx.runId
    })
  }

  async listWorkflowRuns(workflowId: number) {
    return this.github.rest.actions.listWorkflowRuns({
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      workflow_id: workflowId
    })
  }

  async listComments() {
    return this.github.rest.issues.listComments({
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      issue_number: this.ctx.issue.number
    })
  }

  async updateComment(commentId: number, body: string) {
    return this.github.rest.issues.updateComment({
      owner: this.ctx.repo.owner,
      repo: this.ctx.repo.repo,
      issue_number: this.ctx.issue.number,
      comment_id: commentId,
      body
    })
  }

  async createComment(body: string) {
    return this.github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: this.ctx.issue.number,
      body
    })
  }
}
