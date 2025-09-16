# CodeAnalyst Backend

A powerful Node.js backend service for AI-powered website and code analysis. Supports URL scanning, GitHub repository analysis, and ZIP file uploads with comprehensive AI insights.

## 🚀 Features

### Analysis Types
- **🌐 URL Analysis**: Real website scanning with Lighthouse, Pa11y, and Wappalyzer
- **📂 GitHub Repository Analysis**: Clone and analyze public/private repositories
- **📦 ZIP File Analysis**: Upload and analyze code archives

### Technical Capabilities
- **Real Website Scraping**: Puppeteer-based content extraction
- **Performance Analysis**: Lighthouse integration for Core Web Vitals
- **Accessibility Testing**: Pa11y-powered WCAG compliance checking
- **Security Analysis**: Headers analysis and vulnerability detection
- **Technology Detection**: Wappalyzer stack identification
- **AI Integration**: OpenAI, Anthropic Claude, and Google Gemini support
- **Background Processing**: Redis-based job queues with Bull
- **Database Storage**: PostgreSQL for persistent analysis results

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **Queue**: Redis + Bull
- **Analysis Tools**: Puppeteer, Lighthouse, Pa11y, Wappalyzer
- **AI Services**: OpenAI, Anthropic, Google AI
- **Authentication**: JWT
- **File Processing**: Multer, JSZip

## 📦 Installation

### Prerequisites

1. **Node.js 18+ and npm**
```bash
node --version  # Should be 18+
npm --version
```

2. **PostgreSQL 14+**
```bash
# macOS (via Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-14

# Create database
createdb codeanalyst
```

3. **Redis 6+**
```bash
# macOS (via Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
```

### Setup

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Environment configuration**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/codeanalyst

# AI API Keys (at least one required)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub (for repository analysis)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-token

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

3. **Database setup**
```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start

# Worker process only
npm run worker
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│  Express API    │────│   Database      │
│   (React)       │    │   (Routes)      │    │ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Job Queues     │────│  Worker Process │
                       │   (Redis)       │    │  (Background)   │
                       └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                               ┌─────────────────────────────────────────┐
                               │            Analysis Services            │
                               │  • WebsiteAnalyzer (Puppeteer+Tools)   │
                               │  • GitHubService (Repository cloning)  │
                               │  • ZipService (File extraction)        │
                               │  • CodeAnalyzer (Static analysis)      │
                               │  • AIAnalysisService (AI integration)  │
                               └─────────────────────────────────────────┘
```

## 📚 API Documentation

### Authentication
All analysis endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

### URL Analysis

**Start URL Analysis**
```http
POST /api/url-analysis/analyze
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "aiProfile": "mixed",
    "includeScreenshots": false,
    "deepAnalysis": true
  }
}
```

**Check Analysis Status**
```http
GET /api/url-analysis/status/{analysisId}
```

**Get Results**
```http
GET /api/url-analysis/result/{analysisId}
```

### GitHub Repository Analysis

**Analyze Repository**
```http
POST /api/code-analysis/github
Content-Type: application/json

{
  "repoUrl": "https://github.com/owner/repository",
  "branch": "main",
  "options": {
    "aiProfile": "technical",
    "includeTests": true,
    "runSecurityScan": true
  }
}
```

### ZIP File Analysis

**Upload and Analyze**
```http
POST /api/code-analysis/zip
Content-Type: multipart/form-data

zipFile: [file]
options[aiProfile]: "mixed"
```

## 🔧 Configuration

### AI Providers

The system supports multiple AI providers with automatic fallback:

```javascript
// Priority order: OpenAI → Anthropic → Google
const providers = {
  openai: {
    models: ['gpt-4', 'gpt-3.5-turbo'],
    maxTokens: 4000
  },
  anthropic: {
    models: ['claude-3-sonnet', 'claude-3-haiku'],
    maxTokens: 4000
  },
  google: {
    models: ['gemini-pro'],
    maxTokens: 3000
  }
}
```

### Analysis Options

```javascript
{
  // AI personality for analysis
  aiProfile: 'technical' | 'business' | 'mixed',
  
  // Website analysis
  includeScreenshots: boolean,
  deepAnalysis: boolean,
  includeLighthouse: boolean,
  
  // Code analysis
  includeTests: boolean,
  runSecurityScan: boolean,
  calculateComplexity: boolean
}
```

## 🚀 Deployment

### Docker

```dockerfile
# Build image
docker build -t codeanalyst-backend .

# Run with environment
docker run -p 3001:3001 --env-file .env codeanalyst-backend
```

### Production Setup

1. **Database optimization**
```sql
-- Recommended PostgreSQL settings
shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

2. **Redis configuration**
```
maxmemory 1gb
maxmemory-policy allkeys-lru
```

3. **Process management**
```bash
# Use PM2 for production
npm install -g pm2

# Start API server
pm2 start npm --name "codeanalyst-api" -- start

# Start worker process
pm2 start npm --name "codeanalyst-worker" -- run worker
```

## 📊 Monitoring

### Health Check
```http
GET /health
```

### Queue Statistics
```http
GET /api/admin/queue-stats
```

### Logs
```bash
# View logs in development
npm run dev

# Production logs (with PM2)
pm2 logs codeanalyst-api
pm2 logs codeanalyst-worker
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Test specific analysis type
npm run test:url-analysis
npm run test:github-analysis
npm run test:zip-analysis
```

## 🔒 Security

### Environment Variables
- Never commit `.env` files
- Use strong JWT secrets (32+ characters)
- Rotate API keys regularly

### Rate Limiting
- 100 requests per 15 minutes per IP
- 10 analyses per hour for free users
- Custom limits for enterprise users

### File Upload Security
- ZIP files only for code analysis
- 100MB size limit
- Virus scanning (optional)
- Automatic cleanup after processing

## 🐛 Troubleshooting

### Common Issues

**Database connection failed**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Reset database
dropdb codeanalyst && createdb codeanalyst
npm run db:migrate
```

**Redis connection failed**
```bash
# Check Redis status
redis-cli ping

# Clear Redis cache
redis-cli flushall
```

**Puppeteer issues**
```bash
# Install missing dependencies (Linux)
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libcairo-gobject2
```

**Analysis stuck in queue**
```bash
# Check worker status
pm2 status codeanalyst-worker

# Restart workers
pm2 restart codeanalyst-worker
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.codeanalyst.ai](https://docs.codeanalyst.ai)
- **Issues**: [GitHub Issues](https://github.com/your-org/codeanalyst/issues)
- **Email**: support@codeanalyst.ai

---

Built with ❤️ by the CodeAnalyst Team // Force deploy latest Tue Aug 26 12:42:36 EEST 2025
