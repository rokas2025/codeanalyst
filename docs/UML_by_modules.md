# UML Documentation by Modules - CodeAnalyst System

## Table of Contents
1. [Authentication Module](#1-authentication-module)
2. [AI Code Analyst Module](#2-ai-code-analyst-module)
3. [AI Website Analyst Module](#3-ai-website-analyst-module)
4. [AI Content Analyst Module](#4-ai-content-analyst-module)
5. [AI Auto Programmer Module](#5-ai-auto-programmer-module)
6. [AI Content Creator Module](#6-ai-content-creator-module)
7. [WordPress Integration Module](#7-wordpress-integration-module)
8. [User Management & Permissions Module](#8-user-management--permissions-module)
9. [Settings & Configuration Module](#9-settings--configuration-module)
10. [Projects Management Module](#10-projects-management-module)

---

## 1. Authentication Module

### Purpose
Hybrid authentication system supporting GitHub OAuth, Email/Password, and Google OAuth with JWT-based session management.

### Class Diagram
```
┌─────────────────────────────────────┐
│         AuthService                 │
├─────────────────────────────────────┤
│ - jwtSecret: string                 │
│ - tokenExpiry: string               │
├─────────────────────────────────────┤
│ + initiateGitHubOAuth()             │
│ + handleGitHubCallback()            │
│ + registerEmailUser()               │
│ + loginEmailUser()                  │
│ + loginWithGoogle()                 │
│ + generateJWT()                     │
│ + verifyJWT()                       │
│ + refreshToken()                    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│         DatabaseService             │
├─────────────────────────────────────┤
│ + createUser()                      │
│ + getUserByEmail()                  │
│ + getUserById()                     │
│ + updateUserToken()                 │
│ + syncSupabaseUser()                │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│         User (Entity)               │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - email: string                     │
│ - name: string                      │
│ - avatar_url: string                │
│ - auth_provider: enum               │
│ - github_id: bigint                 │
│ - github_username: string           │
│ - github_access_token: string       │
│ - plan: string                      │
│ - role: string                      │
│ - is_active: boolean                │
│ - pending_approval: boolean         │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
```

### Sequence Diagram - GitHub OAuth Flow
```
User → Frontend: Click "Login with GitHub"
Frontend → Backend: GET /api/auth/github
Backend → Frontend: Return authUrl + state
Frontend → GitHub: Redirect to OAuth
GitHub → User: Request authorization
User → GitHub: Approve
GitHub → Backend: Callback with code
Backend → GitHub: Exchange code for token
GitHub → Backend: Return access_token
Backend → GitHub API: Fetch user profile
Backend → Database: Create/update user
Backend → Frontend: Return JWT token
Frontend → LocalStorage: Store token
Frontend → Dashboard: Redirect user
```

### Key Components
- **Routes**: `/api/auth/github`, `/api/auth/github/callback`, `/api/auth/register`, `/api/auth/login`, `/api/auth/supabase`
- **Middleware**: `authMiddleware` (JWT verification)
- **Database Tables**: `users`
- **External Services**: GitHub OAuth API, Supabase Auth

---

## 2. AI Code Analyst Module

### Purpose
Analyzes source code from GitHub repositories, ZIP uploads, or WordPress themes using AI to provide quality scores, security assessments, and improvement recommendations.

### Class Diagram
```
┌─────────────────────────────────────┐
│      CodeAnalystService             │
├─────────────────────────────────────┤
│ - aiService: AIService              │
│ - analyzer: AdoreInoAnalyzer        │
├─────────────────────────────────────┤
│ + analyzeGitHubRepo()               │
│ + analyzeZipUpload()                │
│ + analyzeWordPressTheme()           │
│ + generateReport()                  │
│ + calculateQualityScore()           │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│      AdoreInoAnalyzer               │
├─────────────────────────────────────┤
│ + analyzeFiles()                    │
│ + detectLanguages()                 │
│ + detectFrameworks()                │
│ + calculateComplexity()             │
│ + assessSecurity()                  │
│ + detectCodeSmells()                │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│      AIService                      │
├─────────────────────────────────────┤
│ + analyzeCodeQuality()              │
│ + generateRecommendations()         │
│ + assessArchitecture()              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   CodeAnalysis (Entity)             │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - repo_url: string                  │
│ - status: enum                      │
│ - progress: integer                 │
│ - system_overview: JSONB            │
│ - technical_structure: JSONB        │
│ - maintenance_needs: JSONB          │
│ - ai_explanations: JSONB            │
│ - code_quality_score: integer       │
│ - total_files: integer              │
│ - total_lines: integer              │
│ - languages: JSONB                  │
│ - frameworks: JSONB                 │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
```

### Activity Diagram - Code Analysis Flow
```
[Start] → [Select Input Method]
           ↓
    ┌──────┴──────┬──────────┐
    ↓             ↓          ↓
[GitHub]    [ZIP Upload]  [WordPress]
    ↓             ↓          ↓
[Fetch Repo] [Extract ZIP] [Fetch Theme]
    ↓             ↓          ↓
    └──────┬──────┴──────────┘
           ↓
    [Parse Files]
           ↓
    [Detect Languages/Frameworks]
           ↓
    [Calculate Metrics]
           ↓
    [Run AI Analysis]
           ↓
    [Generate Quality Score]
           ↓
    [Create Recommendations]
           ↓
    [Store Results in DB]
           ↓
    [Display Report]
           ↓
         [End]
```

### Key Features
- **Input Methods**: GitHub repository URL, ZIP file upload, WordPress theme analysis
- **Metrics**: Code quality score (0-100), complexity score, technical debt percentage, test coverage
- **Analysis Types**: Architecture assessment, security vulnerabilities, code smells, dependency analysis
- **AI Providers**: OpenAI GPT-4, Anthropic Claude, Google Gemini

---

## 3. AI Website Analyst Module

### Purpose
Comprehensive website analysis including performance metrics, SEO evaluation, accessibility checks, and security headers assessment.

### Class Diagram
```
┌─────────────────────────────────────┐
│    WebsiteAnalystService            │
├─────────────────────────────────────┤
│ - urlFetcher: URLFetcher            │
│ - aiService: AIService              │
├─────────────────────────────────────┤
│ + analyzeURL()                      │
│ + fetchPageContent()                │
│ + analyzePerformance()              │
│ + analyzeSEO()                      │
│ + analyzeAccessibility()            │
│ + analyzeSecurityHeaders()          │
│ + generateReport()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│       URLFetcher                    │
├─────────────────────────────────────┤
│ + fetchHTML()                       │
│ + extractMetaTags()                 │
│ + extractLinks()                    │
│ + extractImages()                   │
│ + measureLoadTime()                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    URLAnalysis (Entity)             │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - url: string                       │
│ - status: enum                      │
│ - meta_tags: JSONB                  │
│ - performance_metrics: JSONB        │
│ - seo_score: integer                │
│ - accessibility_score: integer      │
│ - security_headers: JSONB           │
│ - page_speed_results: JSONB         │
│ - detected_language: string         │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
```

### Component Diagram
```
┌────────────────────────────────────────────────┐
│         Website Analyst Frontend               │
│  ┌──────────────────────────────────────────┐  │
│  │  URL Input Component                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  WordPress Site Selector                 │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Analysis Progress Indicator             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Website Analysis Report                 │  │
│  │  - Performance Metrics                   │  │
│  │  - SEO Analysis                          │  │
│  │  - Accessibility Checks                  │  │
│  │  - Security Headers                      │  │
│  │  - PageSpeed Insights                    │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│         Backend API                            │
│  POST /api/analysis/url                        │
│  GET /api/analysis/:id                         │
└────────────────────────────────────────────────┘
```

### Key Features
- **Performance Analysis**: Load time, resource size, HTTP requests count
- **SEO Evaluation**: Meta tags, headings structure, keyword density, Open Graph tags
- **Accessibility**: ARIA labels, semantic HTML, alt text coverage
- **Security**: HTTPS, security headers (CSP, HSTS, X-Frame-Options)
- **PageSpeed Integration**: Google PageSpeed Insights API integration

---

## 4. AI Content Analyst Module

### Purpose
Analyzes text content for grammar, readability, SEO optimization, and provides improvement suggestions with multilingual support.

### Class Diagram
```
┌─────────────────────────────────────┐
│    ContentAnalystService            │
├─────────────────────────────────────┤
│ - aiService: AIService              │
│ - languageDetector: LanguageDetect  │
├─────────────────────────────────────┤
│ + analyzeContent()                  │
│ + checkGrammar()                    │
│ + calculateReadability()            │
│ + analyzeSEO()                      │
│ + extractKeywords()                 │
│ + detectLanguage()                  │
│ + generateImprovedVersion()         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    ContentAnalysis (Result)         │
├─────────────────────────────────────┤
│ - original: string                  │
│ - improved: string                  │
│ - grammar: GrammarResult            │
│ - readability: ReadabilityResult    │
│ - seo: SEOResult                    │
│ - keywords: string[]                │
│ - detectedLanguage: string          │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    GrammarResult                    │
├─────────────────────────────────────┤
│ - score: number (0-100)             │
│ - issues: Issue[]                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    ReadabilityResult                │
├─────────────────────────────────────┤
│ - score: number (0-100)             │
│ - suggestions: string[]             │
│ - fleschKincaid: number             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    SEOResult                        │
├─────────────────────────────────────┤
│ - score: number (0-100)             │
│ - suggestions: string[]             │
│ - factors: string[]                 │
│ - metrics: SEOMetrics               │
└─────────────────────────────────────┘
```

### Use Case Diagram
```
        ┌──────────────┐
        │     User     │
        └──────┬───────┘
               │
    ┌──────────┼──────────────┬──────────────┐
    ↓          ↓              ↓              ↓
[Enter Text] [Paste URL] [Select WP Page] [Upload File]
    │          │              │              │
    └──────────┴──────────────┴──────────────┘
                      ↓
            [Analyze Content]
                      ↓
        ┌─────────────┴─────────────┐
        ↓                           ↓
[View Analysis Report]    [Copy Improved Version]
        ↓
[Export Results]
```

### Key Features
- **Input Methods**: Direct text, URL scraping, WordPress page selection
- **Grammar Analysis**: AI-powered grammar checking with issue detection
- **Readability Metrics**: Flesch-Kincaid score, sentence complexity, paragraph structure
- **SEO Analysis**: Word count, keyword density, heading structure, meta description quality
- **Language Support**: Auto-detection (English, Lithuanian, and more)
- **Improvement Suggestions**: AI-generated improved version of content

---

## 5. AI Auto Programmer Module

### Purpose
Chat-based AI assistant for code generation, feature implementation, and automated code changes with support for GitHub projects and WordPress sites.

### Class Diagram
```
┌─────────────────────────────────────┐
│    AutoProgrammerService            │
├─────────────────────────────────────┤
│ - chatService: ChatService          │
│ - githubService: GitHubService      │
│ - wordpressService: WordPressService│
├─────────────────────────────────────┤
│ + sendChatMessage()                 │
│ + generateCode()                    │
│ + parseCodeChanges()                │
│ + applyChanges()                    │
│ + previewChanges()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│       ChatService                   │
├─────────────────────────────────────┤
│ - openaiClient: OpenAI              │
│ - conversationHistory: Message[]    │
├─────────────────────────────────────┤
│ + streamResponse()                  │
│ + buildContext()                    │
│ + formatResponse()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│       Message (Entity)              │
├─────────────────────────────────────┤
│ - id: string                        │
│ - role: 'user' | 'assistant'        │
│ - content: string                   │
│ - timestamp: Date                   │
│ - parts: MessagePart[]              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       CodeChange (Entity)           │
├─────────────────────────────────────┤
│ - id: string                        │
│ - file: string                      │
│ - type: 'create'|'modify'|'delete'  │
│ - content: string                   │
│ - approved: boolean                 │
└─────────────────────────────────────┘
```

### Sequence Diagram - Code Generation Flow
```
User → Frontend: Type message "Add login form"
Frontend → Backend: POST /api/chat
Backend → OpenAI: Stream chat completion
OpenAI → Backend: Stream response chunks
Backend → Frontend: Stream text deltas
Frontend → UI: Display streaming response
OpenAI → Backend: Complete with code blocks
Backend → Frontend: Parse FILE/ACTION/CODE format
Frontend → CodePreview: Display proposed changes
User → Frontend: Review changes
User → Frontend: Click "Apply Changes"
Frontend → FileTree: Update virtual file system
Frontend → PreviewPane: Refresh preview
```

### State Diagram - Chat Session States
```
[Idle]
  ↓ User selects project
[Project Selected]
  ↓ User sends message
[Waiting for Response]
  ↓ Streaming starts
[Receiving Response]
  ↓ Stream complete
[Response Complete]
  ↓ Code changes detected
[Changes Pending Review]
  ↓ User approves
[Applying Changes]
  ↓ Changes applied
[Changes Applied] → [Idle]
```

### Key Features
- **Project Types**: GitHub repositories, WordPress sites
- **Chat Interface**: Real-time streaming responses with message history
- **Code Generation**: Structured FILE/ACTION/CODE format for GitHub projects
- **HTML Generation**: Inline-styled HTML sections for WordPress (preview-only)
- **Builder Detection**: Auto-detects Elementor, Gutenberg, Divi, Classic Editor
- **Preview System**: Live preview of code changes before applying
- **Context Awareness**: Project structure, file content, selected files

---

## 6. AI Content Creator Module

### Purpose
Generates new content with AI using customizable templates, SEO optimization, and multilingual support with translation capabilities.

### Class Diagram
```
┌─────────────────────────────────────┐
│    ContentCreatorService            │
├─────────────────────────────────────┤
│ - aiService: AIService              │
│ - templateService: TemplateService  │
│ - translationService: Translation   │
├─────────────────────────────────────┤
│ + generateContent()                 │
│ + applyTemplate()                   │
│ + optimizeForSEO()                  │
│ + translateContent()                │
│ + exportContent()                   │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    TemplateService                  │
├─────────────────────────────────────┤
│ + getTemplates()                    │
│ + createTemplate()                  │
│ + updateTemplate()                  │
│ + deleteTemplate()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    ContentTemplate (Entity)         │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - name: string                      │
│ - category: string                  │
│ - structure: JSONB                  │
│ - prompt_template: text             │
│ - is_system: boolean                │
│ - translations: JSONB               │
│ - created_at: timestamp             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    GeneratedContent (Entity)        │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - template_id: UUID                 │
│ - content: text                     │
│ - metadata: JSONB                   │
│ - language: string                  │
│ - translations: JSONB               │
│ - seo_score: integer                │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
```

### Component Diagram
```
┌────────────────────────────────────────────────┐
│      Content Creator Frontend                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Template Selector                       │  │
│  │  - Blog Post                             │  │
│  │  - Product Description                   │  │
│  │  - Social Media Post                     │  │
│  │  - Email Newsletter                      │  │
│  │  - Landing Page                          │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Input Form (Dynamic)                    │  │
│  │  - Topic/Title                           │  │
│  │  - Keywords                              │  │
│  │  - Tone/Style                            │  │
│  │  - Target Audience                       │  │
│  │  - Word Count                            │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Settings Panel                          │  │
│  │  - Language Selection                    │  │
│  │  - SEO Optimization                      │  │
│  │  - Creativity Level                      │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Enhanced Preview                        │  │
│  │  - Live Preview                          │  │
│  │  - SEO Score                             │  │
│  │  - Readability Metrics                   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Export Options                          │  │
│  │  - Copy to Clipboard                     │  │
│  │  - Download as HTML/MD/TXT               │  │
│  │  - Translate to Other Languages          │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Key Features
- **Template System**: Pre-built templates for various content types
- **AI Generation**: Context-aware content generation with customizable parameters
- **SEO Optimization**: Automatic keyword integration, meta description generation
- **Multilingual Support**: Content generation in multiple languages
- **Translation**: Translate generated content to other languages
- **Export Formats**: HTML, Markdown, Plain Text
- **Preview**: Real-time preview with formatting

---

## 7. WordPress Integration Module

### Purpose
Connects WordPress sites to CodeAnalyst for theme analysis, content management, and page editing through a WordPress plugin.

### Class Diagram
```
┌─────────────────────────────────────┐
│    WordPressService                 │
├─────────────────────────────────────┤
│ - apiUrl: string                    │
│ - apiKey: string                    │
├─────────────────────────────────────┤
│ + generateApiKey()                  │
│ + connectSite()                     │
│ + getSites()                        │
│ + getPages()                        │
│ + getThemeFiles()                   │
│ + getPageContent()                  │
│ + detectBuilder()                   │
│ + disconnectSite()                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   WordPressConnection (Entity)      │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - site_url: string                  │
│ - site_name: string                 │
│ - api_key: string (encrypted)       │
│ - site_info: JSONB                  │
│ - is_active: boolean                │
│ - last_sync: timestamp              │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   WordPressPage (Entity)            │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - connection_id: UUID               │
│ - post_id: bigint                   │
│ - post_title: string                │
│ - post_type: string                 │
│ - editor_type: string               │
│ - content: text                     │
│ - elementor_data: JSONB             │
│ - blocks: JSONB                     │
│ - page_url: string                  │
│ - last_modified: timestamp          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   WordPressFile (Entity)            │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - connection_id: UUID               │
│ - file_path: string                 │
│ - file_type: string                 │
│ - file_content: text                │
│ - file_size: integer                │
│ - uploaded_at: timestamp            │
└─────────────────────────────────────┘
```

### Sequence Diagram - WordPress Site Connection
```
User → Settings: Click "Generate API Key"
Settings → Backend: POST /api/wordpress/generate-key
Backend → Database: Create API key (encrypted)
Backend → Settings: Return API key
Settings → User: Display API key
User → WordPress Plugin: Enter API key
WordPress Plugin → Backend: POST /api/wordpress/connect
Backend → Database: Verify API key
Backend → WordPress Plugin: Request site info
WordPress Plugin → Backend: Send site info (name, URL, version, theme)
Backend → Database: Store connection
Backend → WordPress Plugin: Connection successful
WordPress Plugin → User: Show success message
```

### Key Features
- **API Key Generation**: Secure encrypted API keys for WordPress plugin
- **Site Connection**: One-click connection from WordPress admin
- **Theme Analysis**: Fetch and analyze WordPress theme files
- **Page Management**: List and fetch pages with editor detection
- **Builder Support**: Elementor, Gutenberg, Divi, Classic Editor
- **Content Sync**: Fetch page content for analysis and editing
- **Security**: Encrypted API keys, user-specific connections

---

## 8. User Management & Permissions Module

### Purpose
Role-based access control system with user approval workflow, project assignments, and module-level permissions.

### Class Diagram
```
┌─────────────────────────────────────┐
│    UserManagementService            │
├─────────────────────────────────────┤
│ + getAllUsers()                     │
│ + approveUser()                     │
│ + deactivateUser()                  │
│ + assignRole()                      │
│ + assignToProject()                 │
│ + setModulePermissions()            │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    RoleMiddleware                   │
├─────────────────────────────────────┤
│ + isSuperAdmin()                    │
│ + isAdmin()                         │
│ + hasProjectAccess()                │
│ + hasModuleAccess()                 │
│ + isActiveUser()                    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    User (Entity)                    │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - email: string                     │
│ - role: enum                        │
│   ('superadmin', 'admin', 'user')   │
│ - is_active: boolean                │
│ - pending_approval: boolean         │
│ - plan: string                      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    ProjectMember (Entity)           │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - project_id: UUID                  │
│ - user_id: UUID                     │
│ - role: string                      │
│ - permissions: JSONB                │
│ - invited_at: timestamp             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    ModulePermission (Entity)        │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - project_id: UUID                  │
│ - module_name: string               │
│ - has_access: boolean               │
└─────────────────────────────────────┘
```

### State Diagram - User Lifecycle
```
[New User Registers]
        ↓
[Pending Approval] ←──────┐
        ↓                  │
[Admin Reviews]            │
        ↓                  │
    ┌───┴───┐              │
    ↓       ↓              │
[Approve] [Reject]         │
    ↓       ↓              │
[Active]  [Rejected] ──────┘
    ↓
[Assign to Projects]
    ↓
[Set Module Permissions]
    ↓
[User Can Access System]
    ↓
[Admin Can Deactivate]
    ↓
[Inactive]
```

### Permission Hierarchy
```
Superadmin
    ├── Full system access
    ├── User management
    ├── All projects access
    └── All modules access

Admin
    ├── Own projects management
    ├── Invite users to projects
    ├── Set module permissions
    └── View project analytics

User
    ├── Access assigned projects only
    ├── Use permitted modules only
    └── View own analytics
```

### Key Features
- **Roles**: Superadmin, Admin, User
- **User Approval**: Pending approval workflow for new registrations
- **Project Assignment**: Admins assign users to their projects
- **Module Permissions**: Granular access control per module per project
- **Account Status**: Active/Inactive/Pending states

---

## 9. Settings & Configuration Module

### Purpose
Centralized configuration management for AI providers, API keys, integrations, and user preferences.

### Class Diagram
```
┌─────────────────────────────────────┐
│    SettingsService                  │
├─────────────────────────────────────┤
│ + getUserSettings()                 │
│ + updateSettings()                  │
│ + setApiKey()                       │
│ + validateApiKey()                  │
│ + getAvailableProviders()           │
│ + resetToDefaults()                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    UserSettings (Store)             │
├─────────────────────────────────────┤
│ - preferredAiModel: string          │
│ - userApiKeys: APIKeys              │
│ - beenexApiUrl: string              │
│ - beenexApiKey: string              │
│ - theme: 'light' | 'dark'           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    APIKeys (Object)                 │
├─────────────────────────────────────┤
│ - openai: string (encrypted)        │
│ - anthropic: string (encrypted)     │
│ - google: string (encrypted)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    UserApiKey (Entity)              │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - user_id: UUID                     │
│ - provider: string                  │
│ - api_key: string (encrypted)       │
│ - is_active: boolean                │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
```

### Component Diagram
```
┌────────────────────────────────────────────────┐
│         Settings Page                          │
│  ┌──────────────────────────────────────────┐  │
│  │  AI Configuration                        │  │
│  │  - Preferred AI Model Selector           │  │
│  │  - OpenAI API Key Input                  │  │
│  │  - Anthropic API Key Input               │  │
│  │  - Google Gemini API Key Input           │  │
│  │  - Available Providers Status            │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  WordPress Integration                   │  │
│  │  - Generate API Key Button              │  │
│  │  - API Key Display                       │  │
│  │  - Connection Instructions               │  │
│  │  - View Connected Sites Link             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  GitHub Integration                      │  │
│  │  - Connected Account Status              │  │
│  │  - Connect/Disconnect Button             │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Beenex CRM Integration                  │  │
│  │  - API URL Input                         │  │
│  │  - API Key Input                         │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Actions                                 │  │
│  │  - Reset to Defaults Button              │  │
│  │  - Save Settings Button                  │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Key Features
- **AI Provider Management**: Configure OpenAI, Anthropic, Google Gemini
- **API Key Priority**: User keys → Environment keys → Demo mode
- **Encryption**: All API keys encrypted in database
- **WordPress Integration**: Generate and manage WordPress plugin API keys
- **Beenex CRM**: Configure CRM integration (planned)
- **Theme Selection**: Light/Dark mode (planned)

---

## 10. Projects Management Module

### Purpose
Organize and manage GitHub repositories and WordPress sites as projects with team collaboration and module access control.

### Class Diagram
```
┌─────────────────────────────────────┐
│    ProjectService                   │
├─────────────────────────────────────┤
│ + createProject()                   │
│ + getProjects()                     │
│ + getProjectById()                  │
│ + updateProject()                   │
│ + deleteProject()                   │
│ + inviteUser()                      │
│ + removeUser()                      │
│ + setModuleAccess()                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    Project (Entity)                 │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - name: string                      │
│ - description: text                 │
│ - type: 'github' | 'wordpress'      │
│ - owner_id: UUID                    │
│ - repo_url: string                  │
│ - wordpress_site_id: UUID           │
│ - is_active: boolean                │
│ - created_at: timestamp             │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│    ProjectMember (Entity)           │
├─────────────────────────────────────┤
│ - id: UUID                          │
│ - project_id: UUID                  │
│ - user_id: UUID                     │
│ - role: 'owner' | 'member'          │
│ - modules_access: string[]          │
│ - invited_by: UUID                  │
│ - invited_at: timestamp             │
└─────────────────────────────────────┘
```

### Use Case Diagram
```
        ┌──────────────┐
        │    Admin     │
        └──────┬───────┘
               │
    ┌──────────┼──────────────┬──────────────┐
    ↓          ↓              ↓              ↓
[Create     [Invite      [Set Module    [View
 Project]    Users]       Access]        Analytics]
    │          │              │              │
    └──────────┴──────────────┴──────────────┘
                      ↓
        ┌──────────────────────────┐
        │    Regular User          │
        └──────┬───────────────────┘
               │
    ┌──────────┼──────────────┐
    ↓          ↓              ↓
[View       [Use          [View Own
 Assigned   Permitted     Analytics]
 Projects]  Modules]
```

### Key Features
- **Project Types**: GitHub repositories, WordPress sites
- **Ownership**: Admin creates and owns projects
- **Team Collaboration**: Invite users to projects
- **Module Access Control**: Per-user, per-project, per-module permissions
- **Project Dashboard**: Overview of project activity and analytics

---

## Cross-Module Relationships

### Module Interaction Diagram
```
┌─────────────────┐
│  Authentication │
└────────┬────────┘
         ↓ (provides user context)
    ┌────┴────┬────────────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓            ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Code  │ │Website │ │Content │ │  Auto  │ │Content │
│Analyst │ │Analyst │ │Analyst │ │Progrmr │ │Creator │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                      ↓ (all use)
            ┌─────────────────────┐
            │   AI Service        │
            │   (OpenAI/Claude/   │
            │    Gemini)          │
            └─────────────────────┘
                      ↓
            ┌─────────────────────┐
            │   Settings Module   │
            │   (API Keys)        │
            └─────────────────────┘

┌─────────────────┐
│  WordPress      │
│  Integration    │
└────────┬────────┘
         │ (provides data to)
    ┌────┴────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  Code  │ │Website │ │Content │ │  Auto  │
│Analyst │ │Analyst │ │Analyst │ │Progrmr │
└────────┘ └────────┘ └────────┘ └────────┘

┌─────────────────┐
│  User Mgmt &    │
│  Permissions    │
└────────┬────────┘
         │ (controls access to)
    ┌────┴────┬────────────┬────────────┬────────────┐
    ↓         ↓            ↓            ↓            ↓
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Projects│ │  Code  │ │Website │ │Content │ │  Auto  │
│        │ │Analyst │ │Analyst │ │Analyst │ │Progrmr │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

---

## Technology Stack Summary

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **File Handling**: JSZip, react-dropzone

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT, GitHub OAuth, Supabase Auth
- **AI Providers**: OpenAI, Anthropic, Google Gemini
- **Logging**: Winston

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway
- **Database**: Supabase PostgreSQL
- **Version Control**: Git + GitHub

---

## Naming Conventions

### Database Tables
- Lowercase with underscores: `users`, `code_analyses`, `wordpress_connections`
- Plural nouns for entity tables
- Junction tables: `project_members`, `module_permissions`

### API Endpoints
- RESTful conventions: `/api/resource` (GET all), `/api/resource/:id` (GET one)
- Action-based: `/api/auth/login`, `/api/wordpress/connect`

### Code Style
- **Frontend**: camelCase for variables/functions, PascalCase for components
- **Backend**: camelCase for variables/functions, PascalCase for classes
- **Constants**: UPPER_SNAKE_CASE

---

*This UML documentation provides a comprehensive module-by-module breakdown of the CodeAnalyst system architecture, designed for developers, architects, and stakeholders to understand the system structure and relationships.*

