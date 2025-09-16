import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('../config/env', () => ({
  VITE_OPENAI_API_KEY: 'test-openai-key',
  VITE_ANTHROPIC_API_KEY: 'test-anthropic-key',
  VITE_GOOGLE_API_KEY: 'test-google-key',
  VITE_DEFAULT_AI_PROVIDER: 'local',
}))

// Mock file upload
global.FileReader = class {
  readAsArrayBuffer = vi.fn()
  readAsText = vi.fn()
  result = ''
  onload = vi.fn()
  onerror = vi.fn()
}

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})