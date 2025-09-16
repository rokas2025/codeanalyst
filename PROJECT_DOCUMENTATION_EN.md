# CodeAnalyst - AI-Powered Website & Code Analysis Platform

## Project Overview

CodeAnalyst is a comprehensive AI-powered analysis platform designed for SMEs to analyze, optimize, and maintain their websites and code repositories. The platform provides real-time insights using multiple AI providers and advanced analysis tools.

**Current Status**: DEVELOPMENT/TESTING PHASE
**Deployment**: Vercel (Frontend) + Local Backend with ngrok
**Frontend URL**: https://analyst-psi.vercel.app
**Backend**: Local development server with ngrok tunnel

## Architecture

### Frontend Stack
- React 18 with TypeScript
- Vite build system
- React Router for navigation
- Zustand for state management
- Tailwind CSS for styling
- Heroicons for icons
- React Hot Toast for notifications
- PDF export functionality (jsPDF + html2canvas)

### Backend Stack
- Node.js 18+ with Express.js
- PostgreSQL database
- Redis for caching and job queues
- JWT authentication
- Bull job queuing system
- Puppeteer for web scraping
- Lighthouse for performance analysis
- Pa11y for accessibility testing

### AI Integration
- OpenAI (GPT-4) - User selectable option
- Anthropic Claude - User selectable option
- Google Gemini (integration ready, not implemented)
- Response caching system
- User can choose AI provider

## Core Modules

### 1. AI Code Analyst
**Status**: FULLY FUNCTIONAL

**What it does**:
- Analyzes GitHub repositories and ZIP files
- Performs deep structural analysis of codebases
- Detects frameworks and technology stacks
- Identifies security vulnerabilities
- Calculates code quality metrics
- Assesses technical debt
- Provides AI-powered improvement recommendations

**How it works**:
- GitHub repository cloning via API
- File content analysis using regex patterns
- Dependency graph construction
- Security pattern matching
- AI analysis using structured prompts
- Comprehensive scoring system

**Supported Languages**: JavaScript, TypeScript, Python, Java, C/C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, HTML, CSS, YAML, JSON

### 2. AI Website Analyst
**Status**: FULLY FUNCTIONAL

**What it does**:
- Comprehensive website performance analysis
- SEO optimization recommendations
- Accessibility testing (WCAG compliance)
- Security headers analysis
- Technology stack detection
- Core Web Vitals measurement

**How it works**:
- Puppeteer-based content extraction
- Lighthouse performance auditing
- Pa11y accessibility scanning
- Wappalyzer technology detection
- Multi-dimensional scoring system
- AI-generated optimization insights

**Analysis Areas**:
- Performance (Core Web Vitals, loading speed)
- SEO (meta tags, content quality, technical SEO)
- Accessibility (WCAG compliance, screen reader compatibility)
- Security (headers, SSL, vulnerabilities)
- User Experience (mobile responsiveness, navigation)

### 3. AI Content Analyst
**Status**: FUNCTIONAL (Basic Implementation)

**What it does**:
- Content quality assessment
- Grammar and readability analysis
- SEO content optimization
- Keyword density analysis
- Content structure evaluation

### 4. AI Auto Programmer
**Status**: FULLY FUNCTIONAL

**What it does**:
- Chat-based feature requests
- Automatic code generation
- GitHub repository integration
- File structure analysis
- Interactive AI coding assistant

**How it works**:
- Real-time chat interface
- GitHub repository selection
- File content fetching via API
- AI-powered code suggestions
- Context-aware programming assistance

### 5. AI Content Creator
**Status**: FUNCTIONAL (Basic Implementation)

**What it does**:
- SEO-optimized content generation
- Multilingual content support
- Content structure templates
- Marketing copy creation

## Authentication & Security

### GitHub OAuth Integration
**Status**: FULLY FUNCTIONAL

**Features**:
- GitHub OAuth 2.0 authentication
- User avatar display
- Repository access permissions
- Secure JWT token management
- Real user profile data (name, email, avatar)

**Security Measures**:
- JWT token validation
- CORS protection
- Rate limiting
- Secure header configuration
- Environment variable protection

## Database Schema

### Core Tables
- **users**: User accounts and GitHub integration
- **analyses**: Analysis results and metadata
- **website_analyses**: Website-specific analysis data
- **ai_responses**: Cached AI responses for performance
- **repositories**: GitHub repository metadata

### Data Flow
1. User authenticates via GitHub OAuth
2. Analysis requests queued via Redis/Bull
3. Results stored in PostgreSQL
4. AI responses cached for efficiency
5. Real-time updates via WebSocket (planned)

## Analysis Process

### Website Analysis Flow
1. URL validation and normalization
2. Parallel execution of analysis tools:
   - Puppeteer content extraction
   - Lighthouse performance audit
   - Pa11y accessibility scan
   - Security headers analysis
   - Technology detection
3. AI analysis of collected data
4. Score calculation and recommendation generation
5. Result storage and user notification

### Code Analysis Flow
1. Repository access (GitHub API or ZIP upload)
2. File system scanning and filtering
3. Content analysis by file type:
   - Framework detection
   - Security vulnerability scanning
   - Code quality assessment
   - Dependency analysis
4. AI-powered insights generation
5. Technical debt calculation
6. Business impact assessment

## AI Analysis Engine

### Multi-Provider Support
- OpenAI GPT-4 (user selectable)
- Anthropic Claude (user selectable)
- Google Gemini (not implemented)
- User chooses preferred provider
- Response caching for performance

### Analysis Types
- Technical analysis (code quality, performance, security)
- Business analysis (user experience, conversion optimization)
- Mixed analysis (comprehensive insights)
- Custom analysis profiles

### Prompt Engineering
- Structured prompts for consistent results
- Context-aware analysis requests
- Domain-specific optimization
- Result validation and formatting

## Performance Features

### Caching System
- AI response caching (Redis)
- Database query optimization
- Static asset optimization
- CDN integration (Vercel)

### Background Processing
- Redis job queues
- Asynchronous analysis execution
- Progress tracking
- Error handling and retry logic

## Export & Reporting

### PDF Export
**Status**: FULLY FUNCTIONAL
- Professional report generation
- Chart and graph inclusion
- Custom branding support
- High-quality formatting

### Data Formats
- JSON export for API integration
- CSV export for spreadsheet analysis
- PDF reports for presentations
- Real-time dashboard views

## Deployment Architecture

### Frontend (Vercel)
- Automatic deployments from Git
- Global CDN distribution
- Environment variable management
- Custom domain support

### Backend (Local + ngrok)
- Local development server
- ngrok tunnel for external access
- PostgreSQL database
- Redis cache and queues

### Configuration
- Environment-based settings
- API key management
- Database connection pooling
- CORS and security headers

## Current Limitations

1. **Backend Hosting**: Currently local development setup, requires cloud deployment for production scale
2. **Real-time Updates**: WebSocket implementation planned but not yet implemented
3. **Google Gemini**: Integration ready but not fully implemented
4. **Advanced Analytics**: Dashboard metrics and historical analysis trends planned
5. **Multi-language Support**: UI currently English-only

## Recent Achievements

1. ✅ Successful Vercel deployment with proper routing
2. ✅ GitHub OAuth integration with avatar support
3. ✅ ngrok integration for local backend access
4. ✅ Comprehensive AI analysis modules
5. ✅ Professional PDF export functionality
6. ✅ Real-time error handling and user feedback
7. ✅ Responsive UI design
8. ✅ Background job processing
9. ✅ Multi-provider AI integration
10. ✅ Secure authentication flow

## Technology Strengths

### Code Quality
- TypeScript for type safety
- Comprehensive error boundaries
- Structured logging system
- Professional UI/UX design
- Mobile-responsive layout

### Scalability
- Modular architecture
- Database connection pooling
- Caching layers
- Background job processing
- API-first design

### Reliability
- Error handling throughout
- Fallback systems for AI failures
- Data validation and sanitization
- Secure authentication
- Performance monitoring

 