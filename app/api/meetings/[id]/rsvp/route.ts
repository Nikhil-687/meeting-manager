import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { getUserFromToken } from '@/lib/auth'
import { Meeting } from '@/lib/models/Meetings'
import { NotificationService } from '@/lib/email/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { status } = await request.json()

    if (!['accepted', 'declined', 'maybe'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid RSVP status' },
        { status: 400 }
      )
    }

    const meetings = await getCollection('meetings')
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid meeting ID' },
        { status: 400 }
      )
    }

    // Get the meeting first
    const meeting = await meetings.findOne({
      _id: new ObjectId(params.id),
      'participants.email': user.email,
      isActive: true
    })

    if (!meeting) {
      return NextResponse.json(
        { message: 'Meeting not found or you are not invited' },
        { status: 404 }
      )
    }

    // Update participant status
    const result = await meetings.updateOne(
      {
        _id: new ObjectId(params.id),
        'participants.email': user.email,
        isActive: true
      },
      {
        $set: {
          'participants.$.status': status,
          'participants.$.respondedAt': new Date(),
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: 'Failed to update RSVP' },
        { status: 500 }
      )
    }

    // Send RSVP confirmation
    try {
      await NotificationService.sendRSVPConfirmation(meeting as Meeting, user.email, status)
      console.log(`RSVP confirmation sent to ${user.email} for meeting: ${meeting.title}`)
    } catch (emailError) {
      console.error('Failed to send RSVP confirmation:', emailError)
    }

    return NextResponse.json({
      message: 'RSVP updated successfully',
      status,
      confirmationSent: true
    })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle RSVP via GET request (for email links)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const email = searchParams.get('email')

    if (!status || !email || !['accepted', 'declined', 'maybe'].includes(status)) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid-rsvp', request.url))
    }

    const meetings = await getCollection('meetings')
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid-meeting', request.url))
    }

    // Get the meeting first
    const meeting = await meetings.findOne({
      _id: new ObjectId(params.id),
      'participants.email': email,
      isActive: true
    })

    if (!meeting) {
      return NextResponse.redirect(new URL('/dashboard?error=meeting-not-found', request.url))
    }

    // Update participant status
    await meetings.updateOne(
      {
        _id: new ObjectId(params.id),
        'participants.email': email,
        isActive: true
      },
      {
        $set: {
          'participants.$.status': status,
          'participants.$.respondedAt': new Date(),
          updatedAt: new Date()
        }
      }
    )

    // Send RSVP confirmation
    try {
      await NotificationService.sendRSVPConfirmation(meeting as Meeting, email, status)
    } catch (emailError) {
      console.error('Failed to send RSVP confirmation:', emailError)
    }

    return NextResponse.redirect(new URL(`/meetings/${params.id}?rsvp=${status}`, request.url))
  } catch (error) {
    console.error('RSVP via email error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=rsvp-failed', request.url))
  }
}
