'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Mail, CheckCircle, XCircle, AlertCircle, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface EmailConfig {
  host?: string
  port?: string
  secure?: boolean
  user?: string
  from?: {
    name?: string
    email?: string
  }
}

interface TestResult {
  success: boolean
  error?: string
  config?: EmailConfig
}

export default function EmailSettingsPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const router = useRouter()

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/test')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: 'Failed to test connection'
      })
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return
    
    setSendingTest(true)
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail })
      })
      
      const result = await response.json()
      
      if (result.message) {
        alert(response.ok ? 'Test email sent successfully!' : `Failed: ${result.message}`)
      }
    } catch (error) {
      alert('Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <Link href="/dashboard" className="back-link">
            <ArrowLeft />
            Back to Dashboard
          </Link>
          <div className="header-brand">
            <Mail className="header-icon" />
            <h1 className="header-title">Email Configuration</h1>
          </div>
        </div>
      </header>

      <div className="container py-8" style={{ maxWidth: '800px' }}>
        {/* Connection Status */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">SMTP Connection Status</h2>
            <p className="card-description">Check your email server configuration</p>
          </div>
          <div className="card-content">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse">
                  <AlertCircle className="text-gray-400" style={{ width: '1.5rem', height: '1.5rem' }} />
                </div>
                <span className="text-gray-600">Testing connection...</span>
              </div>
            ) : testResult ? (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  {testResult.success ? (
                    <>
                      <CheckCircle className="text-green-600" style={{ width: '1.5rem', height: '1.5rem' }} />
                      <span className="text-green-800 font-medium">Connection Successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-600" style={{ width: '1.5rem', height: '1.5rem' }} />
                      <span className="text-red-800 font-medium">Connection Failed</span>
                    </>
                  )}
                </div>

                {testResult.config && (
                  <div className="bg-gray-50 rounded p-4 mb-4">
                    <h3 className="font-medium mb-2">Configuration Details:</h3>
                    <div className="text-sm space-y-1">
                      <div><strong>Host:</strong> {testResult.config.host}</div>
                      <div><strong>Port:</strong> {testResult.config.port}</div>
                      <div><strong>Secure:</strong> {testResult.config.secure ? 'Yes' : 'No'}</div>
                      <div><strong>User:</strong> {testResult.config.user}</div>
                      <div><strong>From Name:</strong> {testResult.config.from?.name}</div>
                      <div><strong>From Email:</strong> {testResult.config.from?.email}</div>
                    </div>
                  </div>
                )}

                {testResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                    <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
                    <p className="text-red-700 text-sm">{testResult.error}</p>
                  </div>
                )}

                <button 
                  onClick={testConnection}
                  className="btn btn-outline btn-sm"
                  disabled={loading}
                >
                  Test Again
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Test Email */}
        {testResult?.success && (
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Send Test Email</h2>
              <p className="card-description">Send a test email to verify everything is working</p>
            </div>
            <div className="card-content">
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="form-input flex-1"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={!testEmail || sendingTest}
                  className="btn btn-primary"
                >
                  {sendingTest ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      Send Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Guide */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Setup Guide</h2>
            <p className="card-description">How to configure email settings</p>
          </div>
          <div className="card-content">
            <div className="space-y-6">
              {/* Gmail Setup */}
              <div>
                <h3 className="font-semibold mb-2">📧 Gmail Configuration</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Go to your Google Account settings</li>
                    <li>Enable 2-Factor Authentication</li>
                    <li>Go to "Security" → "App passwords"</li>
                    <li>Generate an app password for "Mail"</li>
                    <li>Use the 16-character password in your .env file</li>
                  </ol>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <code className="text-xs">
                      SMTP_HOST=smtp.gmail.com<br/>
                      SMTP_PORT=587<br/>
                      SMTP_SECURE=false<br/>
                      SMTP_USER=your-email@gmail.com<br/>
                      SMTP_PASS=your-16-char-app-password<br/>
                      FROM_EMAIL=your-email@gmail.com<br/>
                      FROM_NAME=Meeting Scheduler
                    </code>
                  </div>
                </div>
              </div>

              {/* Outlook Setup */}
              <div>
                <h3 className="font-semibold mb-2">📧 Outlook/Hotmail Configuration</h3>
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <div className="p-3 bg-white rounded border">
                    <code className="text-xs">
                      SMTP_HOST=smtp-mail.outlook.com<br/>
                      SMTP_PORT=587<br/>
                      SMTP_SECURE=false<br/>
                      SMTP_USER=your-email@outlook.com<br/>
                      SMTP_PASS=your-password<br/>
                      FROM_EMAIL=your-email@outlook.com<br/>
                      FROM_NAME=Meeting Scheduler
                    </code>
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <h3 className="font-semibold mb-2">⚙️ Environment Variables</h3>
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <p className="text-sm mb-2">Add these to your <code>.env.local</code> file:</p>
                  <div className="p-3 bg-white rounded border font-mono text-xs">
                    <div>SMTP_HOST=smtp.gmail.com</div>
                    <div>SMTP_PORT=587</div>
                    <div>SMTP_SECURE=false</div>
                    <div>SMTP_USER=your-email@gmail.com</div>
                    <div>SMTP_PASS=your-app-password</div>
                    <div>FROM_EMAIL=your-email@gmail.com</div>
                    <div>FROM_NAME=Meeting Scheduler</div>
                    <div>APP_URL=http://localhost:3000</div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting */}
              <div>
                <h3 className="font-semibold mb-2">🔧 Troubleshooting</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Authentication failed:</strong> Check your app password</li>
                    <li><strong>Connection timeout:</strong> Verify host and port settings</li>
                    <li><strong>TLS errors:</strong> Try setting SMTP_SECURE=true for port 465</li>
                    <li><strong>Rate limiting:</strong> Gmail has sending limits (500/day for free accounts)</li>
                    <li><strong>Blocked emails:</strong> Check spam folder and sender reputation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
