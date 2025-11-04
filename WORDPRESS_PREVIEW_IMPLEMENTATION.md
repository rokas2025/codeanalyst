# WordPress Live Preview Implementation Guide

## Overview

This document describes the WordPress Live Preview feature that allows users to preview WordPress pages/posts in real-time using JWT-based authentication and iframe embedding.

## Architecture

### Components

1. **Backend (Express)**
   - `WordPressPreviewService.js` - Handles preview URL minting
   - Routes: `/api/wordpress/preview` and `/api/wordpress/pages/:connectionId`

2. **WordPress Plugin**
   - `rest-api.php` - REST endpoint for minting JWT tokens
   - `preview-handler.php` - Handles preview URL requests and renders content

3. **Frontend (React)**
   - `PreviewPane.tsx` - Preview component with iframe and controls
   - `AutoProgrammer.tsx` - Integration with WordPress site selector

## Setup Instructions

### Backend Configuration

1. **Environment Variables** (add to `.env`):
   ```
   APP_PUBLIC_URL=https://app.beenex.dev
   WP_PREVIEW_TIMEOUT_SEC=300
   WP_REQUEST_TIMEOUT_MS=10000
   ```

2. **Deploy Backend Changes**
   - Ensure `WordPressPreviewService.js` is deployed
   - Verify routes are mounted in `index.js`

### WordPress Plugin Installation

1. **Install Plugin**
   - Upload `codeanalyst-connector` plugin to WordPress
   - Activate the plugin

2. **Configure Plugin**
   - Go to WordPress Admin → CodeAnalyst
   - Enter your API Key (from CodeAnalyst app)
   - Click "Connect"

3. **Verify Installation**
   - Check that `preview-bot` user was created (WordPress Admin → Users)
   - Verify REST API endpoint: `https://yoursite.com/wp-json/codeanalyst/v1/preview/mint`

### Frontend Configuration

1. **Environment Variables** (already configured):
   - `VITE_API_URL` - Backend API URL

2. **Build & Deploy**
   - Ensure `PreviewPane.tsx` is included
   - Verify `AutoProgrammer.tsx` includes WordPress integration

## Usage

### For Users

1. **Select WordPress Site**
   - Go to Auto Programmer module
   - Choose "WordPress Site" input method
   - Select a connected WordPress site

2. **Select Page**
   - Choose a page from the dropdown
   - Click "Load & Preview"

3. **Preview Controls**
   - **Mode**: Toggle between Live and Snapshot (Snapshot coming soon)
   - **Device**: Switch between Desktop, Tablet, Mobile views
   - **Zoom**: Adjust zoom level (50% - 200%)
   - **Reload**: Refresh preview URL
   - **Status**: Shows expiration countdown

## Security Features

### JWT Token Security

- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: Uses WordPress `AUTH_SALT` or plugin-generated secret
- **TTL**: 5 minutes (300 seconds)
- **Claims**:
  - `target`: Page/post ID or path
  - `builder`: Builder type (auto/gutenberg/elementor/divi/wpbakery)
  - `aud`: Audience (app URL)
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp
  - `iss`: Issuer (WordPress site URL)
  - `jti`: Unique token ID

### Preview Bot User

- **Role**: Subscriber (minimal permissions)
- **Username**: `codeanalyst-preview-bot`
- **Purpose**: Provides low-privilege context for preview rendering

### Content Security Policy

- **Header**: `Content-Security-Policy: frame-ancestors 'self' {APP_PUBLIC_URL}`
- **Purpose**: Restricts iframe embedding to authorized origins only

### Rate Limiting

- **Limit**: 10 requests per minute per IP
- **Storage**: WordPress transients (60-second expiration)
- **Response**: HTTP 429 if exceeded

## Troubleshooting

### Preview Shows "Blocked" or Blank

**Cause**: Content Security Policy blocking iframe

**Solution**:
1. Verify `APP_PUBLIC_URL` in backend `.env` matches your frontend URL
2. Check WordPress plugin CSP header includes your app URL
3. Verify WordPress site URL matches in connection settings

### Preview URL Expires Immediately

**Cause**: JWT expiration or clock skew

**Solution**:
1. Check WordPress server time is synchronized
2. Verify `WP_PREVIEW_TIMEOUT_SEC` is set correctly (default 300)
3. Check JWT secret is consistent (try reactivating plugin)

### Preview Shows Wrong Builder View

**Cause**: Builder detection failed or incorrect builder param

**Solution**:
1. Verify builder plugin is active on WordPress site
2. Check builder type in preview request matches installed builder
3. Use `auto` builder mode for automatic detection

### "Failed to mint preview URL" Error

**Possible Causes**:
1. **Rate Limiting**: Too many requests
   - Solution: Wait 1 minute and try again

2. **API Key Mismatch**: Plugin API key doesn't match
   - Solution: Reconnect WordPress site in CodeAnalyst

3. **Network Issues**: WordPress site unreachable
   - Solution: Check site URL and firewall settings

4. **Plugin Not Active**: Preview handler not loaded
   - Solution: Deactivate and reactivate plugin

### Preview Bot User Not Created

**Cause**: Plugin activation failed

**Solution**:
1. Check WordPress error logs
2. Manually create user: `codeanalyst-preview-bot` with role `subscriber`
3. Reactivate plugin

## Builder-Specific Notes

### Elementor
- Requires Elementor plugin active
- Preview URL includes `elementor-preview` query param
- Works with Elementor templates and pages

### Divi Builder
- Requires Divi theme or Divi Builder plugin
- Preview URL includes `et_fb=1` query param
- Supports Divi visual builder preview

### Gutenberg (Block Editor)
- Built into WordPress 5.0+
- Preview URL includes `preview=true` query param
- Works with all block-based content

### WPBakery Page Builder
- Requires Visual Composer plugin active
- Preview URL includes `vc_editable=true` query param
- Supports frontend editor preview

## API Endpoints

### POST `/api/wordpress/preview`

**Request Body**:
```json
{
  "connectionId": "uuid",
  "target": "123" or "/page-slug",
  "builder": "auto" | "gutenberg" | "elementor" | "divi" | "wpbakery"
}
```

**Response**:
```json
{
  "success": true,
  "preview_url": "https://site.com/?codeanalyst_preview=...",
  "ttl": 300
}
```

### GET `/api/wordpress/pages/:connectionId`

**Response**:
```json
{
  "success": true,
  "pages": [
    {
      "id": 123,
      "title": "Page Title",
      "url": "https://site.com/page",
      "status": "publish" | "draft" | "pending"
    }
  ],
  "total": 10
}
```

### POST `/wp-json/codeanalyst/v1/preview/mint` (WordPress)

**Headers**:
- `X-API-Key`: Plugin API key
- `Content-Type`: application/json

**Request Body**:
```json
{
  "target": "123" or "/page-slug",
  "builder": "auto",
  "audience": "https://app.beenex.dev"
}
```

**Response**:
```json
{
  "success": true,
  "preview_url": "https://site.com/?codeanalyst_preview=...",
  "ttl": 300
}
```

## Future Enhancements

### Snapshot Mode (Planned)

- **Technology**: Puppeteer
- **Process**:
  1. Mint preview URL (same as live)
  2. Use Puppeteer to open URL
  3. Wait for network idle
  4. Take full-page screenshot
  5. Store screenshot by revision key
  6. Return snapshot URL

### Asset Proxy (Optional)

- **Endpoint**: `/wp-json/codeanalyst/v1/asset?token=...`
- **Purpose**: Proxy private media files when JWT present
- **Use Case**: Preview pages with private/protected assets

### Overlay Script (Optional)

- **Purpose**: Highlight elements and communicate with parent window
- **Method**: `window.parent.postMessage`
- **Use Case**: Visual debugging and element selection

## Testing Checklist

- [ ] WordPress plugin activates successfully
- [ ] Preview bot user created on activation
- [ ] JWT secret generated/retrieved correctly
- [ ] REST API endpoint accessible
- [ ] Preview URL minting works
- [ ] JWT verification works
- [ ] Preview renders correctly
- [ ] CSP header allows iframe embedding
- [ ] Rate limiting works
- [ ] Preview expires after TTL
- [ ] Builder-specific params applied correctly
- [ ] Theme files load in file tree
- [ ] Pages list loads correctly
- [ ] Preview pane UI works
- [ ] Device switching works
- [ ] Zoom controls work
- [ ] Countdown timer works

## Support

For issues or questions:
1. Check WordPress error logs
2. Check backend logs for preview minting errors
3. Verify environment variables are set correctly
4. Test REST API endpoint directly
5. Check browser console for frontend errors

## Security Best Practices

1. **Never expose JWT secret** - Keep it server-side only
2. **Use HTTPS** - Required for secure token transmission
3. **Monitor rate limits** - Prevent abuse
4. **Regular secret rotation** - Change JWT secret periodically
5. **Audit preview bot user** - Ensure it has minimal permissions
6. **Validate audience** - Always verify `aud` claim
7. **Short TTL** - Keep tokens short-lived (5 minutes)

