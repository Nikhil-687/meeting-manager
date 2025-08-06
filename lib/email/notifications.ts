import { getCollection } from '@/lib/mongodb'
import { Meeting } from '@/lib/models/Meetings'
import { smtpService } from './smtp'
import { EmailTemplates } from './templates'

export class NotificationService {
  static async sendMeetingInvitations(meeting: Meeting): Promise<boolean> {
    try {
      const emailPromises = meeting.participants.map(async (participant) => {
        const template = EmailTemplates.meetingInvitation(meeting, participant.email)
        return smtpService.sendEmail({
          to: participant.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      const results = await Promise.all(emailPromises)
      const successCount = results.filter(result => result).length
      
      console.log(`Sent ${successCount}/${meeting.participants.length} meeting invitations`)
      return successCount === meeting.participants.length
    } catch (error) {
      console.error('Failed to send meeting invitations:', error)
      return false
    }
  }

  static async sendMeetingReminders(meeting: Meeting, minutesBefore: number = 15): Promise<boolean> {
    try {
      // Get all participants who accepted or maybe
      const recipientsToRemind = meeting.participants.filter(
        p => p.status === 'accepted' || p.status === 'maybe'
      )

      // Also remind the organizer
      const allRecipients = [
        ...recipientsToRemind.map(p => p.email),
        meeting.organizer.email
      ]

      const emailPromises = allRecipients.map(async (email) => {
        const template = EmailTemplates.meetingReminder(meeting, email, minutesBefore)
        return smtpService.sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      const results = await Promise.all(emailPromises)
      const successCount = results.filter(result => result).length
      
      console.log(`Sent ${successCount}/${allRecipients.length} meeting reminders`)
      return successCount === allRecipients.length
    } catch (error) {
      console.error('Failed to send meeting reminders:', error)
      return false
    }
  }

  static async sendMeetingUpdate(meeting: Meeting, changes: string[]): Promise<boolean> {
    try {
      const allRecipients = [
        ...meeting.participants.map(p => p.email),
        meeting.organizer.email
      ]

      const emailPromises = allRecipients.map(async (email) => {
        const template = EmailTemplates.meetingUpdate(meeting, email, changes)
        return smtpService.sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      const results = await Promise.all(emailPromises)
      const successCount = results.filter(result => result).length
      
      console.log(`Sent ${successCount}/${allRecipients.length} meeting update notifications`)
      return successCount === allRecipients.length
    } catch (error) {
      console.error('Failed to send meeting update notifications:', error)
      return false
    }
  }

  static async sendMeetingCancellation(meeting: Meeting): Promise<boolean> {
    try {
      const allRecipients = meeting.participants.map(p => p.email)

      const emailPromises = allRecipients.map(async (email) => {
        const template = EmailTemplates.meetingCancellation(meeting, email)
        return smtpService.sendEmail({
          to: email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      })

      const results = await Promise.all(emailPromises)
      const successCount = results.filter(result => result).length
      
      console.log(`Sent ${successCount}/${allRecipients.length} meeting cancellation notifications`)
      return successCount === allRecipients.length
    } catch (error) {
      console.error('Failed to send meeting cancellation notifications:', error)
      return false
    }
  }

  static async sendRSVPConfirmation(meeting: Meeting, participantEmail: string, status: string): Promise<boolean> {
    try {
      const template = EmailTemplates.rsvpConfirmation(meeting, participantEmail, status)
      const result = await smtpService.sendEmail({
        to: participantEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      // Also notify organizer about the RSVP
      const organizerTemplate = {
        subject: `RSVP Update: ${meeting.title}`,
        html: `
          <p>Hello ${meeting.organizer.name},</p>
          <p><strong>${participantEmail}</strong> has ${status} the invitation for your meeting:</p>
          <p><strong>${meeting.title}</strong> on ${meeting.date} at ${meeting.startTime}</p>
        `,
        text: `Hello ${meeting.organizer.name},\n\n${participantEmail} has ${status} the invitation for your meeting:\n${meeting.title} on ${meeting.date} at ${meeting.startTime}`
      }

      await smtpService.sendEmail({
        to: meeting.organizer.email,
        subject: organizerTemplate.subject,
        html: organizerTemplate.html,
        text: organizerTemplate.text
      })

      return result.success
    } catch (error) {
      console.error('Failed to send RSVP confirmation:', error)
      return false
    }
  }

  static async scheduleReminders(): Promise<void> {
    try {
      const meetings = await getCollection('meetings')
      const now = new Date()
      const reminderTime = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now

      // Find meetings that need reminders
      const meetingsNeedingReminders = await meetings.find({
        isActive: true,
        reminderSent: false,
        date: reminderTime.toISOString().split('T')[0],
        startTime: {
          $gte: reminderTime.toTimeString().slice(0, 5),
          $lte: new Date(reminderTime.getTime() + 5 * 60 * 1000).toTimeString().slice(0, 5)
        }
      }).toArray()

      for (const meeting of meetingsNeedingReminders) {
        const success = await this.sendMeetingReminders(meeting as Meeting, 15)
        if (success) {
          await meetings.updateOne(
            { _id: meeting._id },
            { $set: { reminderSent: true, updatedAt: new Date() } }
          )
        }
      }

      console.log(`Processed ${meetingsNeedingReminders.length} meeting reminders`)
    } catch (error) {
      console.error('Failed to schedule reminders:', error)
    }
  }
}
