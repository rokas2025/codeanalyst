import { isValidTitle, sanitizeInput, isValidId } from '../utils/validation'

describe('Validation utilities', () => {
  describe('isValidTitle', () => {
    it('returns true for valid titles', () => {
      expect(isValidTitle('Valid Title')).toBe(true)
      expect(isValidTitle('A')).toBe(true)
      expect(isValidTitle('  Valid  ')).toBe(true)
    })

    it('returns false for invalid titles', () => {
      expect(isValidTitle('')).toBe(false)
      expect(isValidTitle('   ')).toBe(false)
      expect(isValidTitle('a'.repeat(201))).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test')
    })

    it('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('limits length to 200 characters', () => {
      const longString = 'a'.repeat(300)
      expect(sanitizeInput(longString).length).toBe(200)
    })
  })

  describe('isValidId', () => {
    it('returns true for valid UUIDs', () => {
      expect(isValidId('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    })

    it('returns false for invalid UUIDs', () => {
      expect(isValidId('not-a-uuid')).toBe(false)
      expect(isValidId('123')).toBe(false)
      expect(isValidId('')).toBe(false)
    })
  })
})

