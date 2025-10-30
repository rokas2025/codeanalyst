// Preview Theme System for Content Creator
// Professional color schemes and typography for realistic website previews

export interface Theme {
  id: string
  name: string
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  accent: string
  font: string
  headingFont: string
}

export const themes: Record<string, Theme> = {
  modern: {
    id: 'modern',
    name: 'Modern Blue',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    accent: '#10B981',
    font: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    primary: '#8B5CF6',
    secondary: '#EC4899',
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    accent: '#10B981',
    font: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    primary: '#000000',
    secondary: '#404040',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#1A1A1A',
    textSecondary: '#737373',
    border: '#E5E5E5',
    accent: '#000000',
    font: 'Georgia, "Times New Roman", serif',
    headingFont: '"Helvetica Neue", Arial, sans-serif'
  },
  
  elegant: {
    id: 'elegant',
    name: 'Elegant',
    primary: '#6366F1',
    secondary: '#A855F7',
    background: '#FDFCFB',
    surface: '#F8F7F5',
    text: '#2D3748',
    textSecondary: '#718096',
    border: '#E2E8F0',
    accent: '#D946EF',
    font: '"Crimson Text", Georgia, serif',
    headingFont: '"Playfair Display", Georgia, serif'
  },
  
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    primary: '#F59E0B',
    secondary: '#EF4444',
    background: '#FFFFFF',
    surface: '#FEF3C7',
    text: '#1F2937',
    textSecondary: '#4B5563',
    border: '#FDE68A',
    accent: '#10B981',
    font: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    headingFont: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    primary: '#1E40AF',
    secondary: '#0EA5E9',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#475569',
    border: '#CBD5E1',
    accent: '#0EA5E9',
    font: '"Roboto", Arial, sans-serif',
    headingFont: '"Roboto", Arial, sans-serif'
  },
  
  nature: {
    id: 'nature',
    name: 'Nature',
    primary: '#059669',
    secondary: '#10B981',
    background: '#FEFEFE',
    surface: '#F0FDF4',
    text: '#064E3B',
    textSecondary: '#047857',
    border: '#BBF7D0',
    accent: '#F59E0B',
    font: '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
    headingFont: '"Lato", -apple-system, BlinkMacSystemFont, sans-serif'
  },
  
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#FB923C',
    background: '#FFFBF5',
    surface: '#FFF7ED',
    text: '#7C2D12',
    textSecondary: '#9A3412',
    border: '#FFEDD5',
    accent: '#DC2626',
    font: '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
    headingFont: '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif'
  }
}

export const defaultTheme = themes.modern

export function getTheme(themeId: string): Theme {
  return themes[themeId] || defaultTheme
}

export function getThemeList(): Theme[] {
  return Object.values(themes)
}

