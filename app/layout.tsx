import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { UserSessionProvider } from '@/lib/contexts/UserSessionContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgentBioSummary - Synthetic Biology Daily Digest',
  description: 'Automated daily summaries of synthetic biology research for high school students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserSessionProvider>
          <div className="min-h-screen gradient-bg">
            <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-white">
                      AgentBioSummary
                    </h1>
                    <span className="ml-2 text-sm text-white/80">
                      Synthetic Biology Daily Digest
                    </span>
                  </div>
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </UserSessionProvider>
      </body>
    </html>
  )
}
