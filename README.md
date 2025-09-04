# 🚀 CodeAnalyst - AI-Powered Website Analysis Platform

A comprehensive website analysis tool powered by AI that provides technical insights, SEO analysis, performance metrics, and business recommendations.

## ✨ Features

- 🌐 **Website Analysis**: Comprehensive technical analysis of any website
- 🤖 **AI Integration**: OpenAI, Anthropic Claude, and Google Gemini support
- 📊 **Performance Metrics**: Lighthouse, accessibility, and SEO analysis
- 🔍 **Code Analysis**: GitHub repository and ZIP file analysis
- 📈 **Business Insights**: Actionable recommendations for improvement
- 🔐 **GitHub OAuth**: Secure authentication and repository access
- 📱 **Modern UI**: Clean, responsive interface built with React + Tailwind

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for fast development and building
- **Zustand** for state management
- **React Query** for data fetching

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **Redis** for job queues
- **Puppeteer** for browser automation
- **Lighthouse** for performance analysis
- **AI APIs** for intelligent insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (optional for development)
- Redis (optional for development)
- ngrok account with API key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/codeanalyst.git
cd codeanalyst
```

### 2. Setup Backend
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
```

### 3. Setup Frontend
```bash
npm install
```

### 4. Run Development Setup
```powershell
# On Windows
.\deploy-setup.ps1

# Or manually:
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: ngrok tunnel
ngrok http 3001

# Terminal 3: Frontend
npm run dev
```

## 🌐 Deployment

### Option 1: Vercel + VM Backend (Recommended)
1. **Backend on VM**: Use ngrok tunnel for public access
2. **Frontend on Vercel**: Automatic deployment from GitHub

```bash
# Deploy frontend to Vercel
vercel --prod

# Set environment variables
VITE_API_URL=https://your-ngrok-url.ngrok-free.app/api
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Option 2: Full Cloud Deployment
- **Frontend**: Vercel
- **Backend**: Railway.app or Render.com
- **Database**: Supabase or managed PostgreSQL

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_FRONTEND_URL=http://localhost:3000
```

#### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/codeanalyst

# AI APIs
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

## 📝 API Documentation

### Main Endpoints
- `GET /api/health` - Health check
- `POST /api/url-analysis/analyze` - Analyze website
- `POST /api/code-analysis/github` - Analyze GitHub repo
- `POST /api/code-analysis/zip` - Analyze ZIP file
- `GET /api/auth/github` - GitHub OAuth login

### Analysis Features
- **Technical Analysis**: Performance, accessibility, SEO
- **AI Insights**: Intelligent recommendations and explanations
- **Security Scan**: Headers, vulnerabilities, best practices
- **Code Quality**: Complexity, maintainability, test coverage
- **Business Impact**: ROI analysis, improvement priorities

## 🧪 Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd backend
npm run test

# Coverage
npm run test:coverage
```

## 📊 Technology Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Zustand
- React Query
- Lucide Icons

### Backend
- Node.js
- Express
- PostgreSQL
- Redis
- Puppeteer
- Lighthouse
- OpenAI/Anthropic/Google AI

### DevOps
- Vercel (Frontend)
- ngrok (Development tunneling)
- GitHub Actions (CI/CD)
- Docker (Optional)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./PROJECT_DOCUMENTATION_EN.md)
- 🚀 [Deployment Guide](./VM-DEPLOYMENT-GUIDE.md)
- 🐛 [Issues](https://github.com/your-username/codeanalyst/issues)
- 💬 [Discussions](https://github.com/your-username/codeanalyst/discussions)

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] API rate limiting dashboard
- [ ] Scheduled analysis reports
- [ ] Team collaboration features
- [ ] Custom analysis profiles
- [ ] Webhook integrations
- [ ] Mobile app

---

Made with ❤️ by [Your Name](https://github.com/your-username)