'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserSession {
  recipientId: string
  sessionToken: string
  email?: string
  name?: string
}

interface UserSessionContextType {
  session: UserSession | null
  isLoading: boolean
  login: (sessionToken: string, recipientId: string, email?: string, name?: string) => void
  logout: () => void
  validateSession: () => Promise<boolean>
}

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined)

interface UserSessionProviderProps {
  children: ReactNode
}

export function UserSessionProvider({ children }: UserSessionProviderProps) {
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = localStorage.getItem('userSession')
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession)
          
          // Validate session with server
          const isValid = await validateSessionWithServer(parsedSession.sessionToken)
          if (isValid) {
            setSession(parsedSession)
          } else {
            // Clear invalid session
            localStorage.removeItem('userSession')
          }
        }
      } catch (error) {
        console.error('Error loading session:', error)
        localStorage.removeItem('userSession')
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  // Check for session token in URL (from magic link verification)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionToken = urlParams.get('session')
    const welcome = urlParams.get('welcome')
    
    if (sessionToken && !session) {
      // Session token from magic link - validate and store
      validateAndStoreSession(sessionToken)
      
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('session')
      if (welcome) {
        newUrl.searchParams.delete('welcome')
        // Could show welcome message here
      }
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [session])

  const validateSessionWithServer = async (sessionToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/auth/session?token=${sessionToken}`)
      const result = await response.json()
      return result.success && result.valid
    } catch (error) {
      console.error('Error validating session:', error)
      return false
    }
  }

  const validateAndStoreSession = async (sessionToken: string) => {
    try {
      const response = await fetch(`/api/auth/session?token=${sessionToken}`)
      const result = await response.json()
      
      if (result.success && result.valid && result.recipientId) {
        const newSession: UserSession = {
          sessionToken,
          recipientId: result.recipientId
        }
        
        setSession(newSession)
        localStorage.setItem('userSession', JSON.stringify(newSession))
      }
    } catch (error) {
      console.error('Error validating and storing session:', error)
    }
  }

  const login = (sessionToken: string, recipientId: string, email?: string, name?: string) => {
    const newSession: UserSession = {
      sessionToken,
      recipientId,
      email,
      name
    }
    
    setSession(newSession)
    localStorage.setItem('userSession', JSON.stringify(newSession))
  }

  const logout = async () => {
    if (session?.sessionToken) {
      try {
        await fetch(`/api/auth/session?token=${session.sessionToken}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error logging out:', error)
      }
    }
    
    setSession(null)
    localStorage.removeItem('userSession')
  }

  const validateSession = async (): Promise<boolean> => {
    if (!session?.sessionToken) {
      return false
    }
    
    const isValid = await validateSessionWithServer(session.sessionToken)
    if (!isValid) {
      logout()
    }
    
    return isValid
  }

  const value: UserSessionContextType = {
    session,
    isLoading,
    login,
    logout,
    validateSession
  }

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  )
}

export function useUserSession(): UserSessionContextType {
  const context = useContext(UserSessionContext)
  if (context === undefined) {
    throw new Error('useUserSession must be used within a UserSessionProvider')
  }
  return context
}
