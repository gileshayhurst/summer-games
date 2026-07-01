import { generateJoinCode } from '@/lib/join-code'

describe('generateJoinCode', () => {
  it('returns a string of length 6 by default', () => {
    expect(generateJoinCode()).toHaveLength(6)
  })

  it('uses only unambiguous uppercase alphanumeric characters', () => {
    const allowed = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (let i = 0; i < 50; i++) {
      expect(generateJoinCode()).toMatch(allowed)
    }
  })

  it('generates different codes across calls', () => {
    const codes = new Set(Array.from({ length: 30 }, () => generateJoinCode()))
    expect(codes.size).toBeGreaterThan(20)
  })

  it('respects a custom length', () => {
    expect(generateJoinCode(8)).toHaveLength(8)
  })
})
