import { jest } from '@jest/globals'
import { calculateDuration } from '../src/durationCalculator'

const fixedNow = new Date('2025-01-01T12:00:00Z').getTime()

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(fixedNow)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('durationAnalyzer', () => {
  it('returns undefined if no last run is provided', () => {
    const result = calculateDuration({
      run_started_at: '2025-01-01T11:50:00Z',
      updated_at: '2025-01-01T12:00:00Z'
    })
    expect(result).toBeUndefined()
  })

  it('throws error if current.run_started_at is missing', () => {
    expect(() =>
      calculateDuration(
        { updated_at: '2025-01-01T12:00:00Z' },
        {
          run_started_at: '2025-01-01T11:00:00Z',
          updated_at: '2025-01-01T11:10:00Z'
        }
      )
    ).toThrow('Missing run_started_at')
  })

  it('throws error if last.run_started_at is missing', () => {
    expect(() =>
      calculateDuration(
        {
          run_started_at: '2025-01-01T11:50:00Z',
          updated_at: '2025-01-01T12:00:00Z'
        },
        { updated_at: '2025-01-01T11:10:00Z' }
      )
    ).toThrow('Missing run_started_at')
  })

  it('calculates duration and difference correctly', () => {
    const result = calculateDuration(
      {
        run_started_at: '2025-01-01T11:59:00Z',
        updated_at: '2025-01-01T12:00:00Z'
      },
      {
        run_started_at: '2025-01-01T11:00:00Z',
        updated_at: '2025-01-01T11:10:00Z'
      }
    )

    expect(result).toEqual({
      durationInSeconds: 60,
      diffInSeconds: -(9 * 60),
      diffInPercentage: 90
    })
  })
})
