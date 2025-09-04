# CodeAnalyst - Technology Stack

## Overview
CodeAnalyst is a comprehensive AI-powered website and code analysis platform built with modern web technologies and cloud-native architecture.

## Frontend Stack

### Core Framework
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite 4.5.3** - Fast build tool and development server

### State Management & Routing
- **Zustand 4.4.1** - Lightweight state management
- **React Router DOM 6.15.0** - Client-side routing
- **React Query 3.39.3** - Server state management and caching

### UI & Styling
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **Tailwind Animate** - Animation utilities
- **Heroicons/React** - Beautiful SVG icons
- **Lucide React** - Additional icon library
- **Class Variance Authority** - Variant-based component styling

### Forms & Interactions
- **React Hook Form 7.45.4** - Performant forms with validation
- **React Dropzone 14.2.3** - File upload components
- **React Hot Toast 2.4.1** - Toast notifications

### Document Processing
- **jsPDF 3.0.1** - PDF generation
- **html2canvas 1.4.1** - HTML to canvas conversion
- **JSZip 3.10.1** - ZIP file handling

### HTTP & API
- **Axios 1.5.0** - HTTP client
- **AI SDK OpenAI 2.0.19** - OpenAI integration
- **AI SDK 5.0.22** - Multi-provider AI integration

## Backend Stack

### Core Runtime & Framework
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **ES Modules** - Modern JavaScript module system

### Database & Caching
- **PostgreSQL** - Primary relational database
- **Redis 4.6.10** - Caching and job queue storage
- **pg 8.11.3** - PostgreSQL client for Node.js

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
- **bcryptjs 2.4.3** - Password hashing
- **Helmet 7.1.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing
- **Express Rate Limit 7.1.5** - API rate limiting
- **Express Validator 7.0.1** - Input validation

### AI Service Integration
- **OpenAI 4.104.0** - GPT models integration
- **Anthropic AI SDK 0.9.1** - Claude models integration
- **Google AI GenerativeLanguage 2.5.0** - Gemini integration

### Web Analysis Tools
- **Puppeteer 23.10.4** - Headless Chrome automation
- **Playwright 1.40.1** - Cross-browser automation
- **Lighthouse 12.8.1** - Performance auditing
- **Pa11y 8.0.0** - Accessibility testing
- **Cheerio 1.1.2** - Server-side HTML parsing
- **jsdom 26.1.0** - DOM implementation
- **Axe Core 4.8.3** - Accessibility testing engine

### Job Processing & Queues
- **Bull 4.12.2** - Redis-based job queue
- **Node Cron 3.0.3** - Scheduled task execution

### File Processing
- **Multer 1.4.5** - File upload handling
- **JSZip 3.10.1** - ZIP file processing
- **UUID 9.0.1** - Unique identifier generation

### Utilities & Logging
- **Winston 3.11.0** - Logging framework
- **Morgan 1.10.0** - HTTP request logger
- **Compression 1.7.4** - Response compression
- **dotenv 16.3.1** - Environment variable management
- **node-fetch 3.3.2** - HTTP client

## Database Schema

### PostgreSQL Tables
- **users** - User accounts and authentication
- **projects** - User projects and repositories
- **url_analyses** - Website analysis results
- **code_analyses** - Code repository analysis results
- **ai_response_cache** - AI response caching for performance
- **api_usage_logs** - API usage tracking and billing
- **analysis_history** - Historical analysis comparisons

### Key Features
- UUID primary keys for security
- JSONB columns for flexible data storage
- Automatic timestamp triggers
- Comprehensive indexing for performance
- Foreign key constraints for data integrity

## Development Tools

### Frontend Development
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### Backend Development
- **Nodemon** - Development auto-restart
- **Jest** - Testing framework
- **Supertest** - HTTP testing
- **ESLint** - Code linting

## Deployment & Infrastructure

### Current Deployment
- **Frontend**: Vercel (https://analyst-psi.vercel.app)
- **Backend**: Local development with ngrok tunnel
- **Database**: Local PostgreSQL instance
- **Cache**: Local Redis instance

### Production Requirements
- **Node.js 18+** runtime environment
- **PostgreSQL 12+** database server
- **Redis 6+** cache server
- **Minimum 4GB RAM** for AI processing
- **SSD storage** for database performance
- **SSL/TLS certificates** for HTTPS

## API Integration

### AI Providers
- **OpenAI GPT-4** - Code and content analysis
- **Anthropic Claude** - Alternative AI analysis
- **Google Gemini** - Ready for integration

### External Services
- **GitHub API** - Repository access and analysis
- **Chrome DevTools** - Performance metrics
- **Accessibility APIs** - WCAG compliance testing

## File Formats Supported

### Code Analysis
- JavaScript/TypeScript, Python, Java, C/C++, C#
- PHP, Ruby, Go, Rust, Swift, Kotlin
- HTML, CSS, YAML, JSON, Markdown

### Upload Formats
- ZIP archives (up to 100MB)
- GitHub repositories
- Direct URL analysis

## Performance Characteristics

### Response Times
- **Website Analysis**: 30-60 seconds
- **Code Analysis**: 60-180 seconds (depending on codebase size)
- **AI Processing**: 5-30 seconds per analysis step

### Scalability
- **Concurrent Analyses**: 5 simultaneous jobs
- **Rate Limiting**: 100 requests per 15 minutes
- **Database**: Optimized for thousands of analyses
- **Caching**: 24-hour AI response cache

## Security Features

### Authentication
- JWT-based session management
- GitHub OAuth integration
- Secure password hashing (bcrypt)

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- Rate limiting and DDoS protection

### API Security
- CORS configuration
- Helmet security headers
- Environment variable protection
- Secure file upload handling

