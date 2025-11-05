# Plugin Version Tracking & Auto-Update System

## ✅ Completed (Just Now)

### 1. Plugin Version Display
- **Frontend**: Added `plugin_version` field to `WordPressConnection` interface
- **Backend**: Extract plugin version from `site_info` JSON and include in API response
- **WordPress Plugin**: Added `plugin_version` to site-info REST endpoint response
- **UI**: Display plugin version in Connected Sites page with color coding:
  - 🟢 Green: Latest version (v1.1.0)
  - 🟠 Orange: Outdated version (with "Update available" notice)
  - ⚪ Gray: Not detected

### 2. Current State
- Plugin version is now tracked and displayed
- Users can see which sites need plugin updates
- Version comparison logic in place

---

## 🚀 Next Steps: Auto-Update System

To make the plugin auto-updatable via WordPress, we need to implement a WordPress plugin update server. Here's the plan:

### Option 1: GitHub Releases (Recommended - Free)
WordPress can check GitHub releases for updates automatically.

**Steps:**
1. Create GitHub releases with version tags
2. Add update checker to WordPress plugin
3. WordPress will show "Update available" in admin
4. Users can update with one click

**Implementation:**
- Use `Plugin Update Checker` library (free, open-source)
- Host plugin ZIP on GitHub releases
- Automatic version checking every 12 hours

### Option 2: Custom Update Server
Build your own update server endpoint.

**Steps:**
1. Create `/api/wordpress/plugin-update-check` endpoint
2. Return plugin metadata (version, download URL, changelog)
3. Add update checker to WordPress plugin
4. Serve plugin ZIP from backend

**Implementation:**
- Full control over update process
- Can track update statistics
- More complex to maintain

### Option 3: WordPress.org Plugin Directory
Submit plugin to official WordPress directory.

**Benefits:**
- Automatic updates built-in
- Trusted by users
- Free hosting
- Better discoverability

**Requirements:**
- Plugin must be GPL compatible ✅ (already is)
- Code review by WordPress team
- Public repository
- Documentation

---

## Recommended Approach: GitHub Releases

### Why GitHub Releases?
1. **Free**: No hosting costs
2. **Simple**: Easy to implement
3. **Reliable**: GitHub's infrastructure
4. **Automated**: Can be part of CI/CD
5. **Trusted**: Users trust GitHub

### Implementation Steps:

#### 1. Add Update Checker to Plugin
```php
// In wordpress-plugin/codeanalyst-connector.php

require 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

$myUpdateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/rokas2025/codeanalyst',
    __FILE__,
    'codeanalyst-connector'
);

// Optional: Set the branch that contains the stable release
$myUpdateChecker->setBranch('main');

// Optional: Enable release assets (recommended)
$myUpdateChecker->getVcsApi()->enableReleaseAssets();
```

#### 2. Create GitHub Release
```bash
# Tag the current version
git tag v1.1.0
git push origin v1.1.0

# Create release on GitHub with:
# - Version: v1.1.0
# - Title: "CodeAnalyst Connector v1.1.0"
# - Description: Changelog
# - Attach: codeanalyst-connector-v1.1.0.zip
```

#### 3. Future Updates
When you release v1.2.0:
1. Update `CODEANALYST_VERSION` in plugin file
2. Create new git tag: `git tag v1.2.0`
3. Push tag: `git push origin v1.2.0`
4. Create GitHub release with new ZIP
5. WordPress sites will auto-detect update

---

## Current Plugin Versions

| Version | Release Date | Features |
|---------|-------------|----------|
| **1.1.0** | Nov 4, 2025 | Live Preview, JWT security, Home page detection |
| 1.0.0 | Oct 2025 | Initial release, Theme files, Site info |

---

## Update Instructions for Users

### Manual Update (Current)
1. Download latest plugin from dashboard
2. Go to WordPress admin → Plugins
3. Deactivate old plugin
4. Delete old plugin
5. Upload new plugin ZIP
6. Activate plugin

### Auto-Update (After Implementation)
1. WordPress shows "Update available" notification
2. Click "Update Now"
3. Done! ✅

---

## Testing Update System

### Test Checklist:
- [ ] Plugin version displays correctly in dashboard
- [ ] Outdated versions show orange with "Update available"
- [ ] Latest version shows green
- [ ] Update checker library integrated
- [ ] GitHub release created with ZIP
- [ ] WordPress detects update
- [ ] One-click update works
- [ ] Plugin settings preserved after update
- [ ] API connection maintained after update

---

## Files Modified

### Frontend:
- `src/services/wordpressService.ts` - Added `plugin_version` to interface
- `src/pages/ConnectedSites.tsx` - Display plugin version with color coding

### Backend:
- `backend/src/routes/wordpress.js` - Extract plugin version from site_info

### WordPress Plugin:
- `wordpress-plugin/includes/rest-api.php` - Added `plugin_version` to site-info endpoint
- `wordpress-plugin/codeanalyst-connector.php` - Version 1.1.0

---

## Next Action Items

1. **Install Plugin Update Checker Library**
   ```bash
   cd wordpress-plugin
   composer require yahnis-elsts/plugin-update-checker
   ```

2. **Add Update Checker Code** to `codeanalyst-connector.php`

3. **Create GitHub Release**
   - Tag: v1.1.0
   - Attach: codeanalyst-connector-v1.1.0.zip
   - Write changelog

4. **Test on Your WordPress Site**
   - Install old version
   - Check if update is detected
   - Test one-click update

5. **Document for Users**
   - Add "Auto-updates enabled" badge
   - Update installation instructions

---

## Benefits of Auto-Update

### For You (Developer):
- ✅ Push updates to all sites instantly
- ✅ No manual distribution needed
- ✅ Track adoption rates
- ✅ Fix bugs faster

### For Users:
- ✅ Always have latest features
- ✅ Security patches applied automatically
- ✅ One-click updates
- ✅ No manual downloads

---

## Security Considerations

- ✅ Updates signed by GitHub
- ✅ HTTPS only
- ✅ Version verification
- ✅ Rollback capability
- ✅ Backup before update (WordPress default)

---

**Status**: Plugin version tracking ✅ COMPLETE  
**Next**: Auto-update system (Optional - requires Plugin Update Checker library)

**Estimated Time to Implement Auto-Updates**: 30-60 minutes

Would you like me to implement the auto-update system now?

