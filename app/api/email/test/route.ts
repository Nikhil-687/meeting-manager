import { NextRequest, NextResponse } from 'next/server'
import { smtpService } from '@/lib/email/smtp'
import { getUserFromToken } from '@/lib/auth'
import { EmailConfig } from '@/lib/email/config'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { to } = await request.json()
    const testEmail = to || user.email

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { message: 'Invalid email address format' },
        { status: 400 }
      )
    }

    const testTemplate = {
      subject: '✅ Meeting Scheduler - Email Test Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Test</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
                    <div style="font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">
                        📅 Meeting Scheduler
                    </div>
                    <p style="color: #6b7280; margin: 0;">Email Configuration Test</p>
                </div>
                
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #0369a1; margin-top: 0;">🎉 Email Test Successful!</h2>
                    <p style="color: #0369a1; margin-bottom: 15px;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color: #0369a1; margin-bottom: 15px;">
                        Congratulations! Your Meeting Scheduler email configuration is working perfectly.
                    </p>
                    
                    <div style="background: white; border-radius: 4px; padding: 15px; margin: 15px 0;">
                        <h3 style="color: #0369a1; margin-top: 0; font-size: 16px;">Configuration Details:</h3>
                        <ul style="color: #0369a1; margin: 0; padding-left: 20px;">
                            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                            <li>From Email: ${process.env.FROM_EMAIL}</li>
                            <li>Test sent at: ${new Date().toLocaleString()}</li>
                        </ul>
                    </div>
                </div>
                
                <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #166534; margin-top: 0;">✅ Available Email Features:</h3>
                    <ul style="color: #166534; margin: 0; padding-left: 20px;">
                        <li><strong>Meeting Invitations</strong> - Automatic invites when creating meetings</li>
                        <li><strong>RSVP Management</strong> - One-click responses from email</li>
                        <li><strong>Meeting Reminders</strong> - 15-minute before meeting alerts</li>
                        <li><strong>Update Notifications</strong> - Alerts when meetings change</li>
                        <li><strong>Cancellation Notices</strong> - Professional cancellation emails</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.APP_URL}/dashboard" 
                       style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                        Go to Dashboard
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
                    <p>This email was sent by Meeting Scheduler</p>
                    <p>If you received this email unexpectedly, please contact your system administrator.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
Email Test Successful!

Hello ${user.name},

Congratulations! Your Meeting Scheduler email configuration is working perfectly.

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From Email: ${process.env.FROM_EMAIL}
- Test sent at: ${new Date().toLocaleString()}

Available Email Features:
✅ Meeting Invitations - Automatic invites when creating meetings
✅ RSVP Management - One-click responses from email
✅ Meeting Reminders - 15-minute before meeting alerts
✅ Update Notifications - Alerts when meetings change
✅ Cancellation Notices - Professional cancellation emails

Visit your dashboard: ${process.env.APP_URL}/dashboard

This email was sent by Meeting Scheduler.
      `
    }

    const result = await smtpService.sendEmail({
      to: testEmail,
      subject: testTemplate.subject,
      html: testTemplate.html,
      text: testTemplate.text
    })

    if (result.success) {
      return NextResponse.json({
        message: 'Test email sent successfully! Check your inbox.',
        recipient: testEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        { 
          message: 'Failed to send test email', 
          error: result.error,
          recipient: testEmail 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      { 
        message: 'Email test failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Validate configuration first
    const validation = EmailConfig.validateConfig()
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: `Configuration errors: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      })
    }

    const connectionTest = await smtpService.testConnection()
    
    return NextResponse.json({
      ...connectionTest,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Email connection test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
