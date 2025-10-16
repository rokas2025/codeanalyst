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

class WordPressService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('auth_token')
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
}

export const wordpressService = new WordPressService()

