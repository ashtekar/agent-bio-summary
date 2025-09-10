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
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Add New Site */}
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Display Name (e.g., LinkedIn)"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
          className="flex-1 px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/10 input-focus"
        />
        <input
          type="text"
          placeholder="Domain (e.g., news.mit.edu, linkedin.com)"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          className="flex-1 px-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white bg-white/10 input-focus"
        />
        <button
          onClick={addSearchSite}
          disabled={saving || !newDomain || !newDisplayName}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Sites List */}
      <div className="space-y-3">
        {searchSites.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            No search sites configured. Add your first site above.
          </div>
        ) : (
          searchSites.map((site) => (
            <div key={site.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={site.is_active}
                  onChange={() => toggleSiteActive(site.id)}
                  className="h-4 w-4 text-blue-400 focus:ring-blue-400 border-white/30 rounded"
                />
                <div>
                  <p className="font-medium text-white">{site.display_name}</p>
                  <p className="text-sm text-white/70">{site.domain}</p>
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
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
        <p className="text-blue-300 text-sm">
          <strong>{activeSitesCount}</strong> of <strong>{searchSites.length}</strong> sites are active.
          {activeSitesCount === 0 && (
            <span className="block mt-1 text-red-300">
              ⚠️ No sites are active. Search will not work until at least one site is enabled.
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
