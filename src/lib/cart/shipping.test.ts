import { describe, it, expect } from 'vitest'
import { splitFullName, composeShippingAddress } from './shipping'

describe('splitFullName', () => {
  it('splits on the first whitespace', () => {
    expect(splitFullName('Денис Іваненко')).toEqual({ first: 'Денис', last: 'Іваненко' })
  })
  it('keeps multi-word last name in last', () => {
    expect(splitFullName('Денис Іван Петрович')).toEqual({ first: 'Денис', last: 'Іван Петрович' })
  })
  it('single word goes to first, last empty', () => {
    expect(splitFullName('Денис')).toEqual({ first: 'Денис', last: '' })
  })
  it('empty / whitespace-only yields empties', () => {
    expect(splitFullName('   ')).toEqual({ first: '', last: '' })
    expect(splitFullName('')).toEqual({ first: '', last: '' })
  })
})

describe('composeShippingAddress', () => {
  it('joins city and branch with a comma', () => {
    expect(composeShippingAddress('Дніпро', 'Відділення №5')).toBe('Дніпро, Відділення №5')
  })
  it('omits empty parts', () => {
    expect(composeShippingAddress('Дніпро', '')).toBe('Дніпро')
    expect(composeShippingAddress('', '')).toBe('')
  })
  it('trims parts', () => {
    expect(composeShippingAddress('  Київ ', ' №1 ')).toBe('Київ, №1')
  })
})
