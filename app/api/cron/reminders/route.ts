import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/email/notifications'

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job service like Vercel Cron or external cron
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await NotificationService.scheduleReminders()
    
    return NextResponse.json({
      message: 'Reminder scheduling completed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Cron reminder error:', error)
    return NextResponse.json(
      { message: 'Reminder scheduling failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Same as GET but for POST requests from cron services
  return GET(request)
}
