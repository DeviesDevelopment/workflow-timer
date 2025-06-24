import { previousCommentFor, generateComment } from '../src/commentManager'
import type { DurationReport } from '../src/types'

describe('previousCommentFor', () => {
  const validComment = {
    user: { login: 'github-actions[bot]', type: 'Bot' },
    body: '🕒 Workflow "Test Workflow" took 60s which is a decrease with 10s (14.29%) compared to latest run on master/main.'
  }

  it('returns true for a matching GitHub Actions bot comment', () => {
    const matcher = previousCommentFor('Test Workflow')
    expect(matcher(validComment)).toBe(true)
  })

  it('returns false if login is incorrect', () => {
    const matcher = previousCommentFor('Test Workflow')
    const comment = {
      ...validComment,
      user: { login: 'someone-else', type: 'Bot' }
    }
    expect(matcher(comment)).toBe(false)
  })

  it('returns false if type is not Bot', () => {
    const matcher = previousCommentFor('Test Workflow')
    const comment = {
      ...validComment,
      user: { login: 'github-actions[bot]', type: 'User' }
    }
    expect(matcher(comment)).toBe(false)
  })

  it('returns false if body does not start with workflow prefix', () => {
    const matcher = previousCommentFor('Another Workflow')
    expect(matcher(validComment)).toBe(false)
  })

  it('returns false if user is null', () => {
    const matcher = previousCommentFor('Test Workflow')
    const comment = { ...validComment, user: null }
    expect(matcher(comment)).toBe(false)
  })
})

describe('generateComment', () => {
  it('returns fallback message when durationReport is undefined', () => {
    const result = generateComment('My Workflow', 'main', undefined)
    expect(result).toBe(
      '🕒 Workflow "My Workflow" has no historical runs on main branch. Can\'t compare.'
    )
  })

  it('generates correct comment for increase', () => {
    const report: DurationReport = {
      durationInSeconds: 90,
      diffInSeconds: 30,
      diffInPercentage: -50
    }
    const result = generateComment('My Workflow', 'main', report)
    expect(result).toBe(
      '🕒 Workflow "My Workflow" took 90s which is an increase with 30s (50.00%) compared to latest run on main.'
    )
  })

  it('generates correct comment for decrease', () => {
    const report: DurationReport = {
      durationInSeconds: 60,
      diffInSeconds: -20,
      diffInPercentage: 25
    }
    const result = generateComment('Deploy', 'main', report)
    expect(result).toBe(
      '🕒 Workflow "Deploy" took 60s which is a decrease with 20s (25.00%) compared to latest run on main.'
    )
  })

  it('produces comments with proper branch name', () => {
    const result = generateComment('My Workflow', 'develop', undefined)
    expect(result).toBe(
      '🕒 Workflow "My Workflow" has no historical runs on develop branch. Can\'t compare.'
    )
  })
})
