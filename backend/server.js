// Ultra-minimal Express server for Railway
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting CodeAnalyst Backend...');
console.log('📊 Port:', PORT);
console.log('🌍 Environment:', process.env.NODE_ENV);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'CodeAnalyst Backend is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'CodeAnalyst Backend API is running'
  });
});

// Basic test endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CodeAnalyst Backend running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📊 API: http://localhost:${PORT}/api/health`);
  console.log(`🌐 URL: https://codeanalyst-production.up.railway.app`);
});

module.exports = app;
