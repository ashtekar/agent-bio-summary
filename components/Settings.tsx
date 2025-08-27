'use client'

import { useState, useEffect } from 'react'
import { SearchSiteSelector } from './SearchSiteSelector'

interface EmailRecipient {
  id: string
  email: string
  name: string
  is_active: boolean
}

interface SearchSettings {
  time_window_hours: number
  sources: string[]
  keywords: string[]
  max_articles: number
  relevance_threshold: number
}

interface SystemSettings {
  schedule_time: string
  summary_length: 'short' | 'medium' | 'long'
  include_images: boolean
  openai_model: string
}

export function Settings() {
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    time_window_hours: 24,
    sources: ['pubmed', 'arxiv', 'sciencedaily'],
    keywords: ['synthetic biology', 'biotechnology', 'genetic engineering'],
    max_articles: 50,
    relevance_threshold: 6.0
  })
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    schedule_time: '08:00',
    summary_length: 'medium',
    include_images: false,
    openai_model: 'gpt-4o-mini'
  })
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // Load recipients
      const recipientsRes = await fetch('/api/recipients')
      if (recipientsRes.ok) {
        const recipients = await recipientsRes.json()
        setEmailRecipients(recipients)
      }

      // Load settings
      const settingsRes = await fetch('/api/settings')
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        if (settings.search) setSearchSettings(settings.search)
        if (settings.system) setSystemSettings(settings.system)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEmailRecipient = async () => {
    if (newEmail && newName) {
      try {
        console.log('Adding recipient:', { name: newName, email: newEmail })
        
        const response = await fetch('/api/recipients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, email: newEmail })
        })
        
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const newRecipient = await response.json()
          console.log('New recipient created:', newRecipient)
          setEmailRecipients([...emailRecipients, newRecipient])
          setNewEmail('')
          setNewName('')
        } else {
          const errorData = await response.json()
          console.error('Failed to add recipient:', errorData)
          alert(`Failed to add recipient: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error adding recipient:', error)
        alert(`Error adding recipient: ${error}`)
      }
    }
  }

  const removeEmailRecipient = async (id: string) => {
    try {
      const response = await fetch(`/api/recipients?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEmailRecipients(emailRecipients.filter(recipient => recipient.id !== id))
      }
    } catch (error) {
      console.error('Error removing recipient:', error)
    }
  }

  const toggleRecipientActive = async (id: string) => {
    try {
      const recipient = emailRecipients.find(r => r.id === id)
      if (recipient) {
        const response = await fetch('/api/recipients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id, 
            is_active: !recipient.is_active 
          })
        })
        
        if (response.ok) {
          setEmailRecipients(emailRecipients.map(r => 
            r.id === id ? { ...r, is_active: !r.is_active } : r
          ))
        }
      }
    } catch (error) {
      console.error('Error toggling recipient:', error)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: searchSettings, system: systemSettings })
      })
      
      if (response.ok) {
        console.log('Settings saved successfully')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Recipients */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Recipients</h2>
        
        {/* Add New Recipient */}
        <div className="flex space-x-4 mb-6">
          <input
            type="email"
            placeholder="Email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          />
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          />
          <button
            onClick={addEmailRecipient}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Recipients List */}
        <div className="space-y-3">
          {emailRecipients.map((recipient) => (
            <div key={recipient.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={recipient.is_active}
                  onChange={() => toggleRecipientActive(recipient.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div>
                  <p className="font-medium text-gray-900">{recipient.name}</p>
                  <p className="text-sm text-gray-500">{recipient.email}</p>
                </div>
              </div>
              <button
                onClick={() => removeEmailRecipient(recipient.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search Sites */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Sites</h2>
        <p className="text-sm text-gray-600 mb-4">
          Configure which websites should be searched for articles. At least one site must be active for search to work.
        </p>
        <SearchSiteSelector />
      </div>

      {/* Search Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Window (hours)
            </label>
            <input
              type="number"
              value={searchSettings.time_window_hours}
              onChange={(e) => setSearchSettings({...searchSettings, time_window_hours: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Articles
            </label>
            <input
              type="number"
              value={searchSettings.max_articles}
              onChange={(e) => setSearchSettings({...searchSettings, max_articles: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relevance Score Threshold
          </label>
          <select
            value={searchSettings.relevance_threshold}
            onChange={e => setSearchSettings({ ...searchSettings, relevance_threshold: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            <option value={8.0}>🟢 Very Strict (8.0+) - Only the most relevant articles</option>
            <option value={6.0}>🟡 High Quality (6.0+) - Recommended</option>
            <option value={4.0}>🟠 Broader Coverage (4.0+)</option>
            <option value={0.0}>⚫ All Articles (0.0+) - No filtering</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {searchSettings.relevance_threshold === 8.0 && 'Only articles with a relevance score of 8.0 or higher will be included. This is very strict and ensures only the most relevant articles are selected.'}
            {searchSettings.relevance_threshold === 6.0 && 'Only articles with a relevance score of 6.0 or higher will be included. This is recommended for high quality and relevance.'}
            {searchSettings.relevance_threshold === 4.0 && 'Articles with a relevance score of 4.0 or higher will be included. This allows for broader coverage, including some tangential content.'}
            {searchSettings.relevance_threshold === 0.0 && 'All articles will be included, regardless of relevance. This may result in low quality or unrelated articles.'}
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={searchSettings.keywords.join(', ')}
            onChange={(e) => setSearchSettings({...searchSettings, keywords: e.target.value.split(',').map(k => k.trim())})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            placeholder="synthetic biology, CRISPR, gene editing"
          />
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Time
            </label>
            <input
              type="time"
              value={systemSettings.schedule_time}
              onChange={(e) => setSystemSettings({...systemSettings, schedule_time: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Length
            </label>
            <select
              value={systemSettings.summary_length}
              onChange={(e) => setSystemSettings({...systemSettings, summary_length: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI Model
          </label>
          <select
            value={systemSettings.openai_model}
            onChange={(e) => setSystemSettings({...systemSettings, openai_model: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-5">GPT-5</option>
            <option value="gpt-5-mini">GPT-5 Mini</option>
            <option value="gpt-5-micro">GPT-5 Micro</option>
            <option value="gpt-5-nano">GPT-5 Nano</option>
            <option value="gpt-5-nano-2025-08-07">GPT-5 Nano (Latest)</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Select the OpenAI model for generating summaries. GPT-4o Mini offers the best balance of quality and cost.
          </p>
        </div>

        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={systemSettings.include_images}
              onChange={(e) => setSystemSettings({...systemSettings, include_images: e.target.checked})}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Include images in email summaries</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
