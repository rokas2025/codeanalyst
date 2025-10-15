import React, { useState, useEffect } from 'react'
import { wordpressService, WordPressConnection } from '../services/wordpressService'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function ConnectedSites() {
    const [connections, setConnections] = useState<WordPressConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => {
        loadConnections()
    }, [])

    const loadConnections = async () => {
        setLoading(true)
        try {
            const response = await wordpressService.getConnections()
            if (response.success && response.connections) {
                setConnections(response.connections)
            } else {
                toast.error(response.message || 'Failed to load connections')
            }
        } catch (error) {
            toast.error('Failed to load WordPress connections')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (connectionId: string, siteUrl: string) => {
        if (!confirm(`Are you sure you want to disconnect ${siteUrl}?`)) {
            return
        }

        setDeleting(connectionId)
        try {
            const response = await wordpressService.deleteConnection(connectionId)
            if (response.success) {
                toast.success('WordPress site disconnected successfully')
                setConnections(connections.filter(c => c.id !== connectionId))
            } else {
                toast.error(response.message || 'Failed to disconnect site')
            }
        } catch (error) {
            toast.error('Failed to disconnect WordPress site')
        } finally {
            setDeleting(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    const getHealthColor = (health: any) => {
        // Simple health check - can be enhanced
        if (!health) return 'gray'
        return 'green'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading connected sites...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Connected WordPress Sites</h1>
                    <p className="mt-1 text-gray-600">Manage your WordPress site connections</p>
                </div>
                <Link to="/settings" className="btn-outline">
                    ← Back to Settings
                </Link>
            </div>

            {connections.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Connected Sites</h3>
                        <p className="text-gray-600 mb-6">
                            You haven't connected any WordPress sites yet. Generate an API key in Settings and install the CodeAnalyst Connector plugin on your WordPress site.
                        </p>
                        <Link to="/settings" className="btn-primary">
                            Go to Settings
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {connections.map((connection) => (
                        <div key={connection.id} className="card p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                                        {connection.site_name || 'WordPress Site'}
                                    </h3>
                                    <a
                                        href={connection.site_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-600 hover:text-indigo-700 break-all"
                                    >
                                        {connection.site_url}
                                    </a>
                                </div>
                                <span className={`flex-shrink-0 h-3 w-3 rounded-full ${connection.is_connected ? 'bg-green-500' : 'bg-gray-400'}`} title={connection.is_connected ? 'Connected' : 'Disconnected'}></span>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">WordPress:</span>
                                    <span className="font-medium">{connection.wordpress_version || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">PHP:</span>
                                    <span className="font-medium">{connection.php_version || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Theme:</span>
                                    <span className="font-medium text-right truncate ml-2">{connection.active_theme || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plugins:</span>
                                    <span className="font-medium">{connection.active_plugins?.length || 0}</span>
                                </div>
                            </div>

                            {connection.site_health && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Site Health</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {connection.site_health.memory_limit && (
                                            <div>
                                                <span className="text-gray-600">Memory:</span>
                                                <span className="ml-1 font-medium">{connection.site_health.memory_limit}</span>
                                            </div>
                                        )}
                                        {connection.site_health.max_upload_size && (
                                            <div>
                                                <span className="text-gray-600">Max Upload:</span>
                                                <span className="ml-1 font-medium">{connection.site_health.max_upload_size}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-3">
                                    Last sync: {connection.last_sync ? formatDate(connection.last_sync) : 'Never'}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDelete(connection.id, connection.site_url)}
                                        disabled={deleting === connection.id}
                                        className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {deleting === connection.id ? 'Disconnecting...' : 'Disconnect'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-500 font-mono truncate">
                                API Key: {connection.api_key}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

