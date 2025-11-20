# Comprehensive Testing Strategy - CodeAnalyst System

## Overview
This document outlines a complete testing strategy for the CodeAnalyst system, covering all types of automated and manual testing needed to ensure quality, reliability, and performance before and after MVP launch.

---

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Unit Testing](#1-unit-testing)
3. [Integration Testing](#2-integration-testing)
4. [End-to-End (E2E) Testing](#3-end-to-end-e2e-testing)
5. [API Testing](#4-api-testing)
6. [Performance Testing](#5-performance-testing)
7. [Security Testing](#6-security-testing)
8. [Accessibility Testing](#7-accessibility-testing)
9. [Cross-Browser Testing](#8-cross-browser-testing)
10. [Mobile Responsiveness Testing](#9-mobile-responsiveness-testing)
11. [Database Testing](#10-database-testing)
12. [AI/ML Testing](#11-aiml-testing)
13. [WordPress Integration Testing](#12-wordpress-integration-testing)
14. [User Acceptance Testing (UAT)](#13-user-acceptance-testing-uat)
15. [Regression Testing](#14-regression-testing)
16. [Load & Stress Testing](#15-load--stress-testing)
17. [Monitoring & Observability](#16-monitoring--observability)
18. [Test Automation CI/CD](#17-test-automation-cicd)
19. [Testing Tools & Setup](#testing-tools--setup)
20. [Test Coverage Goals](#test-coverage-goals)

---

## Testing Philosophy

### Principles
1. **Test Early, Test Often**: Integrate testing from day one
2. **Automate Everything Possible**: Reduce manual testing burden
3. **Test in Production-Like Environments**: Catch environment-specific issues
4. **Fail Fast**: Tests should fail quickly and clearly
5. **Maintain Tests**: Tests are code - keep them clean and updated

### Testing Pyramid
```
       /\
      /  \     E2E Tests (10%)
     /____\    - Critical user flows
    /      \   - Smoke tests
   /________\  
  /          \ Integration Tests (30%)
 /____________\- API tests
/              \- Component integration
/______________\
                Unit Tests (60%)
                - Functions
                - Components
                - Services
```

---

## 1. Unit Testing

### Purpose
Test individual functions, components, and modules in isolation.

### Frontend Unit Tests (React + TypeScript)

#### Tools
- **Framework**: Vitest (faster than Jest, Vite-native)
- **Testing Library**: React Testing Library
- **Mocking**: vi.mock() from Vitest
- **Coverage**: c8 or vitest coverage

#### What to Test

**Components**:
```typescript
// src/components/__tests__/Header.test.tsx
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'
import { BrowserRouter } from 'react-router-dom'

describe('Header Component', () => {
  it('renders logo and navigation', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    expect(screen.getByText('CodeAnalyst')).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
  
  it('shows user menu when authenticated', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' }
    render(
      <BrowserRouter>
        <Header user={mockUser} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
  
  it('shows login button when not authenticated', () => {
    render(
      <BrowserRouter>
        <Header user={null} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Login')).toBeInTheDocument()
  })
})
```

**Utilities**:
```typescript
// src/utils/__tests__/adoreIno.test.ts
import { AdoreInoAnalyzer } from '../adoreIno'

describe('AdoreInoAnalyzer', () => {
  describe('detectLanguages', () => {
    it('detects JavaScript files', () => {
      const files = [
        { path: 'index.js', content: 'console.log("hello")' },
        { path: 'app.jsx', content: 'export default App' }
      ]
      
      const result = AdoreInoAnalyzer.detectLanguages(files)
      
      expect(result).toContain('JavaScript')
      expect(result).toContain('JSX')
    })
    
    it('detects TypeScript files', () => {
      const files = [
        { path: 'index.ts', content: 'const x: number = 5' }
      ]
      
      const result = AdoreInoAnalyzer.detectLanguages(files)
      
      expect(result).toContain('TypeScript')
    })
  })
  
  describe('calculateComplexity', () => {
    it('calculates cyclomatic complexity', () => {
      const code = `
        function test(x) {
          if (x > 0) {
            return true;
          } else {
            return false;
          }
        }
      `
      
      const complexity = AdoreInoAnalyzer.calculateComplexity(code)
      
      expect(complexity).toBeGreaterThan(1)
    })
  })
})
```

**Services**:
```typescript
// src/services/__tests__/aiService.test.ts
import { createAIService } from '../aiService'
import { vi } from 'vitest'

describe('AIService', () => {
  it('selects correct provider based on settings', () => {
    const service = createAIService({
      provider: 'openai',
      apiKey: 'test-key'
    })
    
    expect(service.provider).toBe('openai')
  })
  
  it('throws error when no API key provided', () => {
    expect(() => {
      createAIService({ provider: 'openai', apiKey: '' })
    }).toThrow('API key required')
  })
  
  it('caches responses correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 'cached' })
    })
    global.fetch = mockFetch
    
    const service = createAIService({
      provider: 'openai',
      apiKey: 'test-key'
    })
    
    await service.analyze('test prompt')
    await service.analyze('test prompt') // Should use cache
    
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
```

**Stores (Zustand)**:
```typescript
// src/stores/__tests__/authStore.test.ts
import { useAuthStore } from '../authStore'
import { act } from '@testing-library/react'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })
  
  it('sets user on login', () => {
    const user = { id: '1', email: 'test@example.com' }
    
    act(() => {
      useAuthStore.getState().login(user, 'token')
    })
    
    expect(useAuthStore.getState().user).toEqual(user)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
  
  it('clears user on logout', () => {
    act(() => {
      useAuthStore.getState().login({ id: '1' }, 'token')
      useAuthStore.getState().logout()
    })
    
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
```

### Backend Unit Tests (Node.js + Express)

#### Tools
- **Framework**: Vitest or Jest
- **Mocking**: Sinon or Jest mocks
- **Database**: Mock with test doubles

#### What to Test

**Services**:
```javascript
// backend/src/services/__tests__/DatabaseService.test.js
import { DatabaseService } from '../DatabaseService'
import { db } from '../../database/connection'

jest.mock('../../database/connection')

describe('DatabaseService', () => {
  describe('getUserByEmail', () => {
    it('returns user when found', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      db.query.mockResolvedValue({ rows: [mockUser] })
      
      const result = await DatabaseService.getUserByEmail('test@example.com')
      
      expect(result).toEqual(mockUser)
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      )
    })
    
    it('returns null when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] })
      
      const result = await DatabaseService.getUserByEmail('notfound@example.com')
      
      expect(result).toBeNull()
    })
  })
})
```

**Utilities**:
```javascript
// backend/src/utils/__tests__/logger.test.js
import { logger } from '../logger'

describe('Logger', () => {
  it('logs info messages', () => {
    const spy = jest.spyOn(console, 'log')
    
    logger.info('Test message')
    
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Test message'))
  })
  
  it('logs errors with stack trace', () => {
    const spy = jest.spyOn(console, 'error')
    const error = new Error('Test error')
    
    logger.error('Error occurred', error)
    
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test error'),
      expect.stringContaining('stack')
    )
  })
})
```

### Coverage Goals
- **Target**: 80% overall coverage
- **Critical Paths**: 100% coverage (auth, payment, data modification)
- **UI Components**: 70% coverage
- **Utilities**: 90% coverage

---

## 2. Integration Testing

### Purpose
Test how different modules work together.

### Frontend Integration Tests

```typescript
// src/__tests__/integration/CodeAnalystFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeAnalyst } from '../../pages/modules/CodeAnalyst'
import { server } from '../../mocks/server'
import { rest } from 'msw'

describe('Code Analyst Integration', () => {
  it('completes full analysis flow', async () => {
    const user = userEvent.setup()
    
    // Mock API responses
    server.use(
      rest.post('/api/code-analysis', (req, res, ctx) => {
        return res(ctx.json({
          id: 'analysis-123',
          status: 'completed',
          qualityScore: 85
        }))
      })
    )
    
    render(<CodeAnalyst />)
    
    // Upload file
    const file = new File(['code content'], 'test.zip', { type: 'application/zip' })
    const input = screen.getByLabelText(/upload/i)
    await user.upload(input, file)
    
    // Start analysis
    const analyzeBtn = screen.getByRole('button', { name: /analyze/i })
    await user.click(analyzeBtn)
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/quality score/i)).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })
})
```

### Backend Integration Tests

```javascript
// backend/src/__tests__/integration/auth.test.js
import request from 'supertest'
import app from '../../index'
import { db } from '../../database/connection'

describe('Authentication Integration', () => {
  beforeAll(async () => {
    await db.query('BEGIN')
  })
  
  afterAll(async () => {
    await db.query('ROLLBACK')
  })
  
  it('registers and logs in user', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User'
      })
      .expect(201)
    
    expect(registerRes.body.success).toBe(true)
    
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      })
      .expect(200)
    
    expect(loginRes.body.token).toBeDefined()
    expect(loginRes.body.user.email).toBe('test@example.com')
  })
  
  it('protects routes with authentication', async () => {
    // Try to access protected route without token
    await request(app)
      .get('/api/projects')
      .expect(401)
    
    // Get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      })
    
    const token = loginRes.body.token
    
    // Access protected route with token
    await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })
})
```

---

## 3. End-to-End (E2E) Testing

### Purpose
Test complete user workflows from browser to database.

### Tools
- **Framework**: Playwright (recommended) or Cypress
- **Why Playwright**: Faster, better TypeScript support, multi-browser

### Critical User Flows to Test

#### 1. User Registration & Login
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to app
    await page.goto('/')
    
    // Click register
    await page.click('text=Sign Up')
    
    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.fill('[name="name"]', 'New User')
    await page.click('button:has-text("Create Account")')
    
    // Should redirect to pending approval
    await expect(page).toHaveURL('/pending-approval')
    await expect(page.locator('text=pending approval')).toBeVisible()
  })
  
  test('user can login with GitHub', async ({ page, context }) => {
    await page.goto('/login')
    
    // Click GitHub login
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.click('text=Login with GitHub')
    ])
    
    // Mock GitHub OAuth (in test environment)
    await popup.waitForLoadState()
    await popup.click('button:has-text("Authorize")')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome')).toBeVisible()
  })
})
```

#### 2. Code Analysis Flow
```typescript
// e2e/code-analysis.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Code Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Test123!')
    await page.click('button:has-text("Login")')
    await page.waitForURL('/dashboard')
  })
  
  test('analyzes uploaded ZIP file', async ({ page }) => {
    // Navigate to Code Analyst
    await page.click('text=AI Code Analyst')
    
    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('./fixtures/test-project.zip')
    
    // Wait for file to be processed
    await expect(page.locator('text=Files uploaded')).toBeVisible()
    
    // Start analysis
    await page.click('button:has-text("Analyze Code")')
    
    // Wait for analysis to complete (with timeout)
    await expect(page.locator('text=Analysis Complete')).toBeVisible({
      timeout: 60000
    })
    
    // Verify results
    await expect(page.locator('text=Code Quality Score')).toBeVisible()
    const score = await page.locator('[data-testid="quality-score"]').textContent()
    expect(parseInt(score!)).toBeGreaterThan(0)
    expect(parseInt(score!)).toBeLessThanOrEqual(100)
  })
  
  test('analyzes GitHub repository', async ({ page }) => {
    await page.click('text=AI Code Analyst')
    
    // Switch to GitHub tab
    await page.click('text=GitHub Repository')
    
    // Enter repo URL
    await page.fill('[name="repoUrl"]', 'https://github.com/facebook/react')
    await page.click('button:has-text("Analyze")')
    
    // Wait for completion
    await expect(page.locator('text=Analysis Complete')).toBeVisible({
      timeout: 120000
    })
    
    // Check report sections
    await expect(page.locator('text=System Overview')).toBeVisible()
    await expect(page.locator('text=Technical Structure')).toBeVisible()
    await expect(page.locator('text=Recommendations')).toBeVisible()
  })
})
```

#### 3. WordPress Integration
```typescript
// e2e/wordpress.spec.ts
import { test, expect } from '@playwright/test'

test.describe('WordPress Integration', () => {
  test('connects WordPress site', async ({ page }) => {
    await page.goto('/settings')
    
    // Generate API key
    await page.click('button:has-text("Generate Key")')
    await expect(page.locator('[data-testid="api-key"]')).toBeVisible()
    
    const apiKey = await page.locator('[data-testid="api-key"]').inputValue()
    expect(apiKey).toHaveLength(32)
    
    // Copy key (simulated - would be used in WordPress plugin)
    await page.click('button:has-text("Copy")')
    
    // Navigate to connected sites
    await page.click('text=View Connected Sites')
    
    // Verify site appears (assuming test site already connected)
    await expect(page.locator('text=test-site.com')).toBeVisible()
  })
})
```

### E2E Test Best Practices
1. **Use data-testid attributes** for stable selectors
2. **Mock external services** (GitHub, AI APIs) in test environment
3. **Use fixtures** for test data
4. **Run in parallel** where possible
5. **Take screenshots** on failure
6. **Record videos** for debugging

---

## 4. API Testing

### Purpose
Test REST API endpoints independently.

### Tools
- **Framework**: Supertest (Node.js)
- **Alternative**: Postman/Newman for CI

### API Test Suite

```javascript
// backend/src/__tests__/api/projects.test.js
import request from 'supertest'
import app from '../../index'

describe('Projects API', () => {
  let authToken
  let projectId
  
  beforeAll(async () => {
    // Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' })
    authToken = res.body.token
  })
  
  describe('POST /api/projects', () => {
    it('creates new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          type: 'github',
          sourceUrl: 'https://github.com/user/repo'
        })
        .expect(201)
      
      expect(res.body.success).toBe(true)
      expect(res.body.project.name).toBe('Test Project')
      projectId = res.body.project.id
    })
    
    it('validates required fields', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
      
      expect(res.body.error).toContain('name')
    })
    
    it('requires authentication', async () => {
      await request(app)
        .post('/api/projects')
        .send({ name: 'Test' })
        .expect(401)
    })
  })
  
  describe('GET /api/projects', () => {
    it('returns user projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
      
      expect(Array.isArray(res.body.projects)).toBe(true)
      expect(res.body.projects.length).toBeGreaterThan(0)
    })
  })
  
  describe('PUT /api/projects/:id', () => {
    it('updates project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Project' })
        .expect(200)
      
      expect(res.body.project.name).toBe('Updated Project')
    })
  })
  
  describe('DELETE /api/projects/:id', () => {
    it('deletes project', async () => {
      await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
      
      // Verify deleted
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
```

### API Contract Testing

```javascript
// Test API contracts match documentation
import { validateResponse } from 'openapi-validator'

test('GET /api/projects matches OpenAPI spec', async () => {
  const res = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${token}`)
  
  const validation = validateResponse(res.body, '/api/projects', 'get')
  expect(validation.valid).toBe(true)
})
```

---

## 5. Performance Testing

### Purpose
Ensure system performs well under load.

### Tools
- **Load Testing**: k6, Artillery
- **Profiling**: Chrome DevTools, React Profiler
- **Monitoring**: Lighthouse CI

### Frontend Performance Tests

```javascript
// lighthouse-ci.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
}
```

### Backend Load Tests

```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const BASE_URL = 'https://api.codeanalyst.com';
  
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'Test123!',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });
  
  const token = loginRes.json('token');
  
  // Get projects
  const projectsRes = http.get(`${BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  check(projectsRes, {
    'projects loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### Performance Benchmarks
- **Page Load**: < 2 seconds (First Contentful Paint)
- **API Response**: < 500ms (95th percentile)
- **Analysis Time**: < 5 minutes for typical project
- **Concurrent Users**: Support 200+ simultaneous users

---

## 6. Security Testing

### Purpose
Identify vulnerabilities and security issues.

### Tools
- **SAST**: ESLint security plugins, Snyk
- **DAST**: OWASP ZAP
- **Dependency Scanning**: npm audit, Snyk
- **Secret Scanning**: GitGuardian, truffleHog

### Security Test Checklist

#### Authentication & Authorization
```javascript
// Security tests
describe('Security - Authentication', () => {
  test('prevents SQL injection in login', async () => {
    const maliciousInput = "admin' OR '1'='1"
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: maliciousInput,
        password: 'anything'
      })
    
    expect(res.status).toBe(401)
    expect(res.body.error).not.toContain('SQL')
  })
  
  test('rate limits login attempts', async () => {
    const attempts = []
    
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      )
    }
    
    const results = await Promise.all(attempts)
    const rateLimited = results.filter(r => r.status === 429)
    
    expect(rateLimited.length).toBeGreaterThan(0)
  })
  
  test('JWT tokens expire', async () => {
    const expiredToken = generateExpiredToken()
    
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${expiredToken}`)
    
    expect(res.status).toBe(401)
  })
})
```

#### Input Validation
```javascript
describe('Security - Input Validation', () => {
  test('sanitizes HTML input', async () => {
    const xssPayload = '<script>alert("XSS")</script>'
    
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: xssPayload })
    
    expect(res.body.project.name).not.toContain('<script>')
  })
  
  test('validates file uploads', async () => {
    const maliciousFile = new File(['<?php system($_GET["cmd"]); ?>'], 'shell.php')
    
    const res = await request(app)
      .post('/api/code-analysis/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', maliciousFile)
    
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('file type')
  })
})
```

### Automated Security Scans

```bash
# Run in CI/CD
npm audit --audit-level=high
snyk test
npm run lint:security
```

---

## 7. Accessibility Testing

### Purpose
Ensure app is usable by people with disabilities.

### Tools
- **Automated**: axe-core, Pa11y
- **Manual**: Screen readers (NVDA, JAWS, VoiceOver)
- **Browser Extensions**: axe DevTools, WAVE

### Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
  
  test('dashboard is keyboard navigable', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(focused)
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter')
    // Verify action occurred
  })
  
  test('forms have proper labels', async ({ page }) => {
    await page.goto('/login')
    
    const emailInput = page.locator('input[type="email"]')
    const label = await emailInput.getAttribute('aria-label') || 
                  await page.locator(`label[for="${await emailInput.getAttribute('id')}"]`).textContent()
    
    expect(label).toBeTruthy()
  })
  
  test('images have alt text', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})
```

### WCAG 2.1 AA Compliance Checklist
- [ ] Color contrast ratio ≥ 4.5:1
- [ ] All interactive elements keyboard accessible
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Headings in logical order
- [ ] ARIA labels where needed
- [ ] Focus indicators visible
- [ ] No keyboard traps

---

## 8. Cross-Browser Testing

### Purpose
Ensure consistent experience across browsers.

### Target Browsers
- **Desktop**: Chrome (latest 2), Firefox (latest 2), Safari (latest 2), Edge (latest)
- **Mobile**: Safari iOS (latest 2), Chrome Android (latest)

### Tools
- **Local**: Playwright (multi-browser)
- **Cloud**: BrowserStack, Sauce Labs

### Cross-Browser Test Suite

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
```

---

## 9. Mobile Responsiveness Testing

### Purpose
Ensure app works on mobile devices.

### Tools
- **Automated**: Playwright mobile emulation
- **Manual**: Real devices, BrowserStack

### Responsive Tests

```typescript
// e2e/responsive.spec.ts
test.describe('Mobile Responsiveness', () => {
  test('dashboard adapts to mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/dashboard')
    
    // Check mobile menu
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Desktop menu should be hidden
    const desktopMenu = page.locator('[data-testid="desktop-menu"]')
    await expect(desktopMenu).not.toBeVisible()
  })
  
  test('forms are usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/login')
    
    // Inputs should be large enough to tap
    const input = page.locator('input[type="email"]')
    const box = await input.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44) // iOS minimum tap target
  })
})
```

---

## 10. Database Testing

### Purpose
Test database operations, migrations, and data integrity.

### Tools
- **Test Database**: PostgreSQL test instance
- **Migrations**: Test migration up/down
- **Seeding**: Test data fixtures

### Database Tests

```javascript
// backend/src/__tests__/database/migrations.test.js
describe('Database Migrations', () => {
  test('migrations run successfully', async () => {
    await db.query('DROP SCHEMA public CASCADE')
    await db.query('CREATE SCHEMA public')
    
    await runMigrations()
    
    // Check tables exist
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    expect(tables.rows.map(r => r.table_name)).toContain('users')
    expect(tables.rows.map(r => r.table_name)).toContain('projects')
  })
  
  test('migrations are reversible', async () => {
    await runMigrations()
    await rollbackMigrations()
    
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    expect(tables.rows.length).toBe(0)
  })
})
```

### Data Integrity Tests

```javascript
describe('Data Integrity', () => {
  test('foreign key constraints work', async () => {
    // Try to create project with invalid user_id
    await expect(
      db.query(`
        INSERT INTO projects (id, user_id, name)
        VALUES (gen_random_uuid(), gen_random_uuid(), 'Test')
      `)
    ).rejects.toThrow('foreign key constraint')
  })
  
  test('unique constraints work', async () => {
    const email = 'duplicate@example.com'
    
    await db.query(`
      INSERT INTO users (id, email, name)
      VALUES (gen_random_uuid(), $1, 'User 1')
    `, [email])
    
    await expect(
      db.query(`
        INSERT INTO users (id, email, name)
        VALUES (gen_random_uuid(), $1, 'User 2')
      `, [email])
    ).rejects.toThrow('unique constraint')
  })
})
```

---

## 11. AI/ML Testing

### Purpose
Test AI integrations and response quality.

### Challenges
- Non-deterministic outputs
- API rate limits
- Cost of testing

### Strategies

#### Mock AI Responses
```typescript
// src/services/__tests__/aiService.test.ts
describe('AI Service', () => {
  test('handles AI provider errors gracefully', async () => {
    // Mock API failure
    server.use(
      rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
        return res(ctx.status(429), ctx.json({ error: 'Rate limit exceeded' }))
      })
    )
    
    const service = createAIService({ provider: 'openai', apiKey: 'test' })
    
    await expect(service.analyze('test')).rejects.toThrow('Rate limit')
  })
  
  test('caches AI responses', async () => {
    const mockResponse = { analysis: 'test result' }
    
    server.use(
      rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
        return res(ctx.json(mockResponse))
      })
    )
    
    const service = createAIService({ provider: 'openai', apiKey: 'test' })
    
    const result1 = await service.analyze('same prompt')
    const result2 = await service.analyze('same prompt')
    
    expect(result1).toEqual(result2)
    // Verify only one API call made
  })
})
```

#### Quality Checks
```typescript
describe('AI Response Quality', () => {
  test('AI response contains required fields', async () => {
    const result = await aiService.analyzeCode(sampleCode)
    
    expect(result).toHaveProperty('qualityScore')
    expect(result).toHaveProperty('recommendations')
    expect(result.qualityScore).toBeGreaterThanOrEqual(0)
    expect(result.qualityScore).toBeLessThanOrEqual(100)
    expect(Array.isArray(result.recommendations)).toBe(true)
  })
  
  test('AI provides actionable recommendations', async () => {
    const result = await aiService.analyzeCode(sampleCode)
    
    result.recommendations.forEach(rec => {
      expect(rec).toHaveProperty('title')
      expect(rec).toHaveProperty('description')
      expect(rec).toHaveProperty('priority')
      expect(rec.title.length).toBeGreaterThan(5)
    })
  })
})
```

---

## 12. WordPress Integration Testing

### Purpose
Test WordPress plugin and API integration.

### Test WordPress Plugin

```php
// wordpress-plugin/tests/test-api.php
class Test_CodeAnalyst_API extends WP_UnitTestCase {
    public function test_connect_endpoint() {
        $request = new WP_REST_Request('POST', '/codeanalyst/v1/connect');
        $request->set_param('api_key', 'test-key-123');
        
        $response = rest_do_request($request);
        
        $this->assertEquals(200, $response->get_status());
        $this->assertTrue($response->get_data()['success']);
    }
    
    public function test_get_pages_endpoint() {
        // Create test page
        $page_id = $this->factory->post->create([
            'post_type' => 'page',
            'post_title' => 'Test Page'
        ]);
        
        $request = new WP_REST_Request('GET', '/codeanalyst/v1/pages');
        $response = rest_do_request($request);
        
        $pages = $response->get_data();
        $this->assertGreaterThan(0, count($pages));
    }
}
```

### Test Backend Integration

```javascript
describe('WordPress Integration', () => {
  test('connects WordPress site', async () => {
    const res = await request(app)
      .post('/api/wordpress/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        siteUrl: 'https://test-site.com',
        apiKey: 'wp-test-key'
      })
      .expect(200)
    
    expect(res.body.success).toBe(true)
    expect(res.body.connection.siteUrl).toBe('https://test-site.com')
  })
  
  test('fetches WordPress pages', async () => {
    const res = await request(app)
      .get('/api/wordpress/pages/connection-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    
    expect(Array.isArray(res.body.pages)).toBe(true)
  })
})
```

---

## 13. User Acceptance Testing (UAT)

### Purpose
Validate system meets user requirements.

### UAT Process

1. **Recruit Testers**: 5-10 representative users
2. **Prepare Scenarios**: Real-world use cases
3. **Conduct Sessions**: Observe users completing tasks
4. **Collect Feedback**: Surveys and interviews
5. **Iterate**: Fix issues and retest

### UAT Test Scenarios

#### Scenario 1: New User Onboarding
```
Goal: New user creates account and runs first analysis

Steps:
1. Navigate to CodeAnalyst
2. Click "Sign Up"
3. Complete registration form
4. Verify email (if implemented)
5. Wait for admin approval
6. Log in after approval
7. Create first project
8. Run code analysis
9. View results

Success Criteria:
- User completes all steps without help
- Time to first analysis < 10 minutes
- User understands results
```

#### Scenario 2: WordPress Site Analysis
```
Goal: Connect WordPress site and analyze theme

Steps:
1. Log in to CodeAnalyst
2. Navigate to Settings
3. Generate WordPress API key
4. Install WordPress plugin
5. Enter API key in plugin
6. Connect site
7. Navigate to Code Analyst
8. Select WordPress theme
9. Run analysis
10. Review recommendations

Success Criteria:
- Connection successful on first try
- Analysis completes without errors
- Recommendations are actionable
```

### UAT Feedback Form

```
User Acceptance Testing Feedback

Scenario: _______________________
Tester: _______________________
Date: _______________________

Task Completion:
[ ] Completed successfully
[ ] Completed with difficulty
[ ] Could not complete

Time to Complete: _____ minutes

Difficulty Rating (1-5): _____

Issues Encountered:
_________________________________
_________________________________

Suggestions for Improvement:
_________________________________
_________________________________

Overall Satisfaction (1-5): _____

Would you use this feature? [ ] Yes [ ] No

Additional Comments:
_________________________________
```

---

## 14. Regression Testing

### Purpose
Ensure new changes don't break existing functionality.

### Strategy
- **Automated**: Run full test suite on every PR
- **Manual**: Test critical paths before release
- **Smoke Tests**: Quick sanity checks

### Regression Test Suite

```typescript
// e2e/regression.spec.ts
test.describe('Regression Tests', () => {
  test('critical user paths still work', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'Test123!')
    await page.click('button:has-text("Login")')
    await expect(page).toHaveURL('/dashboard')
    
    // Create project
    await page.click('text=New Project')
    await page.fill('[name="name"]', 'Regression Test Project')
    await page.click('button:has-text("Create")')
    await expect(page.locator('text=Project created')).toBeVisible()
    
    // Run analysis
    await page.click('text=AI Code Analyst')
    await page.click('button:has-text("Analyze")')
    // ... verify analysis completes
  })
})
```

### Visual Regression Testing

```typescript
// Use Percy or Chromatic
import percySnapshot from '@percy/playwright'

test('homepage looks correct', async ({ page }) => {
  await page.goto('/')
  await percySnapshot(page, 'Homepage')
})
```

---

## 15. Load & Stress Testing

### Purpose
Determine system limits and breaking points.

### Load Test Scenarios

#### Scenario 1: Concurrent Analyses
```javascript
// k6-concurrent-analyses.js
export const options = {
  scenarios: {
    concurrent_analyses: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
    },
  },
}

export default function () {
  const token = login()
  
  const analysisRes = http.post(
    `${BASE_URL}/api/code-analysis`,
    JSON.stringify({
      repoUrl: 'https://github.com/test/repo'
    }),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )
  
  check(analysisRes, {
    'analysis started': (r) => r.status === 202,
  })
  
  sleep(60) // Wait before next analysis
}
```

#### Scenario 2: Database Stress Test
```javascript
// Test database connection pool limits
export const options = {
  stages: [
    { duration: '5m', target: 500 }, // Ramp to 500 users
    { duration: '10m', target: 500 }, // Hold at 500
  ],
}

export default function () {
  const res = http.get(`${BASE_URL}/api/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  
  check(res, {
    'no connection pool errors': (r) => !r.body.includes('connection pool'),
    'response time acceptable': (r) => r.timings.duration < 1000,
  })
}
```

### Stress Test Metrics
- **Target RPS**: 100 requests/second
- **Max Concurrent Users**: 500
- **Database Connections**: Max 20 (Supabase limit)
- **Memory Usage**: < 512MB per instance
- **CPU Usage**: < 80% under load

---

## 16. Monitoring & Observability

### Purpose
Detect issues in production.

### Tools
- **APM**: New Relic, Datadog
- **Logging**: Winston, Sentry
- **Uptime**: UptimeRobot, Pingdom
- **Metrics**: Prometheus, Grafana

### Key Metrics to Monitor

```javascript
// Backend monitoring
import { metrics } from './monitoring'

// Track request duration
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    metrics.httpRequestDuration.observe(
      { method: req.method, route: req.route?.path, status: res.statusCode },
      duration
    )
  })
  
  next()
})

// Track AI API usage
async function callAI(prompt) {
  const start = Date.now()
  
  try {
    const result = await openai.chat.completions.create(...)
    
    metrics.aiApiCalls.inc({ provider: 'openai', status: 'success' })
    metrics.aiTokensUsed.inc({ provider: 'openai' }, result.usage.total_tokens)
    
    return result
  } catch (error) {
    metrics.aiApiCalls.inc({ provider: 'openai', status: 'error' })
    throw error
  } finally {
    metrics.aiApiDuration.observe({ provider: 'openai' }, Date.now() - start)
  }
}
```

### Alerts to Set Up
- **Error Rate**: > 1% errors
- **Response Time**: p95 > 1 second
- **Uptime**: < 99.9%
- **Database Connections**: > 80% of pool
- **Disk Space**: > 80% full
- **Memory Usage**: > 90%

---

## 17. Test Automation CI/CD

### Purpose
Run tests automatically on every code change.

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
  
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://staging.codeanalyst.com
          uploadArtifacts: true
```

---

## Testing Tools & Setup

### Installation

```bash
# Frontend testing
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom

# E2E testing
npm install --save-dev @playwright/test

# API testing
npm install --save-dev supertest

# Load testing
npm install -g k6

# Security
npm install --save-dev snyk

# Accessibility
npm install --save-dev @axe-core/playwright
```

### Configuration Files

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
})
```

#### playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Test Coverage Goals

### Overall Targets
- **Unit Tests**: 80% coverage
- **Integration Tests**: 70% coverage of critical paths
- **E2E Tests**: 100% coverage of user flows
- **API Tests**: 100% coverage of endpoints

### Module-Specific Targets

| Module | Unit | Integration | E2E |
|--------|------|-------------|-----|
| Authentication | 90% | 100% | 100% |
| Code Analyst | 80% | 80% | 100% |
| Website Analyst | 80% | 80% | 100% |
| Content Analyst | 75% | 70% | 90% |
| Auto Programmer | 85% | 80% | 100% |
| Content Creator | 75% | 70% | 90% |
| WordPress Integration | 80% | 90% | 100% |
| User Management | 90% | 100% | 100% |
| Settings | 70% | 70% | 80% |

---

## Testing Schedule

### Pre-MVP
- **Week 1-2**: Set up testing infrastructure
- **Week 3-4**: Write unit tests for critical modules
- **Week 5-6**: Integration tests for API
- **Week 7-8**: E2E tests for main flows
- **Week 9**: Performance and security testing
- **Week 10**: UAT with beta users

### Post-MVP
- **Daily**: Run unit + integration tests on CI
- **Weekly**: Full E2E test suite
- **Monthly**: Load testing, security scans
- **Quarterly**: Comprehensive UAT

---

## Conclusion

This comprehensive testing strategy ensures CodeAnalyst is:
- **Reliable**: Catches bugs before production
- **Performant**: Meets speed requirements
- **Secure**: Protects user data
- **Accessible**: Usable by everyone
- **Maintainable**: Tests document expected behavior

**Next Steps**:
1. Set up testing infrastructure (Vitest, Playwright)
2. Write tests for authentication module (highest priority)
3. Implement CI/CD pipeline with automated tests
4. Gradually increase coverage to target levels
5. Conduct UAT before MVP launch

---

*This testing strategy should be reviewed and updated as the system evolves and new testing needs are identified.*

