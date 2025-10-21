# WordPress Editors Support - Complete Guide

## 📚 Overview

CodeAnalyst now supports **all three WordPress editor types**:

1. **Gutenberg Block Editor** (WordPress default since 5.0)
2. **Elementor Page Builder** (third-party plugin)
3. **Classic Editor** (legacy WordPress editor)

Based on the [WordPress Documentation](https://wordpress.org/documentation/), we've implemented full support for extracting, storing, and managing content from all editor types.

---

## 🎯 Supported WordPress Editors

### 1. Gutenberg Block Editor (Default)

**What is it?**
- Default WordPress editor since version 5.0
- Block-based content system
- Each block represents a content element (paragraph, heading, image, etc.)

**How it stores data:**
- Content stored in `post_content` field as HTML
- Uses block comments: `<!-- wp:block-name {...} -->`
- Block attributes stored inline as JSON

**Example Gutenberg content:**
```html
<!-- wp:paragraph -->
<p>This is a paragraph block.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>This is a heading</h2>
<!-- /wp:heading -->

<!-- wp:image {"id":123,"sizeSlug":"large"} -->
<figure class="wp-block-image size-large">
  <img src="image.jpg" alt="" class="wp-image-123"/>
</figure>
<!-- /wp:image -->
```

**What we extract:**
- Full HTML content
- Individual blocks with names and attributes
- Block count
- Block structure

**Available blocks** (from [WordPress Documentation](https://wordpress.org/documentation/)):
- Text Blocks: Paragraph, Heading, List, Quote, Code, Preformatted
- Media Blocks: Image, Gallery, Audio, Video, File, Cover
- Design Blocks: Group, Row, Stack, Buttons, Columns, Separator, Spacer
- Widget Blocks: Archives, Calendar, Categories, Latest Posts, Tag Cloud
- Embed Blocks: YouTube, Twitter, Facebook, Instagram, WordPress, and 30+ more

---

### 2. Elementor Page Builder

**What is it?**
- Popular third-party drag-and-drop page builder plugin
- Visual editor with widgets and templates
- Used by millions of WordPress sites

**How it stores data:**
- Page structure stored as JSON in `wp_postmeta` table
- Meta key: `_elementor_data`
- Meta key: `_elementor_edit_mode` (value: "builder")

**Example Elementor data structure:**
```json
[
  {
    "id": "section-id",
    "elType": "section",
    "settings": {
      "layout": "boxed",
      "gap": "default"
    },
    "elements": [
      {
        "id": "column-id",
        "elType": "column",
        "elements": [
          {
            "id": "widget-id",
            "elType": "widget",
            "widgetType": "heading",
            "settings": {
              "title": "Welcome",
              "size": "h1"
            }
          }
        ]
      }
    ]
  }
]
```

**What we extract:**
- Complete Elementor JSON structure
- Widget hierarchy
- Section/column layout
- Widget settings

**Reference:** [Elementor Developers Documentation](https://developers.elementor.com/)

---

### 3. Classic Editor

**What is it?**
- Original WordPress editor (pre-5.0)
- Simple WYSIWYG HTML editor
- Still used by many sites via Classic Editor plugin

**How it stores data:**
- Plain HTML stored in `post_content` field
- No block comments or special formatting
- Just standard HTML tags

**Example Classic editor content:**
```html
<p>This is a paragraph.</p>
<h2>This is a heading</h2>
<img src="image.jpg" alt="My image" />
<ul>
  <li>List item 1</li>
  <li>List item 2</li>
</ul>
```

**What we extract:**
- Full HTML content
- No special structure (just HTML)

---

## 📦 What to Upload

### Required Files

**1. WordPress XML Export** (REQUIRED for page content)
```
WordPress Admin → Tools → Export
- Select: "All content"
- Click: "Download Export File"
- Result: wordpress-export.xml
```

This XML file contains:
- All posts and pages
- Post content (Gutenberg blocks, Classic HTML)
- Post meta (Elementor data, custom fields)
- Categories, tags, taxonomies
- Comments and authors

**2. Theme Files** (REQUIRED for code analysis)
```
/wp-content/themes/[your-active-theme]/
├── style.css
├── functions.php
├── index.php
├── header.php
├── footer.php
├── template-parts/
└── assets/
```

**3. Plugin Files** (OPTIONAL)
```
/wp-content/plugins/
├── elementor/          (if using Elementor)
├── woocommerce/        (if using WooCommerce)
└── other-plugins/
```

**4. Uploads** (OPTIONAL)
```
/wp-content/uploads/
├── 2024/
├── 2025/
└── elementor/          (Elementor assets)
```

### How to Create the ZIP

**Option 1: Manual (Recommended)**
```
1. Download WordPress XML export
2. Access your WordPress files via FTP/cPanel
3. Download /wp-content/themes/[your-theme]/ folder
4. Create a ZIP file with this structure:

   my-wordpress-site.zip
   ├── wordpress-export.xml
   └── wp-content/
       └── themes/
           └── my-theme/
               ├── style.css
               ├── functions.php
               └── ...
```

**Option 2: Using WordPress Plugin**
```
1. Install "All-in-One WP Migration" or similar
2. Export site
3. Extract the backup
4. Keep only theme folder and XML export
5. Re-zip with correct structure
```

---

## 🔍 How Detection Works

When you upload a WordPress ZIP, our system:

### Step 1: Parse ZIP File
```javascript
// Extract files from ZIP
- Theme files (PHP, CSS, JS)
- WordPress XML export
- SQL dumps (if included)
```

### Step 2: Parse XML Export
```javascript
// For each post/page in XML:
if (has _elementor_data meta) {
  → Categorize as "Elementor"
  → Extract JSON structure
} else if (content includes "<!-- wp:") {
  → Categorize as "Gutenberg"
  → Extract blocks
} else if (content has HTML) {
  → Categorize as "Classic"
  → Store HTML content
}
```

### Step 3: Store in Database
```sql
-- Unified table for all editor types
wordpress_pages (
  editor_type: 'gutenberg' | 'elementor' | 'classic'
  content: TEXT (for Gutenberg/Classic)
  elementor_data: JSONB (for Elementor)
  blocks: JSONB (for Gutenberg)
  block_count: INTEGER (for Gutenberg)
)
```

---

## 📊 Database Schema

### Unified Pages Table

```sql
CREATE TABLE wordpress_pages (
  id UUID PRIMARY KEY,
  connection_id UUID REFERENCES wordpress_connections(id),
  post_id BIGINT NOT NULL,
  post_title TEXT,
  post_type VARCHAR(50),           -- 'post', 'page', 'product', etc.
  editor_type VARCHAR(20) NOT NULL, -- 'gutenberg', 'elementor', 'classic'
  
  -- Gutenberg & Classic
  content TEXT,                     -- Full HTML content
  
  -- Elementor
  elementor_data JSONB,             -- Elementor JSON structure
  
  -- Gutenberg specific
  blocks JSONB,                     -- Array of block objects
  block_count INTEGER,              -- Number of blocks
  
  -- Common fields
  page_url TEXT,
  last_modified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(connection_id, post_id)
);
```

---

## 🎨 Frontend Display

### Upload Summary

After successful upload, you'll see:

```
✅ Upload successful!
- Theme files: 45
- Gutenberg pages: 12
- Elementor pages: 5
- Classic pages: 3
- Total pages: 20
```

### Page List View

```
📄 Gutenberg Pages (12)
  - Homepage (15 blocks)
  - About Us (8 blocks)
  - Blog Post (22 blocks)
  ...

📄 Elementor Pages (5)
  - Landing Page (Post ID: 123)
  - Services (Post ID: 456)
  ...

📄 Classic Editor Pages (3)
  - Contact (Post ID: 789)
  - Privacy Policy (Post ID: 790)
  ...
```

---

## 🔧 API Endpoints

### Upload WordPress ZIP
```http
POST /api/wordpress/upload-zip/:connectionId
Content-Type: multipart/form-data

Body: zipFile (binary)

Response:
{
  "success": true,
  "data": {
    "themeFiles": 45,
    "gutenbergPages": 12,
    "elementorPages": 5,
    "classicPages": 3,
    "totalPages": 20,
    "totalFiles": 65,
    "totalSize": 5242880
  }
}
```

### Get All Pages
```http
GET /api/wordpress/pages/:connectionId

Response:
{
  "success": true,
  "pages": [...],
  "summary": {
    "gutenberg": 12,
    "elementor": 5,
    "classic": 3,
    "total": 20
  }
}
```

### Get Pages by Editor Type
```http
GET /api/wordpress/pages/:connectionId?editorType=gutenberg
GET /api/wordpress/pages/:connectionId?editorType=elementor
GET /api/wordpress/pages/:connectionId?editorType=classic
```

---

## 🎯 Use Cases

### 1. Theme Code Analysis
- Analyze PHP, CSS, JavaScript files
- Detect code quality issues
- Find security vulnerabilities
- Check WordPress coding standards

### 2. Content Migration
- Export content from one site
- Analyze content structure
- Prepare for migration to another platform

### 3. SEO Analysis
- Analyze page content
- Check heading structure
- Verify meta descriptions
- Analyze keyword usage

### 4. Page Editing (Future)
- Edit Gutenberg blocks visually
- Modify Elementor widgets
- Update Classic editor content
- Push changes back to WordPress

---

## 📚 References

- [WordPress Documentation](https://wordpress.org/documentation/)
- [Gutenberg Block Editor](https://wordpress.org/documentation/)
- [Elementor Developers](https://developers.elementor.com/)
- [WordPress Block Reference](https://wordpress.org/documentation/)
- [WordPress Export Format](https://wordpress.org/documentation/)

---

## 🐛 Troubleshooting

### "No pages found"
**Solution:** Make sure you included the WordPress XML export in your ZIP file.

### "Only Elementor pages detected"
**Solution:** This is normal if your site only uses Elementor. Gutenberg pages will only appear if you have pages created with the block editor.

### "Block count is 0"
**Solution:** The page might be using Classic editor or Elementor, not Gutenberg blocks.

### "Upload failed"
**Solutions:**
- Check ZIP file size (max 100MB)
- Verify ZIP structure matches requirements
- Ensure XML export is valid
- Check backend logs for detailed error

---

**Version:** 2.0.0  
**Updated:** October 21, 2025  
**Status:** ✅ Production Ready - All WordPress Editors Supported

