# CodeAnalyst Connector - Changelog

All notable changes to the CodeAnalyst WordPress Connector plugin.

## [1.2.2] - 2025-11-26

### Fixed
- Parent theme file fetching now works correctly with `[parent]/` prefix
- Files from parent theme are now properly returned for child theme analysis

## [1.2.1] - 2025-11-26

### Added
- Child theme support: now scans both parent and child theme files
- Debug logging for theme scanning (check WordPress debug.log)
- `is_child_theme` and `parent_theme` fields in API response

### Fixed
- Parent theme files are now included with `[parent]/` prefix in file paths

## [1.2.0] - 2025-11-25

### Fixed
- Fixed `realpath()` comparison for symlinked directories
- Improved file path security validation

### Changed
- Better error messages for file access issues

## [1.1.0] - 2025-11-05

### Added
- Preview URL minting for authenticated page previews
- Site health information in API responses
- Pages endpoint for listing WordPress pages

### Changed
- Improved REST API permission checks

## [1.0.0] - 2025-10-15

### Added
- Initial release
- Theme file scanning and content retrieval
- REST API endpoints for CodeAnalyst integration
- Admin settings page for API key management
- Automatic daily sync with CodeAnalyst platform

