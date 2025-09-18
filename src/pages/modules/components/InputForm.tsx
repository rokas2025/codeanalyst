import React, { useState, useEffect } from 'react'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useContentCreatorStore } from '../../../stores/contentCreatorStore'
import type { TemplateField } from '../../../types/contentCreator'

interface InputFormProps {
  onComplete?: () => void
  onValidationChange?: (isValid: boolean) => void
}

export function InputForm({ onComplete, onValidationChange }: InputFormProps) {
  const { selectedTemplate, inputs, updateInputs, setCurrentStep } = useContentCreatorStore()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Validate a single field
  const validateField = (field: TemplateField, value: any): string | null => {
    const stringValue = String(value || '').trim()

    // Required field validation
    if (field.required && !stringValue) {
      return `${field.label} is required`
    }

    // Skip other validations if field is empty and not required
    if (!stringValue && !field.required) {
      return null
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(stringValue)) {
          return 'Please enter a valid email address'
        }
        break

      case 'url':
        try {
          new URL(stringValue)
        } catch {
          return 'Please enter a valid URL'
        }
        break

      case 'number':
        if (isNaN(Number(stringValue))) {
          return 'Please enter a valid number'
        }
        break
    }

    // Length validation
    if (field.validation?.minLength && stringValue.length < field.validation.minLength) {
      return `${field.label} must be at least ${field.validation.minLength} characters long`
    }

    if (field.validation?.maxLength && stringValue.length > field.validation.maxLength) {
      return `${field.label} must be no more than ${field.validation.maxLength} characters long`
    }

    // Pattern validation
    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern)
      if (!regex.test(stringValue)) {
        return `${field.label} format is invalid`
      }
    }

    return null
  }

  // Validate all fields
  const validateAllFields = () => {
    if (!selectedTemplate) return false

    const errors: Record<string, string> = {}
    let isValid = true

    selectedTemplate.inputFields.forEach(field => {
      const error = validateField(field, inputs[field.name])
      if (error) {
        errors[field.name] = error
        isValid = false
      }
    })

    setValidationErrors(errors)
    return isValid
  }

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any, field: TemplateField) => {
    updateInputs({ [fieldName]: value })
    
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]))
    
    // Validate this field
    const error = validateField(field, value)
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }))
  }

  // Handle field blur (for touched state)
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]))
  }

  // Handle form submission
  const handleContinue = () => {
    // Mark all fields as touched
    if (selectedTemplate) {
      setTouchedFields(new Set(selectedTemplate.inputFields.map(f => f.name)))
    }

    const isValid = validateAllFields()
    
    if (isValid) {
      setCurrentStep('settings')
      onComplete?.()
    }
  }

  // Update validation status when inputs change
  useEffect(() => {
    const isValid = validateAllFields()
    onValidationChange?.(isValid)
  }, [inputs, selectedTemplate])

  if (!selectedTemplate) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">No template selected</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={(e) => { e.preventDefault(); handleContinue() }} className="space-y-6">
        {/* Template Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Creating: {selectedTemplate.name}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {selectedTemplate.description}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-xs text-blue-600">
                <span>~{selectedTemplate.estimatedWords} words</span>
                <span className="capitalize">{selectedTemplate.difficulty} level</span>
                <span className="capitalize">{selectedTemplate.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Input Fields */}
        <div className="space-y-5">
          {selectedTemplate.inputFields.map((field) => {
            const fieldValue = inputs[field.name] || ''
            const hasError = validationErrors[field.name] && touchedFields.has(field.name)
            const isValid = !hasError && touchedFields.has(field.name) && fieldValue

            return (
              <div key={field.name} className="space-y-2">
                {/* Field Label */}
                <label 
                  htmlFor={field.name} 
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {/* Field Description */}
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}

                {/* Input Field */}
                <div className="relative">
                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                      onBlur={() => handleFieldBlur(field.name)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-2 focus:border-transparent resize-vertical
                        ${hasError 
                          ? 'border-red-300 focus:ring-red-500' 
                          : isValid 
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                        }
                      `}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                      onBlur={() => handleFieldBlur(field.name)}
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm 
                        focus:outline-none focus:ring-2 focus:border-transparent
                        ${hasError 
                          ? 'border-red-300 focus:ring-red-500' 
                          : isValid 
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                        }
                      `}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'multiselect' ? (
                    <div className="space-y-2">
                      {field.options?.map((option) => {
                        const selectedValues = Array.isArray(fieldValue) ? fieldValue : []
                        const isSelected = selectedValues.includes(option)
                        
                        return (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const currentValues = Array.isArray(fieldValue) ? fieldValue : []
                                const newValues = e.target.checked
                                  ? [...currentValues, option]
                                  : currentValues.filter(v => v !== option)
                                handleFieldChange(field.name, newValues, field)
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(field.name, e.target.value, field)}
                      onBlur={() => handleFieldBlur(field.name)}
                      placeholder={field.placeholder}
                      className={`
                        w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 
                        focus:outline-none focus:ring-2 focus:border-transparent
                        ${hasError 
                          ? 'border-red-300 focus:ring-red-500' 
                          : isValid 
                          ? 'border-green-300 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                        }
                      `}
                    />
                  )}

                  {/* Validation Icons */}
                  {touchedFields.has(field.name) && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      {hasError ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      ) : isValid ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Validation Error */}
                {hasError && (
                  <p className="text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {validationErrors[field.name]}
                  </p>
                )}

                {/* Character count for text fields */}
                {(field.type === 'text' || field.type === 'textarea') && field.validation?.maxLength && (
                  <p className="text-xs text-gray-500 text-right">
                    {fieldValue.length}/{field.validation.maxLength} characters
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setCurrentStep('template')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ← Back to Templates
          </button>

          <div className="flex items-center space-x-3">
            {/* Completion Status */}
            <div className="text-sm text-gray-500">
              {Object.keys(validationErrors).filter(key => !validationErrors[key]).length} / {selectedTemplate.inputFields.length} fields completed
            </div>

            <button
              type="submit"
              disabled={Object.values(validationErrors).some(error => error)}
              className={`
                px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${Object.values(validationErrors).some(error => error)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                }
              `}
            >
              Continue to Settings →
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
