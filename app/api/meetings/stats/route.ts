import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Mock data - same as in meetings route
const meetings = [
  {
    _id: '1',
    title: 'Weekly Team Standup',
    agenda: 'Discuss progress, blockers, and upcoming tasks',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '09:30',
    location: 'Conference Room A',
    organizer: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com'
    },
    participants: [
      { email: 'john@example.com', name: 'John Doe', status: 'accepted' },
      { email: 'jane@example.com', name: 'Jane Smith', status: 'invited' }
    ],
    createdAt: new Date()
  }
]

const users = [
  { id: '1', name: 'Demo User', email: 'demo@example.com' }
]

function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    return users.find(u => u.id === decoded.userId)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  // Filter meetings for the user
  const userMeetings = meetings.filter(meeting => 
    meeting.organizer.id === user.id || 
    meeting.participants.some(p => p.email === user.email)
  )

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Calculate stats using MongoDB-like aggregation logic
  const stats = {
    totalMeetings: userMeetings.length,
    upcomingMeetings: userMeetings.filter(meeting => {
      const meetingDateTime = new Date(meeting.date + 'T' + meeting.startTime)
      return meetingDateTime > now
    }).length,
    todayMeetings: userMeetings.filter(meeting => meeting.date === today).length,
    acceptanceRate: 0
  }

  // Calculate acceptance rate
  const totalInvitations = userMeetings.reduce((total, meeting) => {
    return total + meeting.participants.length
  }, 0)

  const acceptedInvitations = userMeetings.reduce((total, meeting) => {
    return total + meeting.participants.filter(p => p.status === 'accepted').length
  }, 0)

  stats.acceptanceRate = totalInvitations > 0 ? Math.round((acceptedInvitations / totalInvitations) * 100) : 0

  return NextResponse.json(stats)
}
