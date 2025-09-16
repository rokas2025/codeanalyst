import React, { useState } from 'react'
import { HeartIcon, StarIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useContentCreatorStore } from '../../../stores/contentCreatorStore'
import type { ContentTemplate } from '../../../types/contentCreator'

const categoryColors = {
  website: 'bg-blue-100 text-blue-800 border-blue-200',
  marketing: 'bg-purple-100 text-purple-800 border-purple-200',
  ecommerce: 'bg-green-100 text-green-800 border-green-200',
  blog: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  social: 'bg-pink-100 text-pink-800 border-pink-200',
  email: 'bg-indigo-100 text-indigo-800 border-indigo-200'
}

const difficultyColors = {
  beginner: 'text-green-600',
  intermediate: 'text-yellow-600',
  advanced: 'text-red-600'
}

export function TemplateSelector() {
  const { 
    templates, 
    favorites, 
    selectTemplate, 
    addToFavorites, 
    removeFromFavorites 
  } = useContentCreatorStore()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.category))]
  
  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleTemplateSelect = (template: ContentTemplate) => {
    selectTemplate(template)
  }

  const toggleFavorite = (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (favorites.includes(templateId)) {
      removeFromFavorites(templateId)
    } else {
      addToFavorites(templateId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Templates' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => {
          const isFavorite = favorites.includes(template.id)
          
          return (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="relative bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all group"
            >
              {/* Favorite Button */}
              <button
                onClick={(e) => toggleFavorite(template.id, e)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isFavorite ? (
                  <HeartSolid className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                )}
              </button>

              {/* Template Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="text-3xl">{template.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {template.description}
                  </p>
                </div>
              </div>

              {/* Template Meta */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                  categoryColors[template.category]
                }`}>
                  {template.category}
                </span>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={difficultyColors[template.difficulty]}>
                    {template.difficulty}
                  </span>
                  <span>•</span>
                  <span>~{template.estimatedWords} words</span>
                </div>
              </div>

              {/* Template Fields Preview */}
              <div className="text-xs text-gray-500 mb-4">
                <span className="font-medium">Fields: </span>
                {template.inputFields.slice(0, 3).map(field => field.label).join(', ')}
                {template.inputFields.length > 3 && ` +${template.inputFields.length - 3} more`}
              </div>

              {/* Select Button */}
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium group-hover:bg-purple-700">
                Use This Template
              </button>
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <DocumentTextIcon className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">
            Try adjusting your search or category filter to find more templates.
          </p>
        </div>
      )}

      {/* Template Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {filteredTemplates.length} of {templates.length} templates</span>
          <span>{favorites.length} favorites saved</span>
        </div>
      </div>
    </div>
  )
}
