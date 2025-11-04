// WordPress Preview Service - Handle preview URL minting with JWT tokens
import { logger } from '../utils/logger.js'

export class WordPressPreviewService {
  /**
   * Mint a preview URL from WordPress plugin
   * @param {Object} params - Preview parameters
   * @param {string} params.siteUrl - WordPress site URL
   * @param {string} params.pluginApiKey - Plugin API key for authentication
   * @param {string|number} params.target - Page/post ID or path
   * @param {string} [params.builder] - Builder type (gutenberg|elementor|divi|wpbakery|auto)
   * @returns {Promise<{previewUrl: string, ttl: number}>}
   */
  static async mintPreviewUrl({ siteUrl, pluginApiKey, target, builder = 'auto' }) {
    try {
      const appPublicUrl = process.env.APP_PUBLIC_URL || 'https://app.beenex.dev'
      const timeout = parseInt(process.env.WP_REQUEST_TIMEOUT_MS || '10000', 10)

      // Ensure siteUrl ends with /
      const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
      const mintUrl = `${baseUrl}/wp-json/codeanalyst/v1/preview/mint`

      logger.info('Minting preview URL', { siteUrl, target, builder })

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(mintUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': pluginApiKey
          },
          body: JSON.stringify({
            target,
            builder,
            audience: appPublicUrl
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          logger.error('Preview mint failed', {
            status: response.status,
            error: errorData
          })

          throw new Error(
            errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
          )
        }

        const data = await response.json()

        if (!data.preview_url) {
          throw new Error('Invalid response: missing preview_url')
        }

        // Validate URL is same origin as siteUrl
        try {
          const previewUrlObj = new URL(data.preview_url)
          const siteUrlObj = new URL(baseUrl)

          if (previewUrlObj.origin !== siteUrlObj.origin) {
            logger.error('Preview URL origin mismatch', {
              previewOrigin: previewUrlObj.origin,
              siteOrigin: siteUrlObj.origin
            })
            throw new Error('Preview URL origin does not match site URL')
          }
        } catch (urlError) {
          logger.error('Invalid preview URL format', { url: data.preview_url, error: urlError.message })
          throw new Error('Invalid preview URL format')
        }

        const ttl = data.ttl || 300 // Default 5 minutes

        logger.info('Preview URL minted successfully', {
          siteUrl,
          ttl,
          hasUrl: !!data.preview_url
        })

        return {
          previewUrl: data.preview_url,
          ttl
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)

        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`)
        }

        throw fetchError
      }
    } catch (error) {
      logger.error('Preview minting error', {
        error: error.message,
        stack: error.stack,
        siteUrl,
        target
      })
      throw error
    }
  }
}

export default WordPressPreviewService

