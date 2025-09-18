# OpenAI Integration Setup Guide

## 🚀 Quick Start

The Content Creator module is now fully integrated with OpenAI GPT-4 for AI-powered content generation. Follow this guide to set up the integration.

## 📋 Prerequisites

1. **OpenAI API Account**: Sign up at [platform.openai.com](https://platform.openai.com)
2. **API Key**: Generate an API key from your OpenAI dashboard
3. **Node.js Environment**: Backend server running with proper environment configuration

## 🔧 Environment Setup

### 1. OpenAI API Key Configuration

Add your OpenAI API key to the `.env` file in the backend directory:

```env
# AI Service API Keys
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here  # Optional
GOOGLE_AI_API_KEY=your-google-ai-key              # Optional
```

### 2. Verify Environment Variables

The backend will automatically detect and initialize available AI providers on startup. Look for these logs:

```
✅ OpenAI initialized for content generation
✅ Anthropic initialized for content generation (if configured)
✅ Google AI API key configured (if configured)
```

## 🧪 Testing the Integration

### Quick Test Script

Run the included test script to verify your setup:

```bash
cd backend
node test-openai-integration.js
```

Expected output:
```
🧪 Testing OpenAI integration for Content Creator...
✅ OpenAI API key found
🎨 Testing content generation...
✅ Content generation successful!
📊 Generation Stats:
   - Provider: openai
   - Model: gpt-3.5-turbo
   - Word Count: 185
   - Character Count: 1024
   - Cost Estimate: $0.0008
   - Generation Time: 2341ms
```

### Manual API Test

You can also test the API endpoints directly:

```bash
# Test content generation endpoint
curl -X POST http://localhost:3001/api/content-creator/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "templateId": "about-us",
    "inputs": {
      "companyName": "Test Company",
      "industry": "Technology",
      "mission": "Innovation and excellence"
    },
    "settings": {
      "temperature": 0.7,
      "tone": "professional"
    }
  }'
```

## 💰 Cost Management

### Rate Limits

The system includes intelligent rate limiting based on user plans:

- **Free Plan**: 5 generations per hour
- **Basic Plan**: 20 generations per hour
- **Premium Plan**: 100 generations per hour
- **Enterprise Plan**: 500 generations per hour

### Cost Estimation

Each generation includes cost estimation:

```javascript
{
  "metadata": {
    "costEstimate": 0.0023,  // USD
    "tokenCount": 547,
    "model": "gpt-4-turbo"
  }
}
```

### Model Selection

The system supports multiple OpenAI models:

- **gpt-4-turbo** (default): Best quality, moderate cost
- **gpt-4**: Highest quality, higher cost
- **gpt-3.5-turbo**: Good quality, lowest cost

## 🎯 Content Generation Features

### Supported Templates

1. **About Us Pages** - Company introductions and stories
2. **Product Descriptions** - Compelling product copy
3. **Service Descriptions** - Professional service explanations
4. **Blog Posts** - Engaging article content
5. **Landing Pages** - High-converting marketing copy
6. **Press Releases** - Professional announcements
7. **Email Campaigns** - Effective email marketing
8. **Social Media** - Platform-optimized content

### Generation Settings

- **Temperature**: 0.0-1.0 (creativity level)
- **Tone**: Professional, casual, persuasive, friendly, etc.
- **Style**: Detailed, concise, conversational, formal, etc.
- **Audience**: General, technical, executive, consumer, etc.
- **Language**: English, Lithuanian, Spanish, French, German

### Content Features

- **Structured Output**: Content organized by sections
- **Real-time Editing**: In-place content modification
- **Multiple Exports**: HTML, Markdown, Plain Text, WordPress
- **Version Tracking**: Content iteration and history
- **Section Regeneration**: Regenerate specific parts

## 🔒 Security & Best Practices

### API Key Security

- ✅ Store API keys in environment variables only
- ✅ Never commit API keys to version control
- ✅ Use different keys for development/production
- ✅ Monitor API usage and costs regularly

### Rate Limiting

- ✅ Plan-based rate limiting protects against abuse
- ✅ Burst protection prevents rapid-fire requests
- ✅ Cost-based limiting prevents budget overruns
- ✅ Provider-specific limits protect API quotas

### Error Handling

- ✅ Automatic retry with exponential backoff
- ✅ Graceful degradation on API failures
- ✅ User-friendly error messages
- ✅ Comprehensive logging for debugging

## 🚨 Troubleshooting

### Common Issues

**1. "Invalid API key" Error**
```bash
# Verify your API key format
echo $OPENAI_API_KEY
# Should start with 'sk-'
```

**2. "Rate limit exceeded" Error**
```bash
# Check your OpenAI usage dashboard
# Upgrade plan or wait for quota reset
```

**3. "No AI providers available" Error**
```bash
# Verify environment variables are loaded
npm run dev  # Restart server
```

**4. High costs**
```bash
# Use gpt-3.5-turbo for development
# Set lower temperature values
# Use shorter content templates
```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_DEBUG_LOGS=true
```

View detailed logs:
```bash
tail -f logs/app.log
```

## 📈 Monitoring & Analytics

### Usage Tracking

Monitor API usage through:
- OpenAI dashboard: [platform.openai.com/usage](https://platform.openai.com/usage)
- Application logs: Cost estimates per generation
- Database: Content generation history and statistics

### Performance Metrics

Key metrics to monitor:
- **Generation Time**: Target < 30 seconds
- **Success Rate**: Target > 95%
- **Cost per Generation**: Varies by model and length
- **User Satisfaction**: Based on regeneration frequency

## 🆘 Support

### Documentation
- OpenAI API: [platform.openai.com/docs](https://platform.openai.com/docs)
- Rate Limits: [platform.openai.com/docs/guides/rate-limits](https://platform.openai.com/docs/guides/rate-limits)
- Models: [platform.openai.com/docs/models](https://platform.openai.com/docs/models)

### Contact
- Technical Issues: Check application logs first
- Billing Issues: Contact OpenAI support
- Feature Requests: Create GitHub issues

---

🎉 **You're all set!** The Content Creator module is now ready to generate high-quality content using AI.
