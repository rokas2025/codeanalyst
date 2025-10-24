const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://codeanalyst-production.up.railway.app/api'

export interface WordPressConnection {
    id: string
    site_url: string
    site_name: string
    wordpress_version: string
    active_theme: string
    active_plugins: Array<{ name: string; version: string }>
    site_health: {
        php_version: string
        mysql_version: string
        memory_limit: string
        max_upload_size: string
    }
    php_version: string
    is_connected: boolean
    last_sync: string
    created_at: string
    api_key: string // Masked
}

export interface GenerateKeyResponse {
    success: boolean
    apiKey?: string
    message?: string
    error?: string
}

export interface ConnectionsResponse {
    success: boolean
    connections?: WordPressConnection[]
    count?: number
    error?: string
    message?: string
}

export interface DeleteResponse {
    success: boolean
    message?: string
    error?: string
}

export interface UploadResponse {
    success: boolean
    message?: string
    error?: string
    data?: {
        themeFiles: number
        elementorFiles: number
        elementorPages: number
        totalFiles: number
        totalSize: number
    }
}

export interface WordPressFile {
    id: string
    file_path: string
    file_type: string
    file_size: number
    uploaded_at: string
}

export interface ElementorPage {
    id: string
    post_id: number
    post_title: string
    elementor_data: any
    page_url: string
    last_modified: string
    created_at: string
}

class WordPressService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('auth_token')
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    }

    private getAuthHeadersForUpload(): HeadersInit {
        const token = localStorage.getItem('auth_token')
        return {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData - browser will set it with boundary
        }
    }

    /**
     * Download WordPress plugin
     */
    async downloadPlugin(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/plugin/download`, {
                headers: this.getAuthHeaders()
            })
            
            if (!response.ok) {
                throw new Error('Failed to download plugin')
            }
            
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'codeanalyst-connector.zip'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download plugin error:', error)
            throw error
        }
    }

    /**
     * Generate new WordPress API key
     */
    async generateApiKey(): Promise<GenerateKeyResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/generate-key`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            })

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Failed to generate WordPress API key:', error)
            return {
                success: false,
                error: 'Failed to generate API key',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Get all WordPress connections
     */
    async getConnections(): Promise<ConnectionsResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/connections`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Failed to fetch WordPress connections:', error)
            return {
                success: false,
                error: 'Failed to fetch connections',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Delete WordPress connection
     */
    async deleteConnection(connectionId: string): Promise<DeleteResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/connections/${connectionId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            })

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Failed to delete WordPress connection:', error)
            return {
                success: false,
                error: 'Failed to delete connection',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Upload WordPress ZIP file
     */
    async uploadZip(connectionId: string, file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
        try {
            const formData = new FormData()
            formData.append('zipFile', file)

            const xhr = new XMLHttpRequest()

            return new Promise((resolve, reject) => {
                // Track upload progress
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            const percentComplete = (e.loaded / e.total) * 100
                            onProgress(percentComplete)
                        }
                    })
                }

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const data = JSON.parse(xhr.responseText)
                        resolve(data)
                    } else {
                        const error = JSON.parse(xhr.responseText)
                        resolve({
                            success: false,
                            error: error.error || 'Upload failed',
                            message: error.message || 'Unknown error'
                        })
                    }
                })

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'))
                })

                xhr.open('POST', `${API_BASE_URL}/wordpress/upload-zip/${connectionId}`)
                
                const token = localStorage.getItem('auth_token')
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
                }

                xhr.send(formData)
            })
        } catch (error) {
            console.error('Failed to upload WordPress ZIP:', error)
            return {
                success: false,
                error: 'Failed to upload ZIP',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Get uploaded WordPress files
     */
    async getFiles(connectionId: string): Promise<{ success: boolean; files?: WordPressFile[]; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/files/${connectionId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Failed to fetch WordPress files:', error)
            return {
                success: false,
                error: 'Failed to fetch files'
            }
        }
    }

    /**
     * Get Elementor pages
     */
    async getElementorPages(connectionId: string): Promise<{ success: boolean; pages?: ElementorPage[]; error?: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/wordpress/elementor-pages/${connectionId}`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            const data = await response.json()
            return data
        } catch (error) {
            console.error('Failed to fetch Elementor pages:', error)
            return {
                success: false,
                error: 'Failed to fetch pages'
            }
        }
    }
}

export const wordpressService = new WordPressService()

