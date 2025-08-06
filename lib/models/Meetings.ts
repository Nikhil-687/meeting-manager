import { ObjectId } from 'mongodb'

export interface Participant {
  email: string
  name: string
  status: 'invited' | 'accepted' | 'declined' | 'maybe'
  respondedAt?: Date
}

export interface Meeting {
  _id?: ObjectId
  title: string
  agenda: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  location: string
  organizer: {
    id: string
    name: string
    email: string
  }
  participants: Participant[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  meetingType: 'in-person' | 'virtual' | 'hybrid'
  reminderSent: boolean
  notes?: string
  attachments?: string[]
}

export interface MeetingResponse extends Omit<Meeting, '_id' | 'organizer'> {
  _id: string
  organizer: {
    id: string
    name: string
    email: string
  }
  isOrganizer?: boolean
}

export function sanitizeMeeting(meeting: Meeting, currentUserId?: string): MeetingResponse {
  return {
    ...meeting,
    _id: meeting._id?.toString() || '',
    isOrganizer: meeting.organizer.id === currentUserId
  }
}
