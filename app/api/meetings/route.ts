import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Mock database
interface Meeting {
  _id: string
  title: string
  agenda: string
  date: string
  startTime: string
  endTime: string
  location: string
  organizer: {
    id: string
    name: string
    email: string
  }
  participants: Array<{
    email: string
    name: string
    status: 'invited' | 'accepted' | 'declined' | 'maybe'
  }>
  createdAt: Date
}

const meetings: Meeting[] = [
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

  // Filter meetings where user is organizer or participant
  const userMeetings = meetings
    .filter(meeting => 
      meeting.organizer.id === user.id || 
      meeting.participants.some(p => p.email === user.email)
    )
    .map(meeting => ({
      ...meeting,
      isOrganizer: meeting.organizer.id === user.id
    }))
    .sort((a, b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime())

  return NextResponse.json(userMeetings)
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { title, agenda, date, startTime, endTime, location, participants } = await request.json()

    // Validate required fields
    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'Title, date, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Create new meeting
    const meeting: Meeting = {
      _id: Date.now().toString(),
      title,
      agenda: agenda || '',
      date,
      startTime,
      endTime,
      location: location || '',
      organizer: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      participants: participants.map((email: string) => ({
        email,
        name: email.split('@')[0], // Simple name extraction
        status: 'invited' as const
      })),
      createdAt: new Date()
    }

    meetings.push(meeting)

    // In a real app, you would send email invitations here
    console.log(`Sending invitations for meeting: ${title}`)

    return NextResponse.json({
      message: 'Meeting created successfully',
      meeting: {
        ...meeting,
        isOrganizer: true
      }
    })
  } catch (error) {
    console.error('Create meeting error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}