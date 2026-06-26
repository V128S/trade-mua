import { describe, it, expect } from 'vitest'
import { getPost, getAllPosts, getBlogDates, BLOG_SLUGS } from './blog'

describe('getPost', () => {
  it('returns null for an unknown slug', () => {
    expect(getPost('not-a-real-slug', 'uk')).toBeNull()
  })

  it('returns a BlogPost with required fields for a known slug', () => {
    const post = getPost(BLOG_SLUGS[0], 'uk')
    expect(post).not.toBeNull()
    expect(post!.slug).toBe(BLOG_SLUGS[0])
    expect(typeof post!.title).toBe('string')
    expect(post!.title.length).toBeGreaterThan(0)
    expect(typeof post!.description).toBe('string')
    expect(post!.body.length).toBeGreaterThan(0)
  })

  it('date is in ISO yyyy-mm-dd format', () => {
    const post = getPost(BLOG_SLUGS[0], 'uk')
    expect(post?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('falls back to uk locale when the requested locale file is missing', () => {
    const post = getPost(BLOG_SLUGS[0], 'fr')
    expect(post).not.toBeNull()
    const uk = getPost(BLOG_SLUGS[0], 'uk')
    expect(post!.body).toBe(uk!.body)
  })

  it('returns non-null for every slug in all three locales', () => {
    for (const slug of BLOG_SLUGS) {
      for (const locale of ['uk', 'en', 'ru'] as const) {
        const post = getPost(slug, locale)
        expect(post, `${slug}/${locale} returned null`).not.toBeNull()
      }
    }
  })
})

describe('getAllPosts', () => {
  it('returns all blog posts for uk locale', () => {
    const posts = getAllPosts('uk')
    expect(posts.length).toBe(BLOG_SLUGS.length)
  })

  it('posts are sorted newest-first by date', () => {
    const posts = getAllPosts('uk')
    for (let i = 1; i < posts.length; i++) {
      expect(
        posts[i - 1].date >= posts[i].date,
        `${posts[i - 1].slug} (${posts[i - 1].date}) should be >= ${posts[i].slug} (${posts[i].date})`,
      ).toBe(true)
    }
  })

  it('every post has slug, title, description, date, body', () => {
    for (const post of getAllPosts('uk')) {
      expect(post.slug).toBeTruthy()
      expect(post.title).toBeTruthy()
      expect(post.description).toBeTruthy()
      expect(post.date).toBeTruthy()
      expect(post.body.length).toBeGreaterThan(0)
    }
  })
})

describe('getBlogDates', () => {
  it('returns an ISO date string for every known slug', () => {
    const dates = getBlogDates()
    for (const slug of BLOG_SLUGS) {
      expect(dates[slug], `missing date for ${slug}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
