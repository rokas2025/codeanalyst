import React, { useState, useEffect, useRef } from 'react'
import { wordpressService, WordPressConnection } from '../services/wordpressService'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpTrayIcon, DocumentTextIcon, FolderIcon, ArrowDownTrayIcon, GlobeAltIcon, CodeBracketIcon, DocumentCheckIcon } from '@heroicons/react/24/outline'

export function ConnectedSites() {
    const navigate = useNavigate()
    const [connections, setConnections] = useState<WordPressConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [uploading, setUploading] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [expandedConnection, setExpandedConnection] = useState<string | null>(null)
    const [filesData, setFilesData] = useState<Record<string, any>>({})
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

    const handleDownloadPlugin = async () => {
        try {
            toast.loading('Downloading plugin...')
            await wordpressService.downloadPlugin()
            toast.dismiss()
            toast.success('Plugin downloaded successfully!')
        } catch (error) {
            toast.dismiss()
            toast.error('Failed to download plugin')
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

    const getBuilderBadgeColor = (builder: string) => {
        const colors: Record<string, string> = {
            'elementor': 'bg-pink-100 text-pink-700',
            'gutenberg': 'bg-blue-100 text-blue-700',
            'wpbakery': 'bg-purple-100 text-purple-700',
            'divi': 'bg-green-100 text-green-700',
            'beaver': 'bg-orange-100 text-orange-700',
            'oxygen': 'bg-cyan-100 text-cyan-700',
            'bricks': 'bg-red-100 text-red-700'
        }
        return colors[builder] || 'bg-gray-100 text-gray-700'
    }

    const getBuilderDisplayName = (builder: string) => {
        const names: Record<string, string> = {
            'elementor': 'Elementor',
            'gutenberg': 'Gutenberg',
            'wpbakery': 'WPBakery',
            'divi': 'Divi',
            'beaver': 'Beaver Builder',
            'oxygen': 'Oxygen',
            'bricks': 'Bricks'
        }
        return names[builder] || builder
    }

    const handleAnalyzeWebsite = (siteUrl: string) => {
        navigate('/website-analyst', { state: { prefilledUrl: siteUrl } })
    }

    const handleAnalyzeThemeCode = async (connectionId: string) => {
        try {
            toast.loading('Fetching theme files...')
            const response = await wordpressService.getThemeFiles(connectionId)
            toast.dismiss()
            
            if (response.success && response.files) {
                navigate('/code-analyst', { 
                    state: { 
                        wordpressThemeFiles: response.files,
                        connectionId 
                    } 
                })
            } else {
                toast.error(response.error || 'Failed to fetch theme files')
            }
        } catch (error) {
            toast.dismiss()
            toast.error('Failed to fetch theme files')
        }
    }

    const handleAnalyzeContent = async (connectionId: string) => {
        try {
            toast.loading('Fetching homepage content...')
            // Fetch homepage (use 'homepage' as special identifier)
            const response = await wordpressService.getPageContent(connectionId, 'homepage')
            toast.dismiss()
            
            if (response.success && response.content) {
                navigate('/content-analyst', { 
                    state: { 
                        wordpressContent: response.content,
                        wordpressTitle: response.title,
                        wordpressUrl: response.url,
                        connectionId 
                    } 
                })
            } else {
                toast.error(response.error || 'Failed to fetch page content')
            }
        } catch (error) {
            toast.dismiss()
            toast.error('Failed to fetch page content')
        }
    }

    const getHealthColor = (health: any) => {
        // Simple health check - can be enhanced
        if (!health) return 'gray'
        return 'green'
    }

    const handleFileSelect = async (connectionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.zip')) {
            toast.error('Please select a ZIP file')
            return
        }

        setUploading(connectionId)
        setUploadProgress(0)

        try {
            const response = await wordpressService.uploadZip(connectionId, file, (progress) => {
                setUploadProgress(Math.round(progress))
            })

            if (response.success && response.data) {
                toast.success(`Upload successful! ${response.data.themeFiles} theme files, ${response.data.elementorPages} Elementor pages`)
                // Reload connection data
                await loadConnectionFiles(connectionId)
            } else {
                toast.error(response.message || 'Upload failed')
            }
        } catch (error) {
            toast.error('Failed to upload WordPress ZIP')
        } finally {
            setUploading(null)
            setUploadProgress(0)
            // Reset file input
            if (fileInputRefs.current[connectionId]) {
                fileInputRefs.current[connectionId]!.value = ''
            }
        }
    }

    const loadConnectionFiles = async (connectionId: string) => {
        try {
            const [filesResponse, pagesResponse] = await Promise.all([
                wordpressService.getFiles(connectionId),
                wordpressService.getElementorPages(connectionId)
            ])

            setFilesData(prev => ({
                ...prev,
                [connectionId]: {
                    files: filesResponse.success ? filesResponse.files : [],
                    pages: pagesResponse.success ? pagesResponse.pages : []
                }
            }))
        } catch (error) {
            console.error('Failed to load connection files:', error)
        }
    }

    const toggleExpanded = async (connectionId: string) => {
        if (expandedConnection === connectionId) {
            setExpandedConnection(null)
        } else {
            setExpandedConnection(connectionId)
            if (!filesData[connectionId]) {
                await loadConnectionFiles(connectionId)
            }
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadPlugin}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Download Plugin
                    </button>
                <Link to="/settings" className="btn-outline">
                    ← Back to Settings
                </Link>
                </div>
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
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Plugin:</span>
                                    <span className={`font-medium ${connection.plugin_version === '1.1.0' ? 'text-green-600' : 'text-orange-600'}`}>
                                        {connection.plugin_version ? `v${connection.plugin_version}` : 'Not detected'}
                                        {connection.plugin_version && connection.plugin_version !== '1.1.0' && (
                                            <span className="ml-1 text-xs text-orange-600">(Update available)</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Page Builders */}
                            {connection.site_info?.builders && connection.site_info.builders.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-xs font-medium text-gray-700 mb-2">Page Builders</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {connection.site_info.builders.map((builder) => (
                                            <span
                                                key={builder}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBuilderBadgeColor(builder)}`}
                                                title={connection.site_info?.builder_versions?.[builder] ? `Version ${connection.site_info.builder_versions[builder]}` : undefined}
                                            >
                                                {getBuilderDisplayName(builder)}
                                                {connection.site_info?.builder_versions?.[builder] && (
                                                    <span className="ml-1 opacity-75 text-[10px]">
                                                        v{connection.site_info.builder_versions[builder]}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                
                                {/* Quick Actions */}
                                <div className="space-y-2 mb-3">
                                    <h4 className="text-xs font-medium text-gray-700">Quick Actions</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAnalyzeWebsite(connection.site_url)}
                                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                                            title="Analyze website with Website Analyst"
                                        >
                                            <GlobeAltIcon className="w-3.5 h-3.5" />
                                            Analyze Site
                                        </button>
                                        <button
                                            onClick={() => handleAnalyzeThemeCode(connection.id)}
                                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 transition-colors"
                                            title="Analyze theme code with Code Analyst"
                                        >
                                            <CodeBracketIcon className="w-3.5 h-3.5" />
                                            Theme Code
                                        </button>
                                        <button
                                            onClick={() => handleAnalyzeContent(connection.id)}
                                            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors col-span-2"
                                            title="Analyze page content with Content Analyst"
                                        >
                                            <DocumentCheckIcon className="w-3.5 h-3.5" />
                                            Analyze Content
                                        </button>
                                    </div>
                                </div>

                                {/* Upload Section */}
                                <div className="mb-3">
                                    <input
                                        type="file"
                                        ref={el => fileInputRefs.current[connection.id] = el}
                                        accept=".zip,.xml,.sql"
                                        onChange={(e) => handleFileSelect(connection.id, e)}
                                        className="hidden"
                                        id={`file-upload-${connection.id}`}
                                    />
                                    <label
                                        htmlFor={`file-upload-${connection.id}`}
                                        className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50 cursor-pointer transition-colors ${uploading === connection.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Upload WordPress export (XML/SQL) to extract theme files and page content for analysis"
                                    >
                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                        {uploading === connection.id ? `Uploading... ${uploadProgress}%` : 'Upload WP Export (XML/SQL)'}
                                    </label>
                                    {uploading === connection.id && (
                                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* View Files Button */}
                                <button
                                    onClick={() => toggleExpanded(connection.id)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mb-2"
                                >
                                    {expandedConnection === connection.id ? 'Hide Files' : 'View Uploaded Files'}
                                </button>

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

                            {/* Expanded Files View */}
                            {expandedConnection === connection.id && filesData[connection.id] && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="space-y-4">
                                        {/* Theme Files */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FolderIcon className="w-4 h-4 text-gray-600" />
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    Theme Files ({filesData[connection.id].files?.length || 0})
                                                </h4>
                                            </div>
                                            {filesData[connection.id].files?.length > 0 ? (
                                                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                                                    {filesData[connection.id].files.slice(0, 10).map((file: any) => (
                                                        <div key={file.id} className="text-xs text-gray-600 py-1 flex justify-between">
                                                            <span className="truncate flex-1">{file.file_path}</span>
                                                            <span className="text-gray-400 ml-2">{formatFileSize(file.file_size)}</span>
                                                        </div>
                                                    ))}
                                                    {filesData[connection.id].files.length > 10 && (
                                                        <div className="text-xs text-gray-500 italic mt-1">
                                                            ...and {filesData[connection.id].files.length - 10} more files
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">No files uploaded yet</p>
                                            )}
                                        </div>

                                        {/* Elementor Pages */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <DocumentTextIcon className="w-4 h-4 text-gray-600" />
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    Elementor Pages ({filesData[connection.id].pages?.length || 0})
                                                </h4>
                                            </div>
                                            {filesData[connection.id].pages?.length > 0 ? (
                                                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
                                                    {filesData[connection.id].pages.map((page: any) => (
                                                        <div key={page.id} className="text-xs text-gray-600 py-1">
                                                            <span className="font-medium">{page.post_title}</span>
                                                            <span className="text-gray-400 ml-2">(Post ID: {page.post_id})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 italic">No Elementor pages found</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

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

