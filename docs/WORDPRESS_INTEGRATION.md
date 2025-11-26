# WordPress Integration Documentation

This document captures the architecture, common issues, and best practices for working with the CodeAnalyst WordPress integration.

## Architecture Overview

### Communication Flow

```
WordPress Site                Backend (Railway)              Frontend (Vercel)
     |                              |                              |
     |  1. Plugin activated         |                              |
     |----------------------------->|                              |
     |  POST /api/wordpress/connect |                              |
     |                              |                              |
     |                              |  2. Connection stored        |
     |                              |  in Supabase                 |
     |                              |                              |
     |                              |<-----------------------------|
     |                              |  3. GET /api/wordpress/      |
     |                              |     connections              |
     |                              |                              |
     |  4. GET /codeanalyst/v1/     |                              |
     |<-----------------------------|                              |
     |     theme-files              |                              |
     |                              |                              |
     |  5. Return file list         |                              |
     |----------------------------->|                              |
     |                              |                              |
     |  6. GET /codeanalyst/v1/     |                              |
     |<-----------------------------|                              |
     |     theme-file?file=X        |                              |
     |                              |                              |
     |  7. Return file content      |                              |
     |----------------------------->|                              |
     |                              |  8. Files sent to frontend   |
     |                              |----------------------------->|
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| WordPress Plugin | `wordpress-plugin/` | Exposes REST API endpoints for theme files |
| Backend Routes | `backend/src/routes/wordpress.js` | Proxies requests to WordPress, manages connections |
| Frontend Service | `src/services/wordpressService.ts` | API client for WordPress operations |
| Site Selector | `src/components/WordPressSiteSelector.tsx` | UI for selecting connected sites |

## REST API Endpoints

### Plugin Endpoints (WordPress side)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp-json/codeanalyst/v1/theme-files` | GET | List all theme files |
| `/wp-json/codeanalyst/v1/theme-file` | GET | Get single file content |
| `/wp-json/codeanalyst/v1/site-info` | GET | Get site/theme metadata |
| `/wp-json/codeanalyst/v1/pages` | GET | List pages for analysis |

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wordpress/plugin/download` | GET | Download plugin ZIP |
| `/api/wordpress/generate-key` | POST | Generate API key |
| `/api/wordpress/connect` | POST | Register WordPress connection |
| `/api/wordpress/connections` | GET | List user's connections |
| `/api/wordpress/theme-files/:id` | GET | Fetch theme files via backend proxy |

## Common Issues and Solutions

### Issue 1: File Fetch 404 for Child Themes

**Symptom:** Backend fetches parent theme files successfully, but gets 404 when fetching their content.

**Root Cause:** Child theme files are prefixed with `[parent]/` but the plugin's `get_theme_file_content()` function didn't handle this prefix.

**Solution:** Modified plugin to detect `[parent]/` prefix and use the parent theme directory:

```php
// In wordpress-plugin/includes/rest-api.php
public function get_theme_file_content($request) {
    $file = $request->get_param('file');
    $theme = wp_get_theme();
    $theme_dir = $theme->get_stylesheet_directory();
    $template_dir = $theme->get_template_directory();

    $base_dir = $theme_dir;
    
    // Handle parent theme files
    if (strpos($file, '[parent]/') === 0) {
        $file = str_replace('[parent]/', '', $file);
        $base_dir = $template_dir;
    }
    
    // ... rest of function
}
```

### Issue 2: ZIP File Structure Wrong

**Symptom:** Plugin installation fails with "Required file missing" errors.

**Root Cause:** PowerShell `Compress-Archive` creates flat archives with backslashes in filenames.

**Solution:** Use .NET `ZipFile` class with explicit folder structure:

```powershell
# Correct approach
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory(
    $sourceFolder,
    $zipPath,
    [System.IO.Compression.CompressionLevel]::Optimal,
    $true  # Include base directory name
)
```

**Rules:**
- Root folder inside ZIP must be `codeanalyst-connector/`
- Always use forward slashes (`/`) not backslashes (`\`)
- Include all subdirectories (admin/, includes/)

### Issue 3: AI Response Parsing `[object Object]`

**Symptom:** AI analysis fails with `"[object Object]" is not valid JSON`.

**Root Cause:** `callAI()` returns an object `{response, providerUsed, model, tokensUsed}` but `parseCodeInsights()` expected a string.

**Solution:**

```javascript
// In backend/src/services/AIAnalysisService.js
async generateCodeInsights(analysisData, files, options = {}) {
  const aiResult = await this.callAI(prompt, 'code-analysis', options)
  
  // Extract the response string from the result object
  const responseText = aiResult.response || aiResult
  
  return this.parseCodeInsights(responseText, analysisData)
}
```

### Issue 4: PHPStan `require is not defined`

**Symptom:** PHPStan analysis fails with "require is not defined".

**Root Cause:** Using CommonJS `require()` in an ES module file.

**Solution:** Use ES module imports:

```javascript
// WRONG - CommonJS in ES module
const file = require('fs').createWriteStream(destination)

// CORRECT - ES module imports
import { createWriteStream } from 'fs'
const file = createWriteStream(destination)
```

### Issue 5: PHPCS WordPress Standards Not Found

**Symptom:** PHPCS fails with "Command failed: phpcs --standard=WordPress".

**Solution:** Add fallback to alternative standards:

```javascript
async checkPHPCSAvailable() {
  const { stdout } = await execAsync(`${this.phpcsPath} -i`)
  
  if (stdout.includes('WordPress')) {
    this.standard = 'WordPress'
  } else if (stdout.includes('PSR12')) {
    this.standard = 'PSR12'  // Fallback
  }
}
```

## Key Code Patterns

### Backend ES Modules

**Never use `require()` in backend services.** Always use ES imports:

```javascript
// WRONG
const file = require('fs').createWriteStream(destination)
require('fs').unlink(destination, () => {})

// CORRECT
import { createWriteStream, unlink } from 'fs'
const file = createWriteStream(destination)
unlink(destination, () => {})
```

### WordPress Child Theme Handling

When listing files, parent theme files are prefixed:

```
[parent]/functions.php      <- From parent theme
[parent]/header.php         <- From parent theme  
style.css                   <- From child theme
functions.php               <- From child theme (overrides parent)
```

When fetching content, detect the prefix:

```php
if (strpos($file, '[parent]/') === 0) {
    $file = str_replace('[parent]/', '', $file);
    $base_dir = get_template_directory(); // Parent theme
} else {
    $base_dir = get_stylesheet_directory(); // Child theme
}
```

### AI Response Parsing

Always extract the response string before parsing:

```javascript
const aiResult = await this.callAI(prompt, type, options)
// aiResult = { response: "...", providerUsed: "openai", model: "gpt-4o", ... }

const responseText = aiResult.response || aiResult
return this.parseInsights(responseText, data)
```

## Plugin Version Update Checklist

When updating the WordPress plugin:

1. **Bump version** in `wordpress-plugin/codeanalyst-connector.php`:
   - Plugin header: `* Version: X.Y.Z`
   - Constant: `define('CODEANALYST_VERSION', 'X.Y.Z')`

2. **Update CHANGELOG.md** in `wordpress-plugin/CHANGELOG.md`

3. **Update frontend version check** in `src/pages/ConnectedSites.tsx`:
   ```typescript
   {connection.plugin_version !== 'X.Y.Z' && (
     <span>Update available</span>
   )}
   ```

4. **Update backend header** in `backend/src/routes/wordpress.js`:
   ```javascript
   res.setHeader('X-Plugin-Version', 'X.Y.Z')
   ```

5. **Rebuild ZIP file** with correct structure:
   - Root folder: `codeanalyst-connector/`
   - Use forward slashes
   - Place in `backend/codeanalyst-connector.zip`

6. **Test plugin installation** - verify folder name is correct

## Analysis Tools Status

| Tool | Purpose | Status |
|------|---------|--------|
| ESLint | JavaScript/TypeScript linting | ✅ Working |
| PHPStan | PHP static analysis | ✅ Fixed (ES imports) |
| PHPCS | WordPress coding standards | ✅ Fixed (fallback) |
| Escomplex | JavaScript complexity | ✅ Fixed (logging) |
| Security Scan | WordPress security patterns | ✅ Working |
| AI Analysis | Executive summary, insights | ✅ Fixed (response parsing) |

## Debugging Tips

### Enable WordPress Debug Logging

In `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Logs appear in: `wp-content/debug.log`

### Check Railway Backend Logs

Use Railway CLI or dashboard to view real-time logs:
```powershell
railway logs
```

### Frontend Console Debugging

The CodeAnalyst frontend logs key events:
```
📦 WordPress theme files response: {success: true, filesCount: 184}
✅ Setting uploaded files: 184 files
🚀 Starting analysis with files: 184
```

## File Locations Reference

| File | Purpose |
|------|---------|
| `wordpress-plugin/codeanalyst-connector.php` | Main plugin file |
| `wordpress-plugin/includes/rest-api.php` | REST API endpoints |
| `backend/src/routes/wordpress.js` | Backend WordPress routes |
| `backend/src/services/PHPStanService.js` | PHP static analysis |
| `backend/src/services/PHPCSService.js` | WordPress coding standards |
| `backend/src/services/AIAnalysisService.js` | AI insights generation |
| `src/services/wordpressService.ts` | Frontend WordPress API client |
| `src/pages/modules/CodeAnalyst.tsx` | Code analysis UI |

