'use client'

import { useState, useEffect } from 'react'

interface EmailRecipient {
  id: string
  email: string
  name: string
  active: boolean
}

interface SearchSettings {
  timeWindow: number
  sources: string[]
  keywords: string[]
  maxArticles: number
}

interface SystemSettings {
  scheduleTime: string
  emailTemplate: string
  summaryLength: 'short' | 'medium' | 'long'
  includeImages: boolean
}

export function Settings() {
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    timeWindow: 24,
    sources: ['Nature', 'Science', 'Cell', 'PNAS'],
    keywords: ['synthetic biology', 'CRISPR', 'gene editing', 'bioengineering'],
    maxArticles: 50
  })
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    scheduleTime: '08:00',
    emailTemplate: 'default',
    summaryLength: 'medium',
    includeImages: true
  })
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => {
    // Simulate loading settings
    setTimeout(() => {
      setEmailRecipients([
        { id: '1', email: 'student@school.edu', name: 'High School Student', active: true },
        { id: '2', email: 'teacher@school.edu', name: 'Biology Teacher', active: true }
      ])
    }, 500)
  }, [])

  const addEmailRecipient = () => {
    if (newEmail && newName) {
      const newRecipient: EmailRecipient = {
        id: Date.now().toString(),
        email: newEmail,
        name: newName,
        active: true
      }
      setEmailRecipients([...emailRecipients, newRecipient])
      setNewEmail('')
      setNewName('')
    }
  }

  const removeEmailRecipient = (id: string) => {
    setEmailRecipients(emailRecipients.filter(recipient => recipient.id !== id))
  }

  const toggleRecipientActive = (id: string) => {
    setEmailRecipients(emailRecipients.map(recipient => 
      recipient.id === id ? { ...recipient, active: !recipient.active } : recipient
    ))
  }

  const saveSettings = async () => {
    // TODO: Implement settings save functionality
    console.log('Saving settings...', { emailRecipients, searchSettings, systemSettings })
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
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  checked={recipient.active}
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
              value={searchSettings.timeWindow}
              onChange={(e) => setSearchSettings({...searchSettings, timeWindow: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Articles
            </label>
            <input
              type="number"
              value={searchSettings.maxArticles}
              onChange={(e) => setSearchSettings({...searchSettings, maxArticles: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            value={searchSettings.keywords.join(', ')}
            onChange={(e) => setSearchSettings({...searchSettings, keywords: e.target.value.split(',').map(k => k.trim())})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              value={systemSettings.scheduleTime}
              onChange={(e) => setSystemSettings({...systemSettings, scheduleTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Length
            </label>
            <select
              value={systemSettings.summaryLength}
              onChange={(e) => setSystemSettings({...systemSettings, summaryLength: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={systemSettings.includeImages}
              onChange={(e) => setSystemSettings({...systemSettings, includeImages: e.target.checked})}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Include images in email summaries</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
