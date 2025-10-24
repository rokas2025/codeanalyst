# Content Creator Language Fix Required

## Problem
When user selects a language (e.g., Lithuanian) in the Content Creator, the templates and generated content still appear in English. The language selector does nothing.

## Root Cause
1. **Frontend**: Language is saved to settings but not passed to backend when loading templates
2. **Backend**: Templates endpoint doesn't accept language parameter
3. **Backend**: Template translations exist in database but aren't being used
4. **Generation**: Language is passed to generation but templates themselves aren't translated

## Required Fixes

### 1. Backend - Update Templates Endpoint
**File**: `backend/src/routes/contentCreator.js` (line 26)

Change:
```javascript
const { category } = req.query
```

To:
```javascript
const { category, language = 'en' } = req.query
```

**File**: `backend/src/routes/contentCreator.js` (line 36-50)

Add `translations` to SELECT:
```javascript
SELECT 
  template_id as id,
  name,
  description,
  category,
  icon,
  input_fields,
  prompt_template,
  output_structure,
  default_settings,
  estimated_words,
  difficulty,
  sort_order,
  translations,  -- ADD THIS LINE
  created_at,
  updated_at
FROM content_templates 
WHERE is_active = true
```

**File**: `backend/src/routes/contentCreator.js` (line 69-88)

Update template mapping to use translations:
```javascript
const templates = result.rows.map(row => {
  // Apply translations if available
  const translations = row.translations || {}
  const langTranslations = translations[language] || {}
  
  return {
    id: row.id,
    template_id: row.id,
    name: langTranslations.name || row.name,
    description: langTranslations.description || row.description,
    category: row.category,
    icon: row.icon,
    inputFields: langTranslations.inputFields || row.input_fields,
    promptTemplate: row.prompt_template,
    outputStructure: row.output_structure,
    defaultSettings: row.default_settings,
    estimatedWords: row.estimated_words,
    difficulty: row.difficulty,
    sortOrder: row.sort_order,
    isFavorite: false,
    isHidden: false,
    usageCount: 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
})
```

### 2. Frontend - Pass Language to API
**File**: `src/services/contentCreatorService.ts`

Find `getTemplates` method and update to pass language:
```typescript
async getTemplates(category?: string, language?: string): Promise<ContentTemplate[]> {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (language) params.append('language', language)
  
  const response = await api.get(`/content-creator/templates?${params}`)
  return response.data.templates
}
```

### 3. Frontend Store - Pass Language When Loading
**File**: `src/stores/contentCreatorStore.ts` (line 70-79)

Update `loadTemplates` to pass language:
```typescript
loadTemplates: async () => {
  try {
    console.log('Loading content templates...')
    const { settings } = get()
    const templates = await contentCreatorService.getTemplates(undefined, settings.language)
    set({ templates })
    console.log(`Loaded ${templates.length} templates`)
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
},
```

### 4. Frontend - Reload Templates on Language Change
**File**: `src/pages/modules/ContentCreator.tsx` (line 76-79)

Update language onChange to reload templates:
```typescript
onChange={async (e) => {
  const newLanguage = e.target.value as 'en' | 'lt' | 'es' | 'fr' | 'de'
  updateSettings({ language: newLanguage })
  localStorage.setItem('contentCreator_language', newLanguage)
  await loadTemplates() // Reload templates with new language
}}
```

## Database - Template Translations Structure

The `translations` column in `content_templates` should have this structure:
```json
{
  "lt": {
    "name": "Apie mus puslapis",
    "description": "Sukurkite profesionalų 'Apie mus' puslapį",
    "inputFields": [
      {
        "name": "companyName",
        "label": "Įmonės pavadinimas",
        "placeholder": "Pvz., TechCorp Solutions"
      }
    ]
  },
  "es": {
    "name": "Página Sobre Nosotros",
    "description": "Crea una página profesional 'Sobre Nosotros'"
  }
}
```

## Testing After Fix

1. Go to Content Creator
2. Select "Lietuvių" language
3. Templates should reload and show Lithuanian names/descriptions
4. Input field labels should be in Lithuanian
5. Generated content should be in Lithuanian

## Current Status
- ❌ Language selector doesn't reload templates
- ❌ Templates always show in English
- ❌ Input fields always in English
- ✅ Generated content respects language (backend already works)

## Priority
**HIGH** - User-facing feature that doesn't work as expected

