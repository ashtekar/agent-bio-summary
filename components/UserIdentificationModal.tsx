'use client'

import React, { useState } from 'react'
import { useUserSession } from '@/lib/contexts/UserSessionContext'
import { toast } from 'react-hot-toast'

interface UserIdentificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  feedbackContext?: {
    type: 'summary' | 'article' | 'top10'
    value: 'up' | 'down'
    summaryId?: string
    articleId?: string
  }
}

export default function UserIdentificationModal({
  isOpen,
  onClose,
  onSuccess,
  feedbackContext
}: UserIdentificationModalProps) {
  const { login } = useUserSession()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'existing' | 'new' | null>(null)
  const [step, setStep] = useState<'select' | 'existing' | 'new' | 'sent'>('select')

  const handleExistingUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/lookup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const result = await response.json()

      if (result.success) {
        login(result.sessionToken, result.recipientId, email.trim())
        toast.success('Welcome back!')
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || 'User not found')
        // Redirect to new user flow
        setUserType('new')
        setStep('new')
      }
    } catch (error) {
      console.error('Error looking up user:', error)
      toast.error('Failed to lookup user. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          feedbackContext 
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStep('sent')
        toast.success('Check your email for a verification link!')
      } else {
        toast.error(result.error || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Error sending magic link:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setUserType(null)
    setStep('select')
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              👍👎 Help us improve our summaries!
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            We'd love to know what you think! Please identify yourself to provide feedback.
          </p>

          {/* Step 1: User Type Selection */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="userType"
                    value="existing"
                    checked={userType === 'existing'}
                    onChange={(e) => setUserType(e.target.value as 'existing')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">I'm an existing subscriber</div>
                    <div className="text-sm text-gray-500">I already receive daily summaries</div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="userType"
                    value="new"
                    checked={userType === 'new'}
                    onChange={(e) => setUserType(e.target.value as 'new')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium">I'm new here</div>
                    <div className="text-sm text-gray-500">I want to provide feedback and join the community</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (userType === 'existing') {
                      setStep('existing')
                    } else if (userType === 'new') {
                      setStep('new')
                    }
                  }}
                  disabled={!userType}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Existing User Email */}
          {step === 'existing' && (
            <form onSubmit={handleExistingUserSubmit} className="space-y-4">
              <div>
                <label htmlFor="existing-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="existing-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Looking up...' : 'Look up my account'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New User Email */}
          {step === 'new' && (
            <form onSubmit={handleNewUserSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="new-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll send you a verification link to confirm your email.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send me a verification link'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Email Sent Confirmation */}
          {step === 'sent' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Check your email!
                </h3>
                <p className="text-gray-600">
                  We sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Click the link in your email to verify your account and start providing feedback.
                </p>
              </div>

              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
