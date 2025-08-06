import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { getUserFromToken } from '@/lib/auth'
import { Meeting, sanitizeMeeting } from '@/lib/models/Meetings'
import { NotificationService } from '@/lib/email/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const meetings = await getCollection('meetings')
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid meeting ID' },
        { status: 400 }
      )
    }

    const meeting = await meetings.findOne({
      _id: new ObjectId(params.id),
      isActive: true,
      $or: [
        { 'organizer.id': user._id },
        { 'participants.email': user.email }
      ]
    })

    if (!meeting) {
      return NextResponse.json(
        { message: 'Meeting not found' },
        { status: 404 }
      )
    }

    const sanitizedMeeting = sanitizeMeeting(meeting as Meeting, user._id)
    return NextResponse.json(sanitizedMeeting)
  } catch (error) {
    console.error('Get meeting error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const meetings = await getCollection('meetings')
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid meeting ID' },
        { status: 400 }
      )
    }

    const { title, agenda, date, startTime, endTime, location, participants, notifyParticipants = true } = await request.json()

    // Check if user is the organizer
    const existingMeeting = await meetings.findOne({
      _id: new ObjectId(params.id),
      'organizer.id': user._id,
      isActive: true
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { message: 'Meeting not found or you are not authorized to edit it' },
        { status: 404 }
      )
    }

    // Track changes for notification
    const changes: string[] = []
    const updateData: any = {
      updatedAt: new Date()
    }

    if (title && title !== existingMeeting.title) {
      updateData.title = title.trim()
      changes.push(`Title changed to: ${title}`)
    }
    if (agenda !== undefined && agenda !== existingMeeting.agenda) {
      updateData.agenda = agenda.trim()
      changes.push('Agenda updated')
    }
    if (date && date !== existingMeeting.date) {
      updateData.date = date
      changes.push(`Date changed to: ${date}`)
    }
    if (startTime && startTime !== existingMeeting.startTime) {
      updateData.startTime = startTime
      changes.push(`Start time changed to: ${startTime}`)
    }
    if (endTime && endTime !== existingMeeting.endTime) {
      updateData.endTime = endTime
      changes.push(`End time changed to: ${endTime}`)
    }
    if (location !== undefined && location !== existingMeeting.location) {
      updateData.location = location.trim()
      changes.push(`Location changed to: ${location || 'TBD'}`)
    }
    if (participants) {
      updateData.participants = participants.map((email: string) => ({
        email: email.toLowerCase().trim(),
        name: email.split('@')[0],
        status: 'invited' as const
      }))
      changes.push('Participant list updated')
    }

    await meetings.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    )

    const updatedMeeting = await meetings.findOne({ _id: new ObjectId(params.id) })
    const sanitizedMeeting = sanitizeMeeting(updatedMeeting as Meeting, user._id)

    // Send update notifications if there are changes and notification is requested
    if (changes.length > 0 && notifyParticipants) {
      try {
        await NotificationService.sendMeetingUpdate(updatedMeeting as Meeting, changes)
        console.log(`Update notifications sent for meeting: ${updatedMeeting?.title}`)
      } catch (emailError) {
        console.error('Failed to send update notifications:', emailError)
      }
    }

    return NextResponse.json({
      message: 'Meeting updated successfully',
      meeting: sanitizedMeeting,
      changes,
      notificationsSent: changes.length > 0 && notifyParticipants
    })
  } catch (error) {
    console.error('Update meeting error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const meetings = await getCollection('meetings')
    
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Invalid meeting ID' },
        { status: 400 }
      )
    }

    // Check if user is the organizer
    const existingMeeting = await meetings.findOne({
      _id: new ObjectId(params.id),
      'organizer.id': user._id,
      isActive: true
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { message: 'Meeting not found or you are not authorized to delete it' },
        { status: 404 }
      )
    }

    // Send cancellation notifications before deleting
    try {
      await NotificationService.sendMeetingCancellation(existingMeeting as Meeting)
      console.log(`Cancellation notifications sent for meeting: ${existingMeeting.title}`)
    } catch (emailError) {
      console.error('Failed to send cancellation notifications:', emailError)
    }

    // Soft delete the meeting
    await meetings.updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      message: 'Meeting deleted successfully',
      cancellationsSent: true
    })
  } catch (error) {
    console.error('Delete meeting error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
