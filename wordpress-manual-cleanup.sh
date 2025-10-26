#!/bin/bash
# WordPress CodeAnalyst Plugin Manual Cleanup Script
# Use this to completely remove all plugin files

echo "========================================="
echo "CodeAnalyst Plugin Manual Cleanup"
echo "========================================="
echo ""

# Set your WordPress path
WP_PATH="/home/saases/domains/wemods.es/public_html"
PLUGINS_PATH="$WP_PATH/wp-content/plugins"

echo "Checking for CodeAnalyst plugin files..."
echo ""

# Find all codeanalyst-connector folders
FOLDERS=$(find "$PLUGINS_PATH" -maxdepth 1 -type d -name "codeanalyst-connector*" 2>/dev/null)

if [ -z "$FOLDERS" ]; then
    echo "No CodeAnalyst plugin folders found."
else
    echo "Found folders:"
    echo "$FOLDERS"
    echo ""
    echo "Deleting all CodeAnalyst plugin folders..."
    find "$PLUGINS_PATH" -maxdepth 1 -type d -name "codeanalyst-connector*" -exec rm -rf {} \; 2>/dev/null
    echo "✓ Folders deleted"
fi

# Also check for any loose files (from incomplete deletion)
echo ""
echo "Checking for loose files..."
LOOSE_FILES=$(find "$PLUGINS_PATH" -maxdepth 1 -name "*codeanalyst*" -o -name "*admin-styles.css" -o -name "*settings-page.php" 2>/dev/null | grep -v "codeanalyst-connector")

if [ -z "$LOOSE_FILES" ]; then
    echo "No loose files found."
else
    echo "Found loose files:"
    echo "$LOOSE_FILES"
    echo ""
    echo "Deleting loose files..."
    find "$PLUGINS_PATH" -maxdepth 1 -name "*codeanalyst*" -exec rm -rf {} \; 2>/dev/null
    echo "✓ Loose files deleted"
fi

echo ""
echo "========================================="
echo "Cleanup complete!"
echo "========================================="
echo ""
echo "Verify by running:"
echo "ls -la $PLUGINS_PATH | grep codeanalyst"
echo ""

