# Data Flow Diagram (DFD) - CodeAnalyst System

## Overview
This document provides comprehensive Data Flow Diagrams for the CodeAnalyst system, including all implemented modules and planned features. The diagrams show how data flows through the system from external entities to processes, data stores, and back.

---

## Table of Contents
1. [Context Diagram (Level 0)](#context-diagram-level-0)
2. [System Overview (Level 1)](#system-overview-level-1)
3. [Module-Specific DFDs (Level 2)](#module-specific-dfds-level-2)
   - [Authentication Flow](#authentication-flow)
   - [Code Analysis Flow](#code-analysis-flow)
   - [Website Analysis Flow](#website-analysis-flow)
   - [Content Analysis Flow](#content-analysis-flow)
   - [Auto Programmer Flow](#auto-programmer-flow)
   - [Content Creator Flow](#content-creator-flow)
   - [WordPress Integration Flow](#wordpress-integration-flow)
4. [Data Stores](#data-stores)
5. [External Systems](#external-systems)

---

## Context Diagram (Level 0)

### High-Level System View

```
┌─────────────┐
│    User     │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP Requests
       │ (Login, Analysis, Content)
       ↓
┌──────────────────────────────────────┐
│                                      │
│        CodeAnalyst System            │
│                                      │
│  AI-Powered Website Support Tool     │
│                                      │
└──────┬───────────────────────────────┘
       │
       │ API Calls
       │
    ┌──┴────────────────────────────────────┐
    │                                       │
    ↓                                       ↓
┌─────────────┐                    ┌─────────────┐
│  External   │                    │  External   │
│  Services   │                    │  Data       │
│             │                    │  Sources    │
│ - GitHub    │                    │             │
│ - OpenAI    │                    │ - GitHub    │
│ - Anthropic │                    │   Repos     │
│ - Google AI │                    │ - WordPress │
│ - Supabase  │                    │   Sites     │
└─────────────┘                    └─────────────┘
```

### External Entities
1. **User**: End-user accessing the system through web browser
2. **GitHub**: OAuth provider and repository source
3. **WordPress Sites**: Connected WordPress installations
4. **AI Providers**: OpenAI, Anthropic, Google Gemini
5. **Supabase**: Authentication and database services

---

## System Overview (Level 1)

### Main Data Flows

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1. Login Credentials
       │ 2. Analysis Requests
       │ 3. Content Input
       │ 4. Settings Updates
       ↓
┌──────────────────────────────────────────────────────────┐
│                  CodeAnalyst Frontend                    │
│                  (React + TypeScript)                    │
└──────┬───────────────────────────────────────────────────┘
       │
       │ API Requests (JSON/HTTP)
       │
       ↓
┌──────────────────────────────────────────────────────────┐
│                  API Gateway / Router                    │
│                  (Express.js)                            │
└──────┬───────────────────────────────────────────────────┘
       │
       │ Route to appropriate service
       │
    ┌──┴────────┬──────────┬──────────┬──────────┬─────────┐
    ↓           ↓          ↓          ↓          ↓         ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Auth  │ │  Code  │ │Website │ │Content │ │  Auto  │ │Content │
│Service │ │Analyst │ │Analyst │ │Analyst │ │Progrmr │ │Creator │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │          │
    │          └──────────┴──────────┴──────────┴──────────┘
    │                     │
    │                     ↓
    │          ┌──────────────────────┐
    │          │   AI Service Layer   │
    │          │  (OpenAI/Claude/     │
    │          │   Gemini)            │
    │          └──────────┬───────────┘
    │                     │
    └─────────────────────┘
                          │
                          ↓
              ┌───────────────────────┐
              │   PostgreSQL Database │
              │   (Supabase)          │
              │                       │
              │ - users               │
              │ - code_analyses       │
              │ - url_analyses        │
              │ - projects            │
              │ - wordpress_*         │
              │ - content_templates   │
              └───────────────────────┘
```

---

## Module-Specific DFDs (Level 2)

### Authentication Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 1.1 Click "Login with GitHub"
       │ 1.2 Enter Email/Password
       │ 1.3 Click "Login with Google"
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Initiate Authentication         │
│  - Validate input                    │
│  - Determine auth method             │
└──────┬───────────────────────────────┘
       │
    ┌──┴─────────────────────┬──────────────────────┐
    │                        │                      │
    │ 1.1 GitHub OAuth       │ 1.2 Email/Pass       │ 1.3 Google OAuth
    ↓                        ↓                      ↓
┌────────────┐        ┌────────────┐        ┌────────────┐
│  GitHub    │        │  P2: Local │        │  Supabase  │
│  OAuth API │        │  Auth      │        │  Auth      │
└──────┬─────┘        └──────┬─────┘        └──────┬─────┘
       │                     │                     │
       │ 1.1.1 Auth Code     │ 1.2.1 Credentials   │ 1.3.1 Token
       ↓                     ↓                     ↓
┌──────────────────────────────────────────────────────┐
│  P3: Process Authentication                          │
│  - Exchange code for token (GitHub)                  │
│  - Verify credentials (Email)                        │
│  - Validate token (Google)                           │
└──────┬───────────────────────────────────────────────┘
       │
       │ 1.4 Fetch/Create user profile
       ↓
┌──────────────────────────────────────┐
│  P4: User Profile Management         │
│  - Check if user exists              │
│  - Create new user OR update existing│
│  - Sync with Supabase                │
└──────┬───────────────────────────────┘
       │
       │ 1.5 Store user data
       ↓
┌──────────────────────────────────────┐
│  D1: Users Database                  │
│  - id, email, name, avatar           │
│  - auth_provider, github_id          │
│  - role, is_active, pending_approval │
└──────┬───────────────────────────────┘
       │
       │ 1.6 User record
       ↓
┌──────────────────────────────────────┐
│  P5: Generate JWT Token              │
│  - Create JWT with user ID           │
│  - Set expiration (30 days)          │
│  - Sign with secret                  │
└──────┬───────────────────────────────┘
       │
       │ 1.7 JWT Token
       ↓
┌─────────────┐
│    User     │
│  (Store in  │
│  LocalStorage)
└─────────────┘
```

**Data Elements:**
- **Input**: Login credentials, OAuth codes, tokens
- **Output**: JWT token, user profile
- **Stores**: D1 (Users), D2 (Sessions)

---

### Code Analysis Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 2.1 Upload ZIP / Enter GitHub URL / Select WordPress Theme
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Receive Code Input              │
│  - Validate input format             │
│  - Check file size limits            │
└──────┬───────────────────────────────┘
       │
    ┌──┴─────────────────────┬──────────────────────┐
    │                        │                      │
    │ 2.1.1 GitHub URL       │ 2.1.2 ZIP File       │ 2.1.3 WordPress
    ↓                        ↓                      ↓
┌────────────┐        ┌────────────┐        ┌────────────┐
│  GitHub    │        │  P2: ZIP   │        │  WordPress │
│  API       │        │  Extractor │        │  API       │
└──────┬─────┘        └──────┬─────┘        └──────┬─────┘
       │                     │                     │
       │ 2.2 Fetch repo      │ 2.2 Extract files   │ 2.2 Fetch theme
       ↓                     ↓                     ↓
┌──────────────────────────────────────────────────────┐
│  P3: Parse and Organize Files                        │
│  - Build file tree structure                         │
│  - Detect file types                                 │
│  - Read file contents                                │
└──────┬───────────────────────────────────────────────┘
       │
       │ 2.3 File structure + contents
       ↓
┌──────────────────────────────────────┐
│  P4: Static Code Analysis            │
│  - Detect languages                  │
│  - Detect frameworks                 │
│  - Count lines of code               │
│  - Calculate complexity metrics      │
│  - Identify dependencies             │
└──────┬───────────────────────────────┘
       │
       │ 2.4 Static analysis results
       ↓
┌──────────────────────────────────────┐
│  P5: AI-Powered Analysis             │
│  - Send code to AI provider          │
│  - Request quality assessment        │
│  - Request security analysis         │
│  - Request architecture review       │
└──────┬───────────────────────────────┘
       │
       │ 2.5 AI API request
       ↓
┌──────────────────────────────────────┐
│  OpenAI / Anthropic / Google AI      │
│  (External Service)                  │
└──────┬───────────────────────────────┘
       │
       │ 2.6 AI analysis results
       ↓
┌──────────────────────────────────────┐
│  P6: Generate Analysis Report        │
│  - Combine static + AI results       │
│  - Calculate quality score (0-100)   │
│  - Generate recommendations          │
│  - Create visualizations             │
└──────┬───────────────────────────────┘
       │
       │ 2.7 Store analysis
       ↓
┌──────────────────────────────────────┐
│  D2: Code Analyses Database          │
│  - id, user_id, repo_url             │
│  - system_overview                   │
│  - technical_structure               │
│  - maintenance_needs                 │
│  - code_quality_score                │
│  - languages, frameworks             │
└──────┬───────────────────────────────┘
       │
       │ 2.8 Analysis report
       ↓
┌─────────────┐
│    User     │
│  (Display   │
│   Report)   │
└─────────────┘
```

**Data Elements:**
- **Input**: GitHub URL, ZIP file, WordPress theme files
- **Processing**: File parsing, language detection, AI analysis
- **Output**: Quality score, recommendations, visualizations
- **Stores**: D2 (Code Analyses)

---

### Website Analysis Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 3.1 Enter Website URL
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Validate URL                    │
│  - Check URL format                  │
│  - Verify accessibility              │
└──────┬───────────────────────────────┘
       │
       │ 3.2 Valid URL
       ↓
┌──────────────────────────────────────┐
│  P2: Fetch Website Content           │
│  - HTTP GET request                  │
│  - Follow redirects                  │
│  - Handle errors                     │
└──────┬───────────────────────────────┘
       │
       │ 3.3 HTML content
       ↓
┌──────────────────────────────────────┐
│  P3: Parse HTML                      │
│  - Extract meta tags                 │
│  - Extract headings (H1-H6)          │
│  - Extract links                     │
│  - Extract images                    │
│  - Extract scripts/styles            │
└──────┬───────────────────────────────┘
       │
       │ 3.4 Parsed data
       ↓
┌──────────────────────────────────────┐
│  P4: Performance Analysis            │
│  - Measure load time                 │
│  - Calculate resource sizes          │
│  - Count HTTP requests               │
│  - Analyze render-blocking resources │
└──────┬───────────────────────────────┘
       │
       │ 3.5 Performance metrics
       ↓
┌──────────────────────────────────────┐
│  P5: SEO Analysis                    │
│  - Check meta tags (title, desc)     │
│  - Analyze heading structure         │
│  - Check Open Graph tags             │
│  - Calculate keyword density         │
│  - Check canonical URLs              │
└──────┬───────────────────────────────┘
       │
       │ 3.6 SEO metrics
       ↓
┌──────────────────────────────────────┐
│  P6: Accessibility Analysis          │
│  - Check ARIA labels                 │
│  - Check semantic HTML               │
│  - Check alt text on images          │
│  - Check color contrast              │
└──────┬───────────────────────────────┘
       │
       │ 3.7 Accessibility metrics
       ↓
┌──────────────────────────────────────┐
│  P7: Security Analysis               │
│  - Check HTTPS                       │
│  - Check security headers            │
│  - Check CSP policy                  │
│  - Check mixed content               │
└──────┬───────────────────────────────┘
       │
       │ 3.8 Security metrics
       ↓
┌──────────────────────────────────────┐
│  P8: PageSpeed Integration           │
│  - Call Google PageSpeed API         │
│  - Get mobile/desktop scores         │
│  - Get Core Web Vitals               │
└──────┬───────────────────────────────┘
       │
       │ 3.9 PageSpeed data
       ↓
┌──────────────────────────────────────┐
│  P9: Generate Comprehensive Report   │
│  - Combine all metrics               │
│  - Calculate overall scores          │
│  - Generate recommendations          │
└──────┬───────────────────────────────┘
       │
       │ 3.10 Store analysis
       ↓
┌──────────────────────────────────────┐
│  D3: URL Analyses Database           │
│  - id, user_id, url                  │
│  - meta_tags, performance_metrics    │
│  - seo_score, accessibility_score    │
│  - security_headers                  │
│  - page_speed_results                │
└──────┬───────────────────────────────┘
       │
       │ 3.11 Analysis report
       ↓
┌─────────────┐
│    User     │
│  (Display   │
│   Report)   │
└─────────────┘
```

**Data Elements:**
- **Input**: Website URL
- **Processing**: HTML parsing, performance measurement, SEO analysis
- **Output**: Performance score, SEO score, accessibility score, recommendations
- **Stores**: D3 (URL Analyses)

---

### Content Analysis Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 4.1 Enter Text / URL / Select WordPress Page
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Receive Content Input           │
│  - Validate input type               │
│  - Extract text content              │
└──────┬───────────────────────────────┘
       │
    ┌──┴─────────────────────┬──────────────────────┐
    │                        │                      │
    │ 4.1.1 Direct Text      │ 4.1.2 URL            │ 4.1.3 WordPress
    ↓                        ↓                      ↓
┌────────────┐        ┌────────────┐        ┌────────────┐
│  Use Text  │        │  Fetch URL │        │  Fetch WP  │
│  Directly  │        │  Content   │        │  Page      │
└──────┬─────┘        └──────┬─────┘        └──────┬─────┘
       │                     │                     │
       │ 4.2 Text content    │ 4.2 HTML → Text     │ 4.2 Page content
       ↓                     ↓                     ↓
┌──────────────────────────────────────────────────────┐
│  P2: Detect Language                                 │
│  - Analyze text patterns                             │
│  - Identify language (en, lt, etc.)                  │
└──────┬───────────────────────────────────────────────┘
       │
       │ 4.3 Detected language
       ↓
┌──────────────────────────────────────┐
│  P3: Grammar Analysis                │
│  - Check spelling errors             │
│  - Check grammar rules               │
│  - Identify issues                   │
│  - Generate suggestions              │
└──────┬───────────────────────────────┘
       │
       │ 4.4 Grammar results
       ↓
┌──────────────────────────────────────┐
│  P4: Readability Analysis            │
│  - Calculate Flesch-Kincaid score    │
│  - Analyze sentence complexity       │
│  - Check paragraph structure         │
│  - Measure lexical diversity         │
└──────┬───────────────────────────────┘
       │
       │ 4.5 Readability results
       ↓
┌──────────────────────────────────────┐
│  P5: SEO Analysis                    │
│  - Count words, sentences, paragraphs│
│  - Calculate keyword density         │
│  - Analyze heading usage             │
│  - Check meta description quality    │
└──────┬───────────────────────────────┘
       │
       │ 4.6 SEO results
       ↓
┌──────────────────────────────────────┐
│  P6: Extract Keywords                │
│  - Identify key terms                │
│  - Calculate term frequency          │
│  - Rank by importance                │
└──────┬───────────────────────────────┘
       │
       │ 4.7 Keywords list
       ↓
┌──────────────────────────────────────┐
│  P7: AI-Powered Improvement          │
│  - Send content to AI                │
│  - Request improved version          │
│  - Apply language-specific rules     │
└──────┬───────────────────────────────┘
       │
       │ 4.8 AI request
       ↓
┌──────────────────────────────────────┐
│  OpenAI / Anthropic / Google AI      │
│  (External Service)                  │
└──────┬───────────────────────────────┘
       │
       │ 4.9 Improved content
       ↓
┌──────────────────────────────────────┐
│  P8: Generate Analysis Report        │
│  - Combine all results               │
│  - Calculate scores (0-100)          │
│  - Format for display                │
└──────┬───────────────────────────────┘
       │
       │ 4.10 Analysis report
       ↓
┌─────────────┐
│    User     │
│  (Display   │
│   Report)   │
└─────────────┘
```

**Data Elements:**
- **Input**: Text content, URL, WordPress page
- **Processing**: Language detection, grammar check, readability analysis, SEO analysis
- **Output**: Grammar score, readability score, SEO score, improved content, keywords
- **Stores**: None (analysis not persisted currently)

---

### Auto Programmer Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 5.1 Select Project (GitHub / WordPress)
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Load Project Context            │
│  - Fetch project details             │
│  - Load file structure               │
│  - Detect builder (if WordPress)     │
└──────┬───────────────────────────────┘
       │
       │ 5.2 Project context
       ↓
┌──────────────────────────────────────┐
│  P2: Initialize Chat Session         │
│  - Create conversation history       │
│  - Send initial AI message           │
│  - Display project info              │
└──────┬───────────────────────────────┘
       │
       │ 5.3 Initial message
       ↓
┌─────────────┐
│    User     │
│  (Type      │
│   Message)  │
└──────┬──────┘
       │
       │ 5.4 User message
       ↓
┌──────────────────────────────────────┐
│  P3: Build Chat Context              │
│  - Add user message to history       │
│  - Include project context           │
│  - Include selected file (if any)    │
│  - Add system instructions           │
└──────┬───────────────────────────────┘
       │
       │ 5.5 Chat request
       ↓
┌──────────────────────────────────────┐
│  P4: Send to AI Service              │
│  - POST /api/chat                    │
│  - Stream response                   │
└──────┬───────────────────────────────┘
       │
       │ 5.6 AI request
       ↓
┌──────────────────────────────────────┐
│  OpenAI GPT-4                        │
│  (External Service)                  │
└──────┬───────────────────────────────┘
       │
       │ 5.7 Streaming response
       ↓
┌──────────────────────────────────────┐
│  P5: Parse AI Response               │
│  - Stream text deltas                │
│  - Detect code blocks                │
│  - Parse FILE/ACTION/CODE format     │
│    (GitHub projects only)            │
└──────┬───────────────────────────────┘
       │
    ┌──┴─────────────────────┬──────────────────────┐
    │                        │                      │
    │ 5.8.1 GitHub Project   │ 5.8.2 WordPress Site │
    ↓                        ↓                      │
┌────────────┐        ┌────────────┐               │
│  P6: Parse │        │  P7: Show  │               │
│  Code      │        │  HTML Code │               │
│  Changes   │        │  + Instruct│               │
└──────┬─────┘        └──────┬─────┘               │
       │                     │                     │
       │ 5.9 Code changes    │ 5.9 HTML + guide    │
       ↓                     ↓                     │
┌────────────┐        ┌────────────┐               │
│  P8: Show  │        │    User    │               │
│  Preview   │        │  (Copy to  │               │
│            │        │  WordPress)│               │
└──────┬─────┘        └────────────┘               │
       │                                            │
       │ 5.10 User approves changes                │
       ↓                                            │
┌──────────────────────────────────────┐            │
│  P9: Apply Changes to File Tree      │            │
│  - Create new files                  │            │
│  - Modify existing files             │            │
│  - Delete files                      │            │
└──────┬───────────────────────────────┘            │
       │                                            │
       │ 5.11 Updated file tree                    │
       ↓                                            │
┌──────────────────────────────────────┐            │
│  P10: Update Preview                 │            │
│  - Refresh preview pane              │            │
│  - Show updated code                 │            │
└──────┬───────────────────────────────┘            │
       │                                            │
       │ 5.12 Updated preview                      │
       ↓                                            │
┌─────────────┐                                     │
│    User     │◄────────────────────────────────────┘
│  (View      │
│   Changes)  │
└─────────────┘
```

**Data Elements:**
- **Input**: User message, project context, selected file
- **Processing**: AI chat completion, code parsing, change detection
- **Output**: AI response, code changes, preview
- **Stores**: None (changes stored in frontend state only)

---

### Content Creator Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 6.1 Select Template
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Load Template                   │
│  - Fetch template from database      │
│  - Load structure and fields         │
│  - Load prompt template              │
└──────┬───────────────────────────────┘
       │
       │ 6.2 Template data
       ↓
┌──────────────────────────────────────┐
│  D4: Content Templates Database      │
│  - id, name, category                │
│  - structure, prompt_template        │
│  - translations                      │
└──────┬───────────────────────────────┘
       │
       │ 6.3 Template details
       ↓
┌─────────────┐
│    User     │
│  (Fill Form)│
└──────┬──────┘
       │
       │ 6.4 Form data (topic, keywords, tone, etc.)
       ↓
┌──────────────────────────────────────┐
│  P2: Build AI Prompt                 │
│  - Apply template structure          │
│  - Insert user inputs                │
│  - Add SEO requirements              │
│  - Add language specification        │
└──────┬───────────────────────────────┘
       │
       │ 6.5 AI prompt
       ↓
┌──────────────────────────────────────┐
│  P3: Send to AI Service              │
│  - POST /api/content-creator/generate│
│  - Include settings (creativity, etc)│
└──────┬───────────────────────────────┘
       │
       │ 6.6 AI request
       ↓
┌──────────────────────────────────────┐
│  OpenAI / Anthropic / Google AI      │
│  (External Service)                  │
└──────┬───────────────────────────────┘
       │
       │ 6.7 Generated content
       ↓
┌──────────────────────────────────────┐
│  P4: Post-Process Content            │
│  - Format HTML/Markdown              │
│  - Apply styling                     │
│  - Extract metadata                  │
└──────┬───────────────────────────────┘
       │
       │ 6.8 Formatted content
       ↓
┌──────────────────────────────────────┐
│  P5: Analyze Generated Content       │
│  - Calculate SEO score               │
│  - Calculate readability score       │
│  - Extract keywords                  │
└──────┬───────────────────────────────┘
       │
       │ 6.9 Content + metrics
       ↓
┌──────────────────────────────────────┐
│  P6: Store Generated Content         │
│  - Save to database                  │
│  - Link to user and template         │
└──────┬───────────────────────────────┘
       │
       │ 6.10 Store content
       ↓
┌──────────────────────────────────────┐
│  D5: Generated Content Database      │
│  - id, user_id, template_id          │
│  - content, metadata                 │
│  - language, translations            │
│  - seo_score                         │
└──────┬───────────────────────────────┘
       │
       │ 6.11 Content with ID
       ↓
┌─────────────┐
│    User     │
│  (View/Edit │
│   Content)  │
└──────┬──────┘
       │
       │ 6.12 Request translation
       │
       ↓
┌──────────────────────────────────────┐
│  P7: Translate Content               │
│  - Send to AI with target language   │
│  - Preserve formatting               │
│  - Store translation                 │
└──────┬───────────────────────────────┘
       │
       │ 6.13 Translated content
       ↓
┌─────────────┐
│    User     │
│  (Export)   │
└─────────────┘
```

**Data Elements:**
- **Input**: Template selection, form data (topic, keywords, tone)
- **Processing**: Prompt building, AI generation, content analysis
- **Output**: Generated content, SEO score, readability score
- **Stores**: D4 (Content Templates), D5 (Generated Content)

---

### WordPress Integration Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ 7.1 Generate API Key
       │
       ↓
┌──────────────────────────────────────┐
│  P1: Generate WordPress API Key      │
│  - Create unique key                 │
│  - Encrypt key                       │
│  - Store in database                 │
└──────┬───────────────────────────────┘
       │
       │ 7.2 API key
       ↓
┌─────────────┐
│    User     │
│  (Copy Key) │
└──────┬──────┘
       │
       │ 7.3 Install WordPress Plugin
       │
       ↓
┌──────────────────────────────────────┐
│  WordPress Site                      │
│  (CodeAnalyst Connector Plugin)      │
└──────┬───────────────────────────────┘
       │
       │ 7.4 Enter API key in plugin
       │
       ↓
┌──────────────────────────────────────┐
│  P2: Connect WordPress Site          │
│  - Validate API key                  │
│  - Fetch site information            │
│  - Store connection                  │
└──────┬───────────────────────────────┘
       │
       │ 7.5 Site info
       ↓
┌──────────────────────────────────────┐
│  D6: WordPress Connections Database  │
│  - id, user_id, site_url             │
│  - site_name, api_key (encrypted)    │
│  - site_info, is_active              │
└──────┬───────────────────────────────┘
       │
       │ 7.6 Connection established
       ↓
┌─────────────┐
│    User     │
│  (Select    │
│   Site)     │
└──────┬──────┘
       │
       │ 7.7 Request pages
       │
       ↓
┌──────────────────────────────────────┐
│  P3: Fetch WordPress Pages           │
│  - Call WordPress REST API           │
│  - Get all pages/posts               │
│  - Detect editor type                │
└──────┬───────────────────────────────┘
       │
       │ 7.8 API request
       ↓
┌──────────────────────────────────────┐
│  WordPress REST API                  │
│  (External Service)                  │
└──────┬───────────────────────────────┘
       │
       │ 7.9 Pages data
       ↓
┌──────────────────────────────────────┐
│  P4: Parse and Store Pages           │
│  - Extract page metadata             │
│  - Parse Elementor data (if present) │
│  - Parse Gutenberg blocks (if present)│
│  - Store in database                 │
└──────┬───────────────────────────────┘
       │
       │ 7.10 Store pages
       ↓
┌──────────────────────────────────────┐
│  D7: WordPress Pages Database        │
│  - id, connection_id, post_id        │
│  - post_title, editor_type           │
│  - content, elementor_data, blocks   │
│  - page_url                          │
└──────┬───────────────────────────────┘
       │
       │ 7.11 Pages list
       ↓
┌─────────────┐
│    User     │
│  (Select    │
│   Page)     │
└──────┬──────┘
       │
       │ 7.12 Request theme files
       │
       ↓
┌──────────────────────────────────────┐
│  P5: Fetch WordPress Theme Files     │
│  - Call plugin API endpoint          │
│  - Get theme directory listing       │
│  - Fetch file contents               │
└──────┬───────────────────────────────┘
       │
       │ 7.13 Theme files
       ↓
┌──────────────────────────────────────┐
│  D8: WordPress Files Database        │
│  - id, connection_id, file_path      │
│  - file_type, file_content           │
│  - file_size                         │
└──────┬───────────────────────────────┘
       │
       │ 7.14 Files ready for analysis
       ↓
┌─────────────┐
│  Code       │
│  Analyst    │
│  Module     │
└─────────────┘
```

**Data Elements:**
- **Input**: API key, WordPress site URL
- **Processing**: API key validation, site connection, data fetching
- **Output**: Site information, pages list, theme files
- **Stores**: D6 (WordPress Connections), D7 (WordPress Pages), D8 (WordPress Files)

---

## Data Stores

### Database Schema Overview

```
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                    │
│                  (Supabase Hosted)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  D1: users                                              │
│  - Primary user accounts and authentication             │
│  - Columns: id, email, name, avatar_url, role,          │
│    auth_provider, github_id, github_username,           │
│    github_access_token, plan, is_active,                │
│    pending_approval, created_at, updated_at             │
│                                                         │
│  D2: code_analyses                                      │
│  - Code analysis results and metrics                    │
│  - Columns: id, user_id, repo_url, status, progress,    │
│    system_overview, technical_structure,                │
│    maintenance_needs, ai_explanations,                  │
│    code_quality_score, total_files, total_lines,        │
│    languages, frameworks, created_at, completed_at      │
│                                                         │
│  D3: url_analyses                                       │
│  - Website analysis results                             │
│  - Columns: id, user_id, url, status, progress,         │
│    meta_tags, performance_metrics, seo_score,           │
│    accessibility_score, security_headers,               │
│    page_speed_results, detected_language, created_at    │
│                                                         │
│  D4: content_templates                                  │
│  - Content generation templates                         │
│  - Columns: id, name, category, structure,              │
│    prompt_template, is_system, translations,            │
│    created_at, updated_at                               │
│                                                         │
│  D5: generated_content                                  │
│  - AI-generated content records                         │
│  - Columns: id, user_id, template_id, content,          │
│    metadata, language, translations, seo_score,         │
│    created_at                                           │
│                                                         │
│  D6: wordpress_connections                              │
│  - Connected WordPress sites                            │
│  - Columns: id, user_id, site_url, site_name,           │
│    api_key (encrypted), site_info, is_active,           │
│    last_sync, created_at                                │
│                                                         │
│  D7: wordpress_pages                                    │
│  - WordPress pages and posts                            │
│  - Columns: id, connection_id, post_id, post_title,     │
│    post_type, editor_type, content, elementor_data,     │
│    blocks, page_url, last_modified, created_at          │
│                                                         │
│  D8: wordpress_files                                    │
│  - WordPress theme files                                │
│  - Columns: id, connection_id, file_path, file_type,    │
│    file_content, file_size, uploaded_at                 │
│                                                         │
│  D9: projects                                           │
│  - User projects (GitHub repos, WordPress sites)        │
│  - Columns: id, name, description, type, owner_id,      │
│    repo_url, wordpress_site_id, is_active, created_at   │
│                                                         │
│  D10: project_members                                   │
│  - Project team members and permissions                 │
│  - Columns: id, project_id, user_id, role,              │
│    modules_access, invited_by, invited_at               │
│                                                         │
│  D11: user_api_keys                                     │
│  - User-provided AI API keys (encrypted)                │
│  - Columns: id, user_id, provider, api_key (encrypted), │
│    is_active, created_at                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Store Relationships

```
users (D1)
  ├── 1:N → code_analyses (D2)
  ├── 1:N → url_analyses (D3)
  ├── 1:N → generated_content (D5)
  ├── 1:N → wordpress_connections (D6)
  ├── 1:N → projects (D9) [as owner]
  ├── N:M → projects (D9) [via project_members D10]
  └── 1:N → user_api_keys (D11)

wordpress_connections (D6)
  ├── 1:N → wordpress_pages (D7)
  └── 1:N → wordpress_files (D8)

content_templates (D4)
  └── 1:N → generated_content (D5)

projects (D9)
  └── 1:N → project_members (D10)
```

---

## External Systems

### External Service Integrations

```
┌─────────────────────────────────────────────────────────┐
│                  External Services                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  E1: GitHub API                                         │
│  - OAuth authentication                                 │
│  - Repository access                                    │
│  - User profile data                                    │
│  - Endpoints: /login/oauth/authorize, /repos, /user     │
│                                                         │
│  E2: OpenAI API                                         │
│  - GPT-4 Turbo model                                    │
│  - Chat completions (streaming)                         │
│  - Code analysis and generation                         │
│  - Endpoint: /v1/chat/completions                       │
│                                                         │
│  E3: Anthropic API                                      │
│  - Claude 3 Sonnet model                                │
│  - Chat completions                                     │
│  - Content analysis                                     │
│  - Endpoint: /v1/messages                               │
│                                                         │
│  E4: Google AI API                                      │
│  - Gemini 2.5 Flash model                               │
│  - Content generation                                   │
│  - Multilingual support                                 │
│  - Endpoint: /v1/models/gemini-2.5-flash:generateContent│
│                                                         │
│  E5: Supabase                                           │
│  - PostgreSQL database hosting                          │
│  - Authentication (email, Google OAuth)                 │
│  - Real-time subscriptions                              │
│  - Storage (planned)                                    │
│                                                         │
│  E6: WordPress REST API                                 │
│  - Site information                                     │
│  - Pages and posts data                                 │
│  - Theme files (via custom plugin)                      │
│  - Endpoints: /wp-json/wp/v2/*, /wp-json/codeanalyst/*  │
│                                                         │
│  E7: Google PageSpeed Insights API                      │
│  - Performance metrics                                  │
│  - Core Web Vitals                                      │
│  - Mobile and desktop scores                            │
│  - Endpoint: /pagespeedonline/v5/runPagespeed           │
│                                                         │
│  E8: Beenex CRM API (Planned)                           │
│  - Customer data synchronization                        │
│  - Project management integration                       │
│  - Custom endpoints (TBD)                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Planned Features (Future DFDs)

### 1. Real-Time Collaboration (Planned)
- Multiple users editing same project simultaneously
- Live cursor tracking
- Change synchronization via WebSockets

### 2. CI/CD Integration (Planned)
- Automatic code analysis on git push
- GitHub Actions integration
- Automated deployment suggestions

### 3. Advanced Analytics Dashboard (Planned)
- Project health trends over time
- Team productivity metrics
- Code quality evolution charts

### 4. Beenex CRM Integration (Planned)
- Customer project linking
- Automated reporting to CRM
- Invoice generation based on analysis

### 5. API for Third-Party Integrations (Planned)
- RESTful API for external tools
- Webhooks for event notifications
- SDK for popular languages

### 6. Advanced WordPress Features (Planned)
- Direct page editing from CodeAnalyst
- Live preview of changes
- One-click deployment to WordPress

---

## Data Flow Summary

### Key Data Flows
1. **Authentication Flow**: User credentials → Backend → Database → JWT token
2. **Code Analysis Flow**: Code files → Parser → AI Service → Database → Report
3. **Website Analysis Flow**: URL → Fetcher → Analyzers → Database → Report
4. **Content Analysis Flow**: Text → Language Detector → Analyzers → AI → Report
5. **Auto Programmer Flow**: User message → AI → Code parser → Preview → Apply
6. **Content Creator Flow**: Template + Input → AI → Content → Database → Export
7. **WordPress Integration Flow**: API key → Connection → Data sync → Database

### Data Security
- **Encryption**: All API keys encrypted at rest (AES-256)
- **HTTPS**: All communications over TLS 1.3
- **JWT**: Secure token-based authentication (30-day expiration)
- **CORS**: Strict origin policies
- **Rate Limiting**: API request throttling (planned)

### Performance Considerations
- **Streaming**: AI responses streamed for better UX
- **Caching**: Analysis results cached in database
- **Async Processing**: Long-running tasks processed asynchronously
- **Connection Pooling**: Database connection pooling (max 5 connections)

---

*This Data Flow Diagram documentation provides a comprehensive view of how data moves through the CodeAnalyst system, from user input to final output, including all implemented and planned modules.*

