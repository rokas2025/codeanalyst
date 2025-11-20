# Generate Sample ZIP Files for Stress Testing
# Creates 5 different test projects with varying complexity

param(
    [string]$OutputDir = "./sample-zips"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GENERATING SAMPLE ZIP FILES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Helper function to create ZIP file
function Create-ZipFile {
    param(
        [string]$SourceDir,
        [string]$ZipPath
    )
    
    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }
    
    Compress-Archive -Path "$SourceDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal
}

# Project 1: Simple HTML/CSS Website
Write-Host "[1/5] Creating simple HTML/CSS project..." -ForegroundColor Yellow
$proj1Dir = Join-Path $env:TEMP "stress-test-proj1"
if (Test-Path $proj1Dir) { Remove-Item $proj1Dir -Recurse -Force }
New-Item -ItemType Directory -Path $proj1Dir | Out-Null

@"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Website</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>Welcome to Test Site</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
        </nav>
    </header>
    <main>
        <section id="home">
            <h2>Home Section</h2>
            <p>This is a simple test website for code analysis.</p>
        </section>
        <section id="about">
            <h2>About Us</h2>
            <p>We are testing the code analysis system.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 Test Site. All rights reserved.</p>
    </footer>
</body>
</html>
"@ | Out-File "$proj1Dir\index.html" -Encoding UTF8

@"
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #4CAF50;
    color: white;
    padding: 1rem;
}

nav a {
    color: white;
    margin: 0 10px;
    text-decoration: none;
}

main {
    padding: 2rem;
}

section {
    margin-bottom: 2rem;
}
"@ | Out-File "$proj1Dir\styles.css" -Encoding UTF8

$zip1Path = Join-Path $OutputDir "project1-simple-html.zip"
Create-ZipFile -SourceDir $proj1Dir -ZipPath $zip1Path
Write-Host "   Created: $zip1Path" -ForegroundColor Green

# Project 2: Basic JavaScript Project
Write-Host "[2/5] Creating basic JavaScript project..." -ForegroundColor Yellow
$proj2Dir = Join-Path $env:TEMP "stress-test-proj2"
if (Test-Path $proj2Dir) { Remove-Item $proj2Dir -Recurse -Force }
New-Item -ItemType Directory -Path $proj2Dir | Out-Null

@"
{
  "name": "basic-js-app",
  "version": "1.0.0",
  "description": "Basic JavaScript application for testing",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "test": "echo \"No tests specified\""
  },
  "keywords": ["test", "javascript"],
  "author": "Test User",
  "license": "MIT"
}
"@ | Out-File "$proj2Dir\package.json" -Encoding UTF8

@"
// Main application file
const express = require('express');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/api/users', (req, res) => {
    // TODO: This should use a database
    const users = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
    ];
    res.json(users);
});

// Start server
app.listen(port, () => {
    console.log('Server running on port ' + port);
});
"@ | Out-File "$proj2Dir\app.js" -Encoding UTF8

@"
// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function validateEmail(email) {
    // Simple email validation
    return email.includes('@');
}

module.exports = { formatDate, validateEmail };
"@ | Out-File "$proj2Dir\utils.js" -Encoding UTF8

@"
<!DOCTYPE html>
<html>
<head>
    <title>JS App</title>
    <script src="client.js"></script>
</head>
<body>
    <h1>JavaScript Application</h1>
    <div id="app"></div>
</body>
</html>
"@ | Out-File "$proj2Dir\index.html" -Encoding UTF8

@"
// Client-side JavaScript
document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/users')
        .then(response => response.json())
        .then(data => {
            const app = document.getElementById('app');
            app.innerHTML = '<ul>' + 
                data.map(user => '<li>' + user.name + '</li>').join('') + 
                '</ul>';
        });
});
"@ | Out-File "$proj2Dir\client.js" -Encoding UTF8

@"
# Basic JS App

This is a test application for code analysis.

## Installation
npm install

## Usage
npm start
"@ | Out-File "$proj2Dir\README.md" -Encoding UTF8

$zip2Path = Join-Path $OutputDir "project2-basic-javascript.zip"
Create-ZipFile -SourceDir $proj2Dir -ZipPath $zip2Path
Write-Host "   Created: $zip2Path" -ForegroundColor Green

# Project 3: React Component
Write-Host "[3/5] Creating React component project..." -ForegroundColor Yellow
$proj3Dir = Join-Path $env:TEMP "stress-test-proj3"
if (Test-Path $proj3Dir) { Remove-Item $proj3Dir -Recurse -Force }
New-Item -ItemType Directory -Path $proj3Dir | Out-Null
New-Item -ItemType Directory -Path "$proj3Dir\src" | Out-Null
New-Item -ItemType Directory -Path "$proj3Dir\src\components" | Out-Null
New-Item -ItemType Directory -Path "$proj3Dir\public" | Out-Null

@"
{
  "name": "react-test-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  }
}
"@ | Out-File "$proj3Dir\package.json" -Encoding UTF8

@"
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@ | Out-File "$proj3Dir\src\index.js" -Encoding UTF8

@"
import React, { useState, useEffect } from 'react';
import './App.css';
import UserList from './components/UserList';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated API call
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'Alice', email: 'alice@test.com' },
        { id: 2, name: 'Bob', email: 'bob@test.com' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Test Application</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <UserList users={users} />
        )}
      </header>
    </div>
  );
}

export default App;
"@ | Out-File "$proj3Dir\src\App.js" -Encoding UTF8

@"
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
"@ | Out-File "$proj3Dir\src\index.css" -Encoding UTF8

@"
.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}
"@ | Out-File "$proj3Dir\src\App.css" -Encoding UTF8

@"
import React from 'react';

function UserList({ users }) {
  if (!users || users.length === 0) {
    return <p>No users found</p>;
  }

  return (
    <div className="user-list">
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
"@ | Out-File "$proj3Dir\src\components\UserList.js" -Encoding UTF8

@"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React Test App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
"@ | Out-File "$proj3Dir\public\index.html" -Encoding UTF8

$zip3Path = Join-Path $OutputDir "project3-react-component.zip"
Create-ZipFile -SourceDir $proj3Dir -ZipPath $zip3Path
Write-Host "   Created: $zip3Path" -ForegroundColor Green

# Project 4: Express API
Write-Host "[4/5] Creating Express API project..." -ForegroundColor Yellow
$proj4Dir = Join-Path $env:TEMP "stress-test-proj4"
if (Test-Path $proj4Dir) { Remove-Item $proj4Dir -Recurse -Force }
New-Item -ItemType Directory -Path $proj4Dir | Out-Null
New-Item -ItemType Directory -Path "$proj4Dir\routes" | Out-Null
New-Item -ItemType Directory -Path "$proj4Dir\controllers" | Out-Null
New-Item -ItemType Directory -Path "$proj4Dir\models" | Out-Null

@"
{
  "name": "express-api-test",
  "version": "1.0.0",
  "description": "Express API for testing",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
"@ | Out-File "$proj4Dir\package.json" -Encoding UTF8

@"
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Express API' });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
"@ | Out-File "$proj4Dir\server.js" -Encoding UTF8

@"
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
"@ | Out-File "$proj4Dir\routes\users.js" -Encoding UTF8

@"
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.post('/', productController.createProduct);

module.exports = router;
"@ | Out-File "$proj4Dir\routes\products.js" -Encoding UTF8

@"
const User = require('../models/User');

exports.getAllUsers = (req, res) => {
    // TODO: Fetch from database
    const users = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ];
    res.json(users);
};

exports.getUserById = (req, res) => {
    const userId = req.params.id;
    // TODO: Fetch from database
    res.json({ id: userId, name: 'User ' + userId });
};

exports.createUser = (req, res) => {
    const { name, email } = req.body;
    // TODO: Validate and save to database
    res.status(201).json({ id: 3, name, email });
};

exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const { name, email } = req.body;
    // TODO: Update in database
    res.json({ id: userId, name, email });
};

exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    // TODO: Delete from database
    res.json({ message: 'User deleted', id: userId });
};
"@ | Out-File "$proj4Dir\controllers\userController.js" -Encoding UTF8

@"
const Product = require('../models/Product');

exports.getAllProducts = (req, res) => {
    const products = [
        { id: 1, name: 'Laptop', price: 999 },
        { id: 2, name: 'Phone', price: 599 }
    ];
    res.json(products);
};

exports.getProductById = (req, res) => {
    const productId = req.params.id;
    res.json({ id: productId, name: 'Product ' + productId, price: 100 });
};

exports.createProduct = (req, res) => {
    const { name, price } = req.body;
    res.status(201).json({ id: 3, name, price });
};
"@ | Out-File "$proj4Dir\controllers\productController.js" -Encoding UTF8

@"
class User {
    constructor(id, name, email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
}

module.exports = User;
"@ | Out-File "$proj4Dir\models\User.js" -Encoding UTF8

@"
class Product {
    constructor(id, name, price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }
}

module.exports = Product;
"@ | Out-File "$proj4Dir\models\Product.js" -Encoding UTF8

@"
PORT=3000
NODE_ENV=development
"@ | Out-File "$proj4Dir\.env" -Encoding UTF8

@"
# Express API Test

REST API built with Express.js for testing purposes.

## Endpoints
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- POST /api/users - Create new user
- GET /api/products - Get all products
"@ | Out-File "$proj4Dir\README.md" -Encoding UTF8

$zip4Path = Join-Path $OutputDir "project4-express-api.zip"
Create-ZipFile -SourceDir $proj4Dir -ZipPath $zip4Path
Write-Host "   Created: $zip4Path" -ForegroundColor Green

# Project 5: Mixed Project (larger)
Write-Host "[5/5] Creating mixed project..." -ForegroundColor Yellow
$proj5Dir = Join-Path $env:TEMP "stress-test-proj5"
if (Test-Path $proj5Dir) { Remove-Item $proj5Dir -Recurse -Force }
New-Item -ItemType Directory -Path $proj5Dir | Out-Null
New-Item -ItemType Directory -Path "$proj5Dir\frontend" | Out-Null
New-Item -ItemType Directory -Path "$proj5Dir\backend" | Out-Null
New-Item -ItemType Directory -Path "$proj5Dir\shared" | Out-Null

@"
{
  "name": "fullstack-test-app",
  "version": "1.0.0",
  "description": "Full-stack application for testing",
  "scripts": {
    "start": "node backend/server.js",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "nodemon backend/server.js",
    "dev:frontend": "cd frontend && npm start"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
"@ | Out-File "$proj5Dir\package.json" -Encoding UTF8

@"
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/data', (req, res) => {
    res.json({
        items: [
            { id: 1, title: 'Item 1', description: 'First item' },
            { id: 2, title: 'Item 2', description: 'Second item' },
            { id: 3, title: 'Item 3', description: 'Third item' }
        ]
    });
});

app.post('/api/data', (req, res) => {
    const { title, description } = req.body;
    res.status(201).json({ id: 4, title, description });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
"@ | Out-File "$proj5Dir\backend\server.js" -Encoding UTF8

@"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Full-Stack Test App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>Full-Stack Application</h1>
        </header>
        <main>
            <section id="data-section">
                <h2>Data from API</h2>
                <button id="loadBtn">Load Data</button>
                <div id="dataContainer"></div>
            </section>
        </main>
    </div>
    <script src="app.js"></script>
</body>
</html>
"@ | Out-File "$proj5Dir\frontend\index.html" -Encoding UTF8

@"
const API_URL = 'http://localhost:5000/api';

document.getElementById('loadBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/data`);
        const data = await response.json();
        
        const container = document.getElementById('dataContainer');
        container.innerHTML = '<ul>' + 
            data.items.map(item => 
                `<li><strong>${item.title}</strong>: ${item.description}</li>`
            ).join('') + 
            '</ul>';
    } catch (error) {
        console.error('Error loading data:', error);
    }
});

// Check health on load
fetch(`${API_URL}/health`)
    .then(res => res.json())
    .then(data => console.log('Backend health:', data))
    .catch(err => console.error('Backend not available:', err));
"@ | Out-File "$proj5Dir\frontend\app.js" -Encoding UTF8

@"
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    overflow: hidden;
}

header {
    background: #667eea;
    color: white;
    padding: 2rem;
    text-align: center;
}

main {
    padding: 2rem;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background: #5568d3;
}

#dataContainer {
    margin-top: 20px;
}

ul {
    list-style: none;
}

li {
    padding: 10px;
    border-bottom: 1px solid #eee;
}
"@ | Out-File "$proj5Dir\frontend\style.css" -Encoding UTF8

@"
// Shared utilities
const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};

const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

module.exports = { formatDate, validateEmail };
"@ | Out-File "$proj5Dir\shared\utils.js" -Encoding UTF8

@"
// Shared constants
const API_VERSION = 'v1';
const MAX_ITEMS = 100;
const CACHE_DURATION = 3600;

module.exports = { API_VERSION, MAX_ITEMS, CACHE_DURATION };
"@ | Out-File "$proj5Dir\shared\constants.js" -Encoding UTF8

@"
# Full-Stack Test Application

This is a full-stack application with Express backend and vanilla JS frontend.

## Structure
- `/backend` - Express.js API server
- `/frontend` - Static HTML/CSS/JS frontend
- `/shared` - Shared utilities and constants

## Running
npm install
npm start

## Features
- RESTful API
- Data fetching
- Modern UI
"@ | Out-File "$proj5Dir\README.md" -Encoding UTF8

$zip5Path = Join-Path $OutputDir "project5-fullstack-mixed.zip"
Create-ZipFile -SourceDir $proj5Dir -ZipPath $zip5Path
Write-Host "   Created: $zip5Path" -ForegroundColor Green

# Cleanup temp directories
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item $proj1Dir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $proj2Dir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $proj3Dir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $proj4Dir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $proj5Dir -Recurse -Force -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "GENERATION COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Created 5 sample ZIP files:" -ForegroundColor Cyan
Write-Host "  1. project1-simple-html.zip (~10KB)" -ForegroundColor White
Write-Host "  2. project2-basic-javascript.zip (~50KB)" -ForegroundColor White
Write-Host "  3. project3-react-component.zip (~100KB)" -ForegroundColor White
Write-Host "  4. project4-express-api.zip (~150KB)" -ForegroundColor White
Write-Host "  5. project5-fullstack-mixed.zip (~200KB)" -ForegroundColor White
Write-Host ""
Write-Host "Output directory: $OutputDir" -ForegroundColor Cyan
Write-Host ""

