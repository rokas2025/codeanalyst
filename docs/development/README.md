# 🛠️ Development Setup

Complete guide for setting up CodeAnalyst development environment.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 8+ (comes with Node.js)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

### Optional (for full setup)
- **PostgreSQL**: Version 14+ (or use cloud database)
- **Redis**: Latest version (or use cloud Redis)
- **Docker**: For containerized development

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

## 🚀 Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/rokas2025/codeanalyst.git
cd codeanalyst
```

### 2. Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Frontend Environment (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_FRONTEND_URL=http://localhost:3000

# AI Provider API Keys (optional for development)
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
VITE_GOOGLE_AI_API_KEY=your-google-ai-key
```

#### Backend Environment (backend/.env)
```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database (optional for basic development)
DATABASE_URL=postgresql://user:password@localhost:5432/codeanalyst

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-for-development
JWT_EXPIRES_IN=7d

# AI Provider Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub OAuth (create GitHub OAuth app)
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### 4. Start Development Servers

#### Option A: Manual Start (Recommended for Development)
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
npm run dev

# Optional Terminal 3: Start ngrok for external access
ngrok http 3001
```

#### Option B: Quick Setup Script (Windows)
```bash
# Run the automated setup script
.\deploy-setup.ps1
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🏗️ Project Structure

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main app layout
│   ├── Header.tsx      # Navigation header
│   ├── Sidebar.tsx     # Navigation sidebar
│   └── reports/        # Analysis result components
├── pages/              # Page components
│   ├── modules/        # AI module pages
│   │   ├── WebsiteAnalyst.tsx
│   │   ├── CodeAnalyst.tsx
│   │   └── ...
│   ├── Dashboard.tsx   # Main dashboard
│   └── Settings.tsx    # User settings
├── services/           # API communication layer
│   ├── backendService.ts
│   ├── aiService.ts
│   └── githubService.ts
├── stores/             # Zustand state management
│   ├── authStore.ts
│   └── settingsStore.ts
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
└── test/               # Test files
```

### Backend Structure
```
backend/src/
├── routes/             # API route handlers
│   ├── auth.js        # Authentication routes
│   ├── urlAnalysis.js # Website analysis endpoints
│   └── codeAnalysis.js # Code analysis endpoints
├── services/           # Business logic layer
│   ├── WebsiteAnalyzer.js    # Website analysis engine
│   ├── CodeAnalyzer.js       # Code analysis engine
│   ├── AIAnalysisService.js  # AI integration
│   └── GitHubService.js      # GitHub API wrapper
├── middleware/         # Express middleware
│   ├── auth.js        # JWT authentication
│   └── errorHandler.js # Error handling
├── workers/            # Background job processors
└── utils/              # Utility functions
```

## 🧪 Testing

### Frontend Testing
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Backend Testing
```bash
cd backend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Test Files Organization
```
src/test/
├── components/         # Component tests
├── services/          # Service tests
├── utils/             # Utility tests
├── setup.ts           # Test configuration
└── mocks/             # Mock data and functions
```

## 🔧 Development Tools

### Code Quality Tools
```bash
# ESLint - JavaScript/TypeScript linting
npm run lint
npm run lint:fix

# Prettier - Code formatting
npm run format

# TypeScript - Type checking
npm run type-check
```

### Build Tools
```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build with Vercel configuration
npm run build:vercel
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx,ts,tsx",
    "lint:fix": "eslint . --ext js,jsx,ts,tsx --fix",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## 🐛 Debugging

### Frontend Debugging
```typescript
// Enable debug logging
localStorage.setItem('debug', 'codeanalyst:*')

// React DevTools
// Install React Developer Tools browser extension

// Network debugging
// Use browser DevTools Network tab to monitor API calls
```

### Backend Debugging
```javascript
// Enable debug logging
DEBUG=codeanalyst:* npm run dev

// Database query logging
DEBUG=db:* npm run dev

// Full debug output
DEBUG=* npm run dev
```

### VS Code Debug Configuration
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## 🔄 Common Development Workflows

### Adding a New Feature
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Implement Feature**
   - Add frontend components in `src/components/` or `src/pages/`
   - Add backend routes in `backend/src/routes/`
   - Add services in respective `services/` directories

3. **Add Tests**
   - Write unit tests for new components/services
   - Add integration tests for API endpoints
   - Ensure test coverage meets requirements

4. **Update Documentation**
   - Update API documentation in `docs/api/`
   - Update user documentation if user-facing
   - Add code comments and JSDoc

5. **Test & Review**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

### Database Development
```bash
# Run migrations
cd backend
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database
npm run db:reset
```

### API Development
```bash
# Test API endpoints
curl -X GET http://localhost:3001/health

# Use Postman collection (included in project)
# Import: docs/api/CodeAnalyst.postman_collection.json
```

## 🚀 Performance Optimization

### Frontend Performance
```typescript
// Code splitting
const LazyComponent = lazy(() => import('./Component'))

// Memoization
const MemoizedComponent = memo(Component)

// Bundle analysis
npm run build
npm run analyze
```

### Backend Performance
```javascript
// Connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000
})

// Caching
const cache = new Map()
const getCachedResult = (key) => cache.get(key)
```

## 🔧 Environment-Specific Configuration

### Development
- Hot reload enabled
- Source maps included
- Detailed error messages
- Debug logging enabled

### Staging
- Production build with source maps
- Limited logging
- Real database connections
- SSL enforcement

### Production
- Optimized builds
- Error tracking
- Performance monitoring
- Security headers

---

**Next**: [Code Standards](./code-standards.md) | [API Documentation](../api/README.md)
