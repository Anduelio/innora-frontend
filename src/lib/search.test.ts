import { describe, expect, it } from 'vitest'
import { fold, matchesText, titleRank } from './search'

describe('search helpers', () => {
  it('ignores accents and case', () => {
    expect(fold('Klientët Çmimi')).toBe('klientet cmimi')
    expect(matchesText('Klientët', 'KLIENTET')).toBe(true)
    expect(matchesText('Çmimi i dhomës', 'cmimi dhomes')).toBe(true)
  })

  it('needs every word, in any order', () => {
    expect(matchesText('Dhomat dhe tipet', 'tipet dhomat')).toBe(true)
    expect(matchesText('Dhomat dhe tipet', 'dhomat pagesa')).toBe(false)
    expect(matchesText('çdo gjë', '   ')).toBe(true)
  })

  it('ranks prefix matches first', () => {
    expect(titleRank('Raportet', 'rap')).toBe(0)
    expect(titleRank('Të dhënat demo', 'demo')).toBe(1)
    expect(titleRank('Rivendos', 'vend')).toBe(2)
  })
})
