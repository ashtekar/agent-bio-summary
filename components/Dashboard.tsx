'use client'

import { useState, useEffect } from 'react'

interface SystemStatus {
  lastRun: string
  articlesFound: number
  summariesGenerated: number
  emailSent: boolean
  nextScheduledRun: string
}

interface RecentSummary {
  id: string
  date: string
  title: string
  articleCount: number
  status: 'completed' | 'processing' | 'failed'
}

export function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [recentSummaries, setRecentSummaries] = useState<RecentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data.systemStatus)
        setRecentSummaries(data.recentSummaries)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const [runningManual, setRunningManual] = useState(false)

  const handleManualRun = async () => {
    try {
      setRunningManual(true)
      
      const response = await fetch('/api/cron/daily-summary?manual=true', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(`✅ ${result.message}`)
        // Refresh the dashboard data to show updated status
        window.location.reload()
      } else {
        alert(`❌ ${result.error}`)
      }
    } catch (error) {
      console.error('Error running manual search:', error)
      alert('❌ Failed to run manual search. Please check the console for details.')
    } finally {
      setRunningManual(false)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Last Run</div>
              <div className="text-lg font-semibold text-blue-900">{systemStatus.lastRun}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">Articles Found</div>
              <div className="text-lg font-semibold text-green-900">{systemStatus.articlesFound}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Summaries Generated</div>
              <div className="text-lg font-semibold text-purple-900">{systemStatus.summariesGenerated}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-orange-600">Next Scheduled Run</div>
              <div className="text-lg font-semibold text-orange-900">{systemStatus.nextScheduledRun}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleManualRun}
            disabled={runningManual}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runningManual ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Recent Summaries */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Summaries</h2>
        <div className="space-y-3">
          {recentSummaries.map((summary) => (
            <div key={summary.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{summary.title}</h3>
                <p className="text-sm text-gray-500">{summary.articleCount} articles processed</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  summary.status === 'completed' ? 'bg-green-100 text-green-800' :
                  summary.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {summary.status}
                </span>
                <button 
                  onClick={() => window.location.href = '/summaries'}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
