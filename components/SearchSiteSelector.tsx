'use client'

import { useState, useEffect } from 'react'
import { SearchSite } from '@/lib/types'

interface SearchSiteSelectorProps {
  onSitesChange?: (sites: SearchSite[]) => void
}

export function SearchSiteSelector({ onSitesChange }: SearchSiteSelectorProps) {
  const [searchSites, setSearchSites] = useState<SearchSite[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSearchSites()
  }, [])

  useEffect(() => {
    if (onSitesChange) {
      onSitesChange(searchSites)
    }
  }, [searchSites, onSitesChange])

  const loadSearchSites = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/search-sites')
      if (response.ok) {
        const sites = await response.json()
        setSearchSites(sites)
      } else {
        setError('Failed to load search sites')
      }
    } catch (error) {
      console.error('Error loading search sites:', error)
      setError('Failed to load search sites')
    } finally {
      setLoading(false)
    }
  }

  const addSearchSite = async () => {
    if (newDomain && newDisplayName) {
      try {
        setSaving(true)
        setError('')
        
        const response = await fetch('/api/search-sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            domain: newDomain, 
            display_name: newDisplayName 
          })
        })
        
        if (response.ok) {
          const newSite = await response.json()
          setSearchSites([...searchSites, newSite])
          setNewDomain('')
          setNewDisplayName('')
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add search site')
        }
      } catch (error) {
        console.error('Error adding search site:', error)
        setError('Failed to add search site')
      } finally {
        setSaving(false)
      }
    }
  }

  const toggleSiteActive = async (id: string) => {
    try {
      const site = searchSites.find(s => s.id === id)
      if (site) {
        const response = await fetch(`/api/search-sites/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            is_active: !site.is_active 
          })
        })
        
        if (response.ok) {
          setSearchSites(searchSites.map(s => 
            s.id === id ? { ...s, is_active: !s.is_active } : s
          ))
        } else {
          setError('Failed to update search site')
        }
      }
    } catch (error) {
      console.error('Error toggling search site:', error)
      setError('Failed to update search site')
    }
  }

  const removeSearchSite = async (id: string) => {
    try {
      const response = await fetch(`/api/search-sites/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSearchSites(searchSites.filter(site => site.id !== id))
      } else {
        setError('Failed to remove search site')
      }
    } catch (error) {
      console.error('Error removing search site:', error)
      setError('Failed to remove search site')
    }
  }

  const activeSitesCount = searchSites.filter(site => site.is_active).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-gray-600">Loading search sites...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Add New Site */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Display Name (e.g., LinkedIn)"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        />
        <input
          type="text"
          placeholder="Domain (e.g., linkedin.com)"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        />
        <button
          onClick={addSearchSite}
          disabled={saving || !newDomain || !newDisplayName}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Sites List */}
      <div className="space-y-3">
        {searchSites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No search sites configured. Add your first site above.
          </div>
        ) : (
          searchSites.map((site) => (
            <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={site.is_active}
                  onChange={() => toggleSiteActive(site.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">{site.display_name}</p>
                  <p className="text-sm text-gray-500">{site.domain}</p>
                </div>
              </div>
              <button
                onClick={() => removeSearchSite(site.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Status Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-800 text-sm">
          <strong>{activeSitesCount}</strong> of <strong>{searchSites.length}</strong> sites are active.
          {activeSitesCount === 0 && (
            <span className="block mt-1 text-red-600">
              ⚠️ No sites are active. Search will not work until at least one site is enabled.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
