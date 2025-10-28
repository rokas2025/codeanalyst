import React, { useState, useEffect } from 'react'
import { wordpressService, WordPressConnection } from '../services/wordpressService'
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface WordPressSiteSelectorProps {
    onSiteSelect: (site: WordPressConnection) => void
    label?: string
    className?: string
}

export function WordPressSiteSelector({ onSiteSelect, label, className = '' }: WordPressSiteSelectorProps) {
    const [connections, setConnections] = useState<WordPressConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSite, setSelectedSite] = useState<string>('')

    useEffect(() => {
        loadConnections()
    }, [])

    const loadConnections = async () => {
        setLoading(true)
        try {
            const response = await wordpressService.getConnections()
            if (response.success && response.connections) {
                setConnections(response.connections)
            }
        } catch (error) {
            console.error('Failed to load WordPress connections:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const connectionId = e.target.value
        setSelectedSite(connectionId)
        
        const site = connections.find(c => c.id === connectionId)
        if (site) {
            onSiteSelect(site)
        }
    }

    const getBuilderBadges = (site: WordPressConnection) => {
        if (!site.site_info?.builders || site.site_info.builders.length === 0) {
            return null
        }

        const builderColors: Record<string, string> = {
            'elementor': 'bg-pink-100 text-pink-700',
            'gutenberg': 'bg-blue-100 text-blue-700',
            'wpbakery': 'bg-purple-100 text-purple-700',
            'divi': 'bg-green-100 text-green-700',
            'beaver': 'bg-orange-100 text-orange-700',
            'oxygen': 'bg-cyan-100 text-cyan-700',
            'bricks': 'bg-red-100 text-red-700'
        }

        return (
            <span className="ml-2 text-xs">
                {site.site_info.builders.map((builder, idx) => (
                    <span
                        key={builder}
                        className={`inline-block px-1.5 py-0.5 rounded ${builderColors[builder] || 'bg-gray-100 text-gray-700'} ${idx > 0 ? 'ml-1' : ''}`}
                    >
                        {builder}
                    </span>
                ))}
            </span>
        )
    }

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-10 bg-gray-200 rounded"></div>
            </div>
        )
    }

    if (connections.length === 0) {
        return (
            <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-start">
                    <GlobeAltIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-yellow-800">No WordPress Sites Connected</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Connect a WordPress site in <a href="/settings" className="underline hover:text-yellow-900">Settings</a> to analyze it here.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={selectedSite}
                    onChange={handleSiteChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                    <option value="">Select a WordPress site...</option>
                    {connections.map((site) => (
                        <option key={site.id} value={site.id}>
                            {site.site_name || site.site_url} - {site.site_url}
                        </option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            
            {selectedSite && connections.find(c => c.id === selectedSite) && (
                <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-900">
                                {connections.find(c => c.id === selectedSite)?.site_name}
                            </p>
                            <p className="text-xs text-indigo-700">
                                WordPress {connections.find(c => c.id === selectedSite)?.wordpress_version}
                                {getBuilderBadges(connections.find(c => c.id === selectedSite)!)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

