# 📖 Documentation Rules & Standards

## 🎯 Purpose

This document establishes mandatory rules and standards for maintaining CodeAnalyst documentation. **All contributors must follow these rules when making changes to the codebase.**

## 🚨 MANDATORY DOCUMENTATION UPDATES

### When Documentation MUST be Updated

#### ✅ **REQUIRED** - These changes REQUIRE documentation updates:

1. **🆕 New Features**
   - Add feature to appropriate module documentation
   - Update API documentation if endpoints are added
   - Update user guide with new functionality
   - Add to system workflows if applicable

2. **🔧 API Changes**
   - Update endpoint documentation in `docs/api/`
   - Update request/response examples
   - Update error codes and responses
   - Add migration notes for breaking changes

3. **🗄️ Database Schema Changes**
   - Update `docs/database/README.md`
   - Document new tables, columns, indexes
   - Add migration scripts documentation
   - Update entity relationship diagrams

4. **⚙️ Configuration Changes**
   - Update environment variable documentation
   - Update deployment configuration docs
   - Update development setup instructions
   - Document new dependencies

5. **🔐 Authentication/Security Changes**
   - Update authentication flow documentation
   - Update security headers and policies
   - Document new permission levels
   - Update OAuth configuration steps

6. **🎨 UI/UX Changes**
   - Update user guide screenshots
   - Update component documentation
   - Document new user workflows
   - Update accessibility features

#### 📝 **RECOMMENDED** - These changes SHOULD include documentation updates:

- Performance optimizations with user impact
- Bug fixes that change user experience
- Code refactoring that affects API behavior
- Dependency updates with breaking changes

## 📁 Documentation Structure Rules

### File Organization
```
docs/
├── README.md                    # Documentation overview
├── DOCUMENTATION_RULES.md       # This file
├── system/                      # System architecture
│   ├── README.md               # Architecture overview
│   └── workflows.md            # Module workflows
├── api/                        # API documentation
│   ├── README.md               # API overview & endpoints
│   └── examples/               # Request/response examples
├── frontend/                   # Frontend documentation
│   ├── README.md               # Component library
│   └── components/             # Individual component docs
├── database/                   # Database documentation
│   ├── README.md               # Schema overview
│   └── migrations/             # Migration documentation
├── deployment/                 # Deployment guides
│   ├── README.md               # Deployment overview
│   └── platforms/              # Platform-specific guides
├── user/                       # User-facing documentation
│   ├── README.md               # User guide
│   ├── getting-started.md      # Quick start guide
│   └── troubleshooting.md      # Common issues
├── development/                # Developer documentation
│   ├── README.md               # Setup instructions
│   └── code-standards.md       # Coding standards
└── contributing/               # Contributor guidelines
    └── README.md               # How to contribute
```

### File Naming Conventions
- Use `kebab-case` for file names: `getting-started.md`
- Use descriptive names: `github-oauth-setup.md` not `oauth.md`
- Include version in breaking change docs: `api-v2-migration.md`

## ✍️ Writing Standards

### Document Structure
Every documentation file must include:

1. **Clear Title** with emoji for visual identification
2. **Purpose Statement** explaining what the document covers
3. **Table of Contents** for documents > 200 lines
4. **Prerequisites** section when applicable
5. **Step-by-step Instructions** with numbered lists
6. **Code Examples** with syntax highlighting
7. **Cross-references** to related documentation
8. **Last Updated** date at the bottom

### Writing Style Guidelines

#### ✅ **DO:**
- Use clear, concise language
- Write in second person ("you can", "you should")
- Include working code examples
- Use consistent terminology throughout
- Add emojis for better visual scanning
- Include error handling examples
- Cross-reference related documentation

#### ❌ **DON'T:**
- Use jargon without explanation
- Write walls of text without formatting
- Include outdated screenshots or examples
- Reference internal tools users can't access
- Use first person ("I", "we")
- Assume prior knowledge without prerequisites

### Code Example Standards

#### Format Code Blocks
````markdown
```typescript
// Always include language for syntax highlighting
interface User {
  id: string
  email: string
  name: string
}

// Include comments explaining complex logic
const validateUser = (user: User): boolean => {
  return user.email.includes('@') && user.name.length > 0
}
```
````

#### Include Complete Examples
```typescript
// ✅ GOOD - Complete, runnable example
import { useAuthStore } from '../stores/authStore'

export function LoginButton() {
  const { loginWithGitHub, loading } = useAuthStore()
  
  const handleLogin = async () => {
    try {
      await loginWithGitHub()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }
  
  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? 'Signing in...' : 'Sign in with GitHub'}
    </button>
  )
}
```

```typescript
// ❌ BAD - Incomplete, unclear example
const login = () => {
  // Login somehow
}
```

### API Documentation Standards

#### Endpoint Documentation Template
```markdown
### `POST /api/endpoint`
Brief description of what this endpoint does.

**Request Body:**
```json
{
  "field": "value",
  "options": {
    "setting": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "result": "..."
  }
}
```

**Error Responses:**
- `400`: Validation error - Invalid input data
- `401`: Authentication required
- `500`: Internal server error

**Example:**
```bash
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"field": "value"}'
```
```

## 🔄 Update Process

### When Making Code Changes

1. **Before Coding**
   - Check if your changes will require documentation updates
   - Plan which documentation files need updates
   - Create documentation tasks in your development checklist

2. **During Development**
   - Update documentation as you build features
   - Add code comments with examples
   - Test documentation examples to ensure they work

3. **Before Committing**
   - Review documentation changes for accuracy
   - Ensure all links work and examples run
   - Update "Last Updated" dates
   - Add documentation changes to commit message

### Documentation Review Checklist

Before submitting any code changes, verify:

- [ ] All new features are documented
- [ ] API changes are reflected in API docs
- [ ] User-facing changes are in user guide
- [ ] Code examples are tested and working
- [ ] Screenshots are current (if applicable)
- [ ] Cross-references are updated
- [ ] Migration guides are provided for breaking changes
- [ ] Error handling is documented

## 📋 Templates

### New Feature Documentation Template
```markdown
# 🆕 [Feature Name]

## Overview
Brief description of the feature and its purpose.

## How it Works
Step-by-step explanation of the feature workflow.

## Usage
### Frontend
```typescript
// Code example showing how to use the feature
```

### Backend
```javascript
// API usage example
```

## Configuration
Any configuration options or environment variables.

## Limitations
Known limitations or considerations.

## Related Documentation
- [Related Doc 1](../path/to/doc.md)
- [Related Doc 2](../path/to/doc.md)
```

### API Endpoint Documentation Template
```markdown
### `METHOD /api/endpoint/:param`
Description of what this endpoint does.

**Parameters:**
- `param` (string): Description of parameter

**Request Body:**
```json
{
  "required_field": "string",
  "optional_field": "number (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "field": "value"
  }
}
```

**Error Responses:**
- `400`: Bad Request - Description
- `401`: Unauthorized - Description
- `404`: Not Found - Description

**Example Usage:**
```bash
curl -X METHOD "http://localhost:3001/api/endpoint/value" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"required_field": "value"}'
```
```

## 🎯 Quality Metrics

### Documentation Quality Indicators

#### ✅ **High Quality Documentation:**
- All code examples work when copy-pasted
- Screenshots are current and clear
- Links work and point to correct sections
- Information is complete and up-to-date
- Follows consistent formatting
- Includes error handling and edge cases

#### ❌ **Poor Quality Documentation:**
- Broken or missing code examples
- Outdated screenshots or information
- Broken internal/external links
- Missing prerequisite information
- Inconsistent formatting
- No error handling examples

### Regular Maintenance

#### Monthly Reviews
- Check all external links for validity
- Update screenshots if UI has changed
- Review API documentation for accuracy
- Update dependency versions in examples
- Remove outdated information

#### Release Documentation
- Update version numbers in all docs
- Add release notes with breaking changes
- Update migration guides
- Verify all examples work with new version

## 🚨 Enforcement

### Pull Request Requirements
All pull requests must include:

1. **Documentation Impact Assessment**
   - List of documentation files that need updates
   - Explanation of why documentation wasn't updated (if applicable)

2. **Documentation Updates**
   - All required documentation updates included
   - New examples tested and working
   - Links verified and working

3. **Review Checklist**
   - Documentation reviewer assigned
   - All checklist items completed
   - Breaking changes clearly documented

### Automated Checks
- Link checker runs on all documentation
- Code examples are syntax-checked
- Outdated screenshots are flagged
- Missing cross-references are identified

---

## 📞 Questions?

If you're unsure about documentation requirements:

1. **Check existing examples** in the `docs/` folder
2. **Ask in pull request comments** for clarification
3. **Review this document** for specific guidelines
4. **Follow the templates** provided above

**Remember**: Good documentation is as important as good code. It helps users, developers, and your future self understand and use the system effectively.

---

**Last Updated**: $(date)
**Document Version**: 1.0.0
