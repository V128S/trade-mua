import { describe, it, expect, vi, beforeEach } from 'vitest'

// Pass-through unstable_cache so the inner function runs directly in tests.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
}))

// reviews.ts calls: supabase.from('reviews').select('rating').eq('is_published', true)
const mockEq = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ select: () => ({ eq: mockEq }) }),
  }),
}))

const { getReviewsAggregate } = await import('./reviews')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getReviewsAggregate', () => {
  it('returns null when there are no published reviews', async () => {
    mockEq.mockResolvedValueOnce({ data: [], error: null })
    expect(await getReviewsAggregate()).toBeNull()
  })

  it('returns null on DB error', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } })
    expect(await getReviewsAggregate()).toBeNull()
  })

  it('returns correct count and average for a set of ratings', async () => {
    mockEq.mockResolvedValueOnce({ data: [{ rating: 5 }, { rating: 4 }, { rating: 5 }], error: null })
    const result = await getReviewsAggregate()
    expect(result).not.toBeNull()
    expect(result!.count).toBe(3)
    // (5+4+5)/3 = 4.666… → rounded to 4.7
    expect(result!.average).toBe(4.7)
  })

  it('rounds average to one decimal place for whole-number result', async () => {
    mockEq.mockResolvedValueOnce({ data: [{ rating: 5 }, { rating: 5 }], error: null })
    const result = await getReviewsAggregate()
    expect(result!.average).toBe(5)
  })
})
