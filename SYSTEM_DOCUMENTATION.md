# CodeAnalyst System Documentation

Comprehensive system architecture, database schema, and UML documentation

## Table of Contents

1. [Database Schema Diagram](#database-schema-diagram)
2. [System Overview Class Diagram](#system-overview-class-diagram)
3. [Authentication Flow](#authentication-flow)
4. [Analysis Workflow](#analysis-workflow)
5. [Module Architecture](#module-architecture)
6. [User Role & Permission System](#user-role--permission-system)
7. [API Endpoint Structure](#api-endpoint-structure)
8. [Key System Features](#key-system-features)
9. [Security Features](#security-features)
10. [Deployment Architecture](#deployment-architecture)

---

## 1. Database Schema Diagram

```mermaid
erDiagram
    users ||--o{ user_api_keys : "has"
    users ||--o{ projects : "owns"
    users ||--o{ wordpress_connections : "has"
    users ||--o{ api_usage_logs : "tracks"
    users ||--o{ user_roles : "has"
    users ||--o{ project_users : "invited_to"
    users ||--o{ user_activation_log : "logged"
    
    projects ||--o{ url_analyses : "contains"
    projects ||--o{ code_analyses : "contains"
    projects ||--o{ analysis_history : "tracks"
    projects ||--o{ project_users : "has_members"
    projects ||--o{ module_permissions : "has_permissions"
    
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR name
        BIGINT github_id UK
        VARCHAR github_username
        TEXT github_access_token
        TEXT avatar_url
        VARCHAR plan
        INTEGER api_usage_count
        TIMESTAMP last_login
        BOOLEAN is_active
        BOOLEAN pending_approval
        TIMESTAMP approved_at
        UUID approved_by FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    user_api_keys {
        UUID id PK
        UUID user_id FK
        VARCHAR provider
        TEXT encrypted_key
        VARCHAR key_name
        BOOLEAN is_active
        TIMESTAMP last_used
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    projects {
        UUID id PK
        UUID user_id FK
        UUID admin_id FK
        VARCHAR name
        TEXT description
        VARCHAR type
        TEXT source_url
        VARCHAR github_repo
        VARCHAR status
        JSONB settings
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    user_roles {
        UUID id PK
        UUID user_id FK
        VARCHAR role
        TIMESTAMP created_at
        UUID created_by FK
    }
    
    project_users {
        UUID id PK
        UUID project_id FK
        UUID user_id FK
        UUID invited_by FK
        TIMESTAMP invited_at
        BOOLEAN is_active
    }
    
    module_permissions {
        UUID id PK
        UUID project_id FK
        UUID user_id FK
        VARCHAR module_name
        BOOLEAN has_access
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    url_analyses {
        UUID id PK
        UUID project_id FK
        TEXT url
        TEXT title
        VARCHAR status
        TEXT html_content
        JSONB meta_tags
        TEXT[] technologies
        JSONB scripts
        JSONB stylesheets
        JSONB links
        JSONB images
        JSONB performance_metrics
        JSONB seo_analysis
        JSONB accessibility_analysis
        JSONB security_analysis
        JSONB ai_insights
        JSONB business_recommendations
        JSONB technical_recommendations
        JSONB risk_assessment
        INTEGER analysis_duration_ms
        VARCHAR ai_provider
        VARCHAR ai_model
        DECIMAL confidence_score
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    code_analyses {
        UUID id PK
        UUID project_id FK
        VARCHAR source_type
        TEXT source_reference
        VARCHAR status
        INTEGER total_files
        INTEGER total_lines
        TEXT[] languages
        TEXT[] frameworks
        INTEGER code_quality_score
        DECIMAL technical_debt_percentage
        DECIMAL test_coverage_percentage
        DECIMAL complexity_score
        JSONB system_overview
        JSONB technical_structure
        JSONB maintenance_needs
        JSONB ai_explanations
        JSONB business_recommendations
        JSONB risk_assessment
        JSONB test_results
        JSONB build_results
        JSONB static_analysis_results
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    ai_response_cache {
        UUID id PK
        VARCHAR input_hash UK
        VARCHAR provider
        VARCHAR model
        TEXT prompt_text
        TEXT response_text
        DECIMAL confidence_score
        INTEGER token_count
        INTEGER response_time_ms
        TIMESTAMP created_at
        TIMESTAMP expires_at
    }
    
    api_usage_logs {
        UUID id PK
        UUID user_id FK
        UUID analysis_id
        VARCHAR analysis_type
        VARCHAR provider
        VARCHAR model
        INTEGER tokens_used
        DECIMAL cost_usd
        INTEGER duration_ms
        BOOLEAN success
        TEXT error_message
        TIMESTAMP created_at
    }
    
    analysis_history {
        UUID id PK
        UUID project_id FK
        VARCHAR analysis_type
        UUID analysis_id
        INTEGER previous_score
        INTEGER current_score
        INTEGER score_change
        JSONB changes_detected
        TEXT[] improvement_areas
        TEXT[] regression_areas
        TIMESTAMP created_at
    }
    
    wordpress_connections {
        UUID id PK
        UUID user_id FK
        UUID project_id FK
        VARCHAR api_key UK
        TEXT site_url
        VARCHAR site_name
        VARCHAR wordpress_version
        VARCHAR active_theme
        JSONB active_plugins
        JSONB site_health
        VARCHAR php_version
        BOOLEAN is_connected
        TIMESTAMP last_sync
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    user_activation_log {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        UUID performed_by FK
        TEXT reason
        TIMESTAMP created_at
    }
```

---

## 2. System Overview Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String name
        +String plan
        +Boolean isActive
        +login()
        +logout()
        +updateProfile()
    }
    
    class Project {
        +UUID id
        +String name
        +String type
        +String status
        +createAnalysis()
        +getAnalyses()
        +updateSettings()
    }
    
    class Analysis {
        +UUID id
        +String status
        +DateTime createdAt
        +analyze()
        +getResults()
    }
    
    class URLAnalysis {
        +String url
        +Object performanceMetrics
        +Object seoAnalysis
        +Object securityAnalysis
        +scanWebsite()
        +generateReport()
    }
    
    class CodeAnalysis {
        +String sourceType
        +Integer totalFiles
        +Array languages
        +Integer qualityScore
        +analyzeCode()
        +calculateMetrics()
    }
    
    class AIService {
        +String provider
        +String model
        +generateInsights()
        +analyzeContent()
        +cacheResponse()
    }
    
    class WordPressConnection {
        +String siteUrl
        +String apiKey
        +Boolean isConnected
        +syncData()
        +getHealth()
    }
    
    class UserRole {
        +String role
        +checkPermission()
        +hasAccess()
    }
    
    class ModulePermission {
        +String moduleName
        +Boolean hasAccess
        +grantAccess()
        +revokeAccess()
    }
    
    User "1" --> "*" Project : owns
    User "1" --> "*" UserRole : has
    User "1" --> "*" WordPressConnection : manages
    Project "1" --> "*" Analysis : contains
    Analysis <|-- URLAnalysis
    Analysis <|-- CodeAnalysis
    Analysis --> AIService : uses
    Project "1" --> "*" ModulePermission : has
    User "*" --> "*" Project : member_of
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant GitHub
    participant Supabase
    
    alt GitHub OAuth
        User->>Frontend: Click "Login with GitHub"
        Frontend->>GitHub: Redirect to OAuth
        GitHub->>User: Request authorization
        User->>GitHub: Approve
        GitHub->>Backend: Callback with code
        Backend->>GitHub: Exchange code for token
        GitHub->>Backend: Return access token
        Backend->>Database: Create/Update user
        Backend->>Frontend: Return JWT token
    else Email/Password
        User->>Frontend: Enter credentials
        Frontend->>Backend: POST /auth/login-supabase
        Backend->>Database: Verify credentials
        Database->>Backend: User data
        Backend->>Backend: Generate JWT
        Backend->>Frontend: Return JWT token
    else Google OAuth (Supabase)
        User->>Frontend: Click "Login with Google"
        Frontend->>Supabase: OAuth request
        Supabase->>User: Google auth
        User->>Supabase: Approve
        Supabase->>Backend: User data
        Backend->>Database: Sync user
        Backend->>Frontend: Return JWT token
    end
    
    Frontend->>Frontend: Store token in localStorage
    Frontend->>User: Redirect to Dashboard
```

---

## 4. Analysis Workflow

```mermaid
stateDiagram-v2
    [*] --> SelectModule: User logs in
    SelectModule --> WebsiteAnalyst: Choose Website Analysis
    SelectModule --> CodeAnalyst: Choose Code Analysis
    SelectModule --> ContentAnalyst: Choose Content Analysis
    SelectModule --> ContentCreator: Choose Content Creation
    SelectModule --> AutoProgrammer: Choose Auto Programming
    
    WebsiteAnalyst --> EnterURL: Input website URL
    EnterURL --> ScanWebsite: Start scan
    ScanWebsite --> CollectData: Fetch HTML, scripts, styles
    CollectData --> AnalyzeMetrics: Performance, SEO, Security
    AnalyzeMetrics --> AIAnalysis: Generate AI insights
    AIAnalysis --> SaveResults: Store in database
    SaveResults --> DisplayReport: Show to user
    
    CodeAnalyst --> UploadCode: Upload ZIP/GitHub
    UploadCode --> ParseCode: Extract files
    ParseCode --> DetectLanguages: Identify tech stack
    DetectLanguages --> CalculateMetrics: Quality, complexity, debt
    CalculateMetrics --> AICodeAnalysis: AI recommendations
    AICodeAnalysis --> SaveCodeResults: Store analysis
    SaveCodeResults --> DisplayCodeReport: Show report
    
    DisplayReport --> [*]
    DisplayCodeReport --> [*]
```

---

## 5. Module Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (React + TypeScript + Vite)"]
        UI[User Interface]
        Auth[Auth Store]
        Project[Project Context]
        Services[Frontend Services]
        
        subgraph Modules["Analysis Modules"]
            WA[Website Analyst]
            CA[Code Analyst]
            CNA[Content Analyst]
            CC[Content Creator]
            AP[Auto Programmer]
        end
    end
    
    subgraph Backend["Backend (Node.js + Express)"]
        API[API Routes]
        Middleware[Auth Middleware]
        
        subgraph BackendServices["Services"]
            DB[Database Service]
            AI[AI Analysis Service]
            WP[WordPress Service]
            GitHub[GitHub Service]
            Queue[Queue Service]
        end
    end
    
    subgraph Database["Database (PostgreSQL/Supabase)"]
        Users[(Users)]
        Projects[(Projects)]
        Analyses[(Analyses)]
        Cache[(AI Cache)]
        Logs[(Usage Logs)]
    end
    
    subgraph External["External Services"]
        OpenAI[OpenAI API]
        GoogleAI[Google AI API]
        GitHubAPI[GitHub API]
        SupabaseAuth[Supabase Auth]
    end
    
    UI --> Auth
    UI --> Project
    UI --> Services
    Modules --> Services
    Services --> API
    API --> Middleware
    Middleware --> BackendServices
    BackendServices --> Database
    BackendServices --> External
```

---

## 6. User Role & Permission System

```mermaid
graph TD
    subgraph Roles["User Roles"]
        SA[Superadmin]
        Admin[Admin]
        User[Regular User]
    end
    
    subgraph Permissions["Permissions"]
        SA --> ManageUsers[Manage All Users]
        SA --> ManageProjects[Manage All Projects]
        SA --> ViewAnalytics[View System Analytics]
        SA --> ConfigureSystem[System Configuration]
        
        Admin --> CreateProject[Create Projects]
        Admin --> InviteUsers[Invite Users to Projects]
        Admin --> ManageModules[Manage Module Access]
        Admin --> ViewProjectData[View Project Data]
        
        User --> ViewOwnProjects[View Own Projects]
        User --> RunAnalyses[Run Analyses]
        User --> ViewResults[View Results]
    end
    
    subgraph Modules["Module Access Control"]
        WA2[Website Analyst]
        CA2[Code Analyst]
        CNA2[Content Analyst]
        CC2[Content Creator]
        AP2[Auto Programmer]
    end
    
    ManageModules --> WA2
    ManageModules --> CA2
    ManageModules --> CNA2
    ManageModules --> CC2
    ManageModules --> AP2
```

---

## 7. API Endpoint Structure

```mermaid
graph LR
    subgraph Auth["Authentication /api/auth"]
        Login[POST /login]
        Register[POST /register]
        GitHub[GET /github]
        Callback[GET /github/callback]
        Supabase[POST /login-supabase]
    end
    
    subgraph Projects["Projects /api/projects"]
        GetProjects[GET /]
        CreateProject[POST /]
        UpdateProject[PUT /:id]
        DeleteProject[DELETE /:id]
        InviteUser[POST /:id/invite]
    end
    
    subgraph Analysis["Analysis /api"]
        URLAnalysis[POST /url-analysis]
        CodeAnalysis[POST /code-analysis]
        ContentAnalysis[POST /content-analysis]
        GetAnalysis[GET /analysis/:id]
    end
    
    subgraph Admin["Admin /api/superadmin"]
        GetUsers[GET /users]
        ApproveUser[POST /users/:id/approve]
        DeactivateUser[POST /users/:id/deactivate]
        GetAllProjects[GET /projects]
    end
    
    subgraph WordPress["WordPress /api/wordpress"]
        Connect[POST /connect]
        GetSites[GET /sites]
        Sync[POST /sync/:id]
        Disconnect[DELETE /disconnect/:id]
    end
```

---

## 8. Key System Features

### Authentication System
- **GitHub OAuth**: Custom implementation for GitHub authentication
- **Email/Password**: Supabase Auth integration with bcrypt hashing
- **Google OAuth**: Supabase Auth (ready for implementation)
- **JWT Tokens**: 30-day expiration, stored in localStorage
- **Session Management**: Persistent across page reloads

### User Management
- **Role-Based Access Control (RBAC)**: Superadmin, Admin, User roles
- **User Approval System**: New users require approval before activation
- **Module Permissions**: Granular access control per module per project
- **Activation Logging**: Audit trail for user activation/deactivation

### Project Management
- **Multi-User Projects**: Admins can invite users to projects
- **Project Types**: GitHub, ZIP upload, URL, WordPress
- **Module Access**: Control which modules users can access per project
- **Project Settings**: Customizable JSONB settings per project

### Analysis Modules
1. **Website Analyst**: URL scanning, SEO, performance, security analysis
2. **Code Analyst**: Code quality, complexity, technical debt analysis
3. **Content Analyst**: Content analysis and recommendations
4. **Content Creator**: AI-powered content generation
5. **Auto Programmer**: Automated code generation

### AI Integration
- **Multi-Provider Support**: OpenAI, Google AI, Anthropic
- **Response Caching**: 24-hour cache to reduce API costs
- **Usage Tracking**: Token usage and cost tracking per user
- **Encrypted API Keys**: User-provided API keys stored with AES encryption

### WordPress Integration
- **Site Connection**: Connect WordPress sites via API key
- **Health Monitoring**: Track site health, plugins, themes
- **Data Sync**: Synchronize WordPress data for analysis

---

## 9. Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based auth
- **Row Level Security (RLS)**: PostgreSQL RLS policies
- **API Key Encryption**: AES encryption for stored API keys
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: API rate limiting middleware
- **CORS Protection**: Configured CORS policies

---

## 10. Deployment Architecture

| Component | Platform | Technology | Auto-Deploy |
|-----------|----------|------------|-------------|
| Frontend | Vercel | React + TypeScript + Vite | Yes (main branch) |
| Backend | Railway | Node.js + Express | Yes (main branch) |
| Database | Supabase | PostgreSQL | N/A |

### Database Indexes

Performance-optimized indexes on:
- `users(is_active, pending_approval)`
- `projects(user_id, admin_id, is_active)`
- `url_analyses(project_id)`
- `code_analyses(project_id)`
- `ai_response_cache(input_hash)`
- `api_usage_logs(user_id, created_at)`
- `wordpress_connections(user_id, api_key)`

---

**Generated**: 2024
**CodeAnalyst System Documentation v1.0**
