'use client'

import { useState } from 'react'
import { Dashboard } from '@/components/Dashboard'
import { SummaryViewer } from '@/components/SummaryViewer'
import { Settings } from '@/components/Settings'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'summaries', name: 'Daily Summaries', icon: '📝' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'summaries' && <SummaryViewer />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  )
}
