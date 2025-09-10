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

interface DashboardProps {
  onTabChange: (tab: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps) {
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
      <div className="bg-white/10 backdrop-blur-md rounded-lg card-shadow p-6 fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-blue-500/30 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-sm font-medium text-blue-300">Last Run</div>
              <div className="text-lg font-semibold text-blue-100">{systemStatus.lastRun}</div>
            </div>
            <div className="bg-white/5 border border-green-500/30 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-sm font-medium text-green-300">Articles Found</div>
              <div className="text-lg font-semibold text-green-100">{systemStatus.articlesFound}</div>
            </div>
            <div className="bg-white/5 border border-purple-500/30 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-sm font-medium text-purple-300">Summaries Generated</div>
              <div className="text-lg font-semibold text-purple-100">{systemStatus.summariesGenerated}</div>
            </div>
            <div className="bg-white/5 border border-orange-500/30 p-4 rounded-lg hover:bg-white/10 transition-all duration-300">
              <div className="text-sm font-medium text-orange-300">Next Scheduled Run</div>
              <div className="text-lg font-semibold text-orange-100">{systemStatus.nextScheduledRun}</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg card-shadow p-6 fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <button
            onClick={handleManualRun}
            disabled={runningManual}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
          >
            {runningManual ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Recent Summaries */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg card-shadow p-6 fade-in">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Summaries</h2>
        <div className="space-y-3">
          {recentSummaries.map((summary) => (
            <div key={summary.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300">
              <div>
                <h3 className="font-medium text-white">{summary.title}</h3>
                <p className="text-sm text-white/70">{summary.articleCount} articles processed</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  summary.status === 'completed' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  summary.status === 'processing' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                  'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {summary.status}
                </span>
                <button 
                  onClick={() => onTabChange('summaries')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300"
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
