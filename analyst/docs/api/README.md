# 🔌 API Documentation

CodeAnalyst Backend API provides comprehensive endpoints for website analysis, code analysis, authentication, and AI-powered insights.

## 🏗️ API Architecture

### Base URL
- **Production**: `https://codeanalyst-production.up.railway.app/api`
- **Development**: `http://localhost:3001/api`

### Authentication
- **Type**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 7 days (configurable)

### Response Format
```json
{
  "success": boolean,
  "data": object | array,
  "error": string | null,
  "meta": {
    "timestamp": "ISO 8601",
    "version": "1.0.0"
  }
}
```

## 🔐 Authentication Endpoints

### GitHub OAuth Flow

#### `GET /auth/github`
Initiate GitHub OAuth login flow.

**Response:**
```json
{
  "success": true,
  "authUrl": "https://github.com/login/oauth/authorize?...",
  "state": "random-state-string"
}
```

#### `POST /auth/github/callback`
Handle GitHub OAuth callback.

**Request Body:**
```json
{
  "code": "github-oauth-code",
  "state": "random-state-string"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "githubUsername": "username",
    "avatarUrl": "https://avatars.githubusercontent.com/...",
    "plan": "free"
  }
}
```

#### `GET /auth/github/repos`
Get user's GitHub repositories.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "repositories": [
    {
      "id": 123456,
      "name": "repo-name",
      "full_name": "owner/repo-name",
      "private": false,
      "description": "Repository description",
      "language": "TypeScript",
      "stargazers_count": 42,
      "forks_count": 8,
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🌐 Website Analysis Endpoints

### `POST /url-analysis/analyze`
Start website analysis for a given URL.

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "aiProfile": "mixed", // "technical", "business", "mixed"
    "includeAI": true,
    "deepAnalysis": true,
    "includeScreenshots": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "uuid-analysis-id",
  "message": "Analysis started successfully"
}
```

### `GET /url-analysis/:analysisId`
Get website analysis results.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis-id",
    "url": "https://example.com",
    "status": "completed", // "pending", "processing", "completed", "failed"
    "progress": 100,
    "results": {
      "scores": {
        "overall": 85,
        "performance": 90,
        "seo": 80,
        "accessibility": 85,
        "security": 88
      },
      "metrics": {
        "loadTime": 1.2,
        "fcp": 0.8,
        "lcp": 1.5,
        "cls": 0.05
      },
      "technologies": ["React", "Webpack"],
      "seo": {
        "title": "Good",
        "description": "Optimized",
        "headings": "Well structured"
      },
      "aiInsights": {
        "summary": "Overall good performance...",
        "recommendations": [
          {
            "category": "Performance",
            "priority": "High",
            "description": "Optimize images...",
            "impact": "15% faster load time"
          }
        ]
      }
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:02:30Z"
  }
}
```

### `GET /url-analysis/history`
Get user's website analysis history.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "id": "analysis-id",
      "url": "https://example.com",
      "status": "completed",
      "scores": { "overall": 85 },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

## 📂 Code Analysis Endpoints

### `POST /code-analysis/github`
Start GitHub repository analysis.

**Request Body:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "branch": "main", // optional, defaults to default branch
  "options": {
    "aiProfile": "mixed",
    "includeTests": true,
    "deepAnalysis": true,
    "runSecurityScan": true,
    "calculateComplexity": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "uuid-analysis-id",
  "message": "GitHub repository analysis started"
}
```

### `POST /code-analysis/zip`
Analyze uploaded ZIP file containing code.

**Request:**
- **Type**: `multipart/form-data`
- **File Field**: `zipFile`
- **Max Size**: 100MB

**Form Data:**
```
zipFile: <zip-file>
options: {
  "aiProfile": "mixed",
  "includeTests": true,
  "deepAnalysis": true
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "uuid-analysis-id",
  "message": "ZIP file analysis started"
}
```

### `GET /code-analysis/:analysisId`
Get code analysis results.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis-id",
    "source": "github", // "github" or "zip"
    "repository": "owner/repo",
    "status": "completed",
    "progress": 100,
    "results": {
      "summary": {
        "totalFiles": 245,
        "totalLines": 15420,
        "languages": {
          "TypeScript": 65.2,
          "JavaScript": 28.4,
          "CSS": 6.4
        },
        "frameworks": ["React", "Express.js"],
        "qualityScore": 8.5,
        "complexityScore": 6.8,
        "testCoverage": 78.5
      },
      "structure": {
        "directories": 28,
        "sourceFiles": 186,
        "testFiles": 45,
        "configFiles": 14
      },
      "security": {
        "vulnerabilities": 2,
        "severity": "Low",
        "issues": [
          {
            "type": "Dependency",
            "severity": "Medium",
            "description": "Outdated dependency with known vulnerability"
          }
        ]
      },
      "aiInsights": {
        "architectureScore": 9.2,
        "codeQualityScore": 8.7,
        "recommendations": [
          {
            "category": "Architecture",
            "priority": "Medium",
            "description": "Consider implementing dependency injection",
            "impact": "Improved testability and maintainability"
          }
        ],
        "refactoringOpportunities": [
          "Extract utility functions into separate modules",
          "Implement consistent error handling patterns"
        ]
      }
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:05:45Z"
  }
}
```

### `GET /code-analysis/history`
Get user's code analysis history.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "id": "analysis-id",
      "source": "github",
      "repository": "owner/repo",
      "status": "completed",
      "qualityScore": 8.5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🤖 AI Services Endpoints

### `GET /ai/providers`
Get available AI providers and their status.

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "name": "OpenAI",
      "provider": "openai",
      "models": ["gpt-4", "gpt-4-turbo"],
      "status": "available",
      "description": "Advanced language model"
    },
    {
      "name": "Anthropic Claude",
      "provider": "anthropic", 
      "models": ["claude-3-sonnet"],
      "status": "available",
      "description": "Highly capable AI assistant"
    }
  ]
}
```

### `POST /ai/chat`
Send a chat message to AI assistant.

**Request Body:**
```json
{
  "message": "How can I improve my website's performance?",
  "context": {
    "analysisId": "optional-analysis-id",
    "type": "website" // "website", "code", or "general"
  },
  "options": {
    "provider": "openai", // optional, auto-selects if not provided
    "model": "gpt-4" // optional
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "message": "Based on your website analysis, here are the top recommendations...",
    "provider": "openai",
    "model": "gpt-4",
    "tokensUsed": 150
  }
}
```

## 📊 Analytics Endpoints

### `GET /analytics/dashboard`
Get dashboard analytics data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalAnalyses": 157,
    "websiteAnalyses": 89,
    "codeAnalyses": 68,
    "averageScores": {
      "website": 78.5,
      "code": 82.3
    },
    "recentActivity": [
      {
        "type": "website",
        "url": "example.com",
        "score": 85,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

## ⚙️ System Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ai_providers": {
      "openai": "available",
      "anthropic": "available"
    }
  }
}
```

### `GET /version`
Get API version information.

**Response:**
```json
{
  "success": true,
  "version": "1.0.0",
  "buildDate": "2024-01-01",
  "environment": "production"
}
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Common Error Codes
- **`AUTH_REQUIRED`** (401): Authentication required
- **`AUTH_INVALID`** (401): Invalid or expired token
- **`FORBIDDEN`** (403): Insufficient permissions
- **`NOT_FOUND`** (404): Resource not found
- **`VALIDATION_ERROR`** (400): Request validation failed
- **`RATE_LIMITED`** (429): Rate limit exceeded
- **`SERVER_ERROR`** (500): Internal server error

## 📝 Rate Limiting

### Limits
- **General API**: 100 requests per 15 minutes
- **Analysis endpoints**: 10 requests per 15 minutes
- **Authentication**: 20 requests per 15 minutes

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1640995200
```

---

**Next**: [Frontend Documentation](../frontend/README.md) | [Database Schema](../database/README.md)
