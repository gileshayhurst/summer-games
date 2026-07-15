import { randomInt } from 'crypto'

// Excludes 0/O/1/I to avoid visual ambiguity
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += CHARS[randomInt(CHARS.length)]
  }
  return code
}
