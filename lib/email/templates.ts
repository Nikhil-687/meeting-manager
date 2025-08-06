import { Meeting } from '@/lib/models/Meetings'
import { formatDate, formatTime } from '@/lib/utils'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class EmailTemplates {
  private static getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Scheduler</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .meeting-card {
            background: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .meeting-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .meeting-details {
            margin: 15px 0;
        }
        .detail-row {
            display: flex;
            margin: 8px 0;
            align-items: center;
        }
        .detail-label {
            font-weight: 600;
            color: #4b5563;
            min-width: 100px;
        }
        .detail-value {
            color: #1f2937;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 10px 5px;
            text-align: center;
        }
        .btn-success {
            background-color: #16a34a;
        }
        .btn-danger {
            background-color: #dc2626;
        }
        .btn-warning {
            background-color: #d97706;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .agenda {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-style: italic;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .detail-label {
                min-width: auto;
                margin-bottom: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📅 Meeting Scheduler</div>
            <p>Professional Meeting Management</p>
        </div>
        ${content}
        <div class="footer">
            <p>This email was sent by Meeting Scheduler</p>
            <p>If you have any questions, please contact the meeting organizer.</p>
        </div>
    </div>
</body>
</html>
    `
  }

  static meetingInvitation(meeting: Meeting, recipientEmail: string): EmailTemplate {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const meetingUrl = `${appUrl}/meetings/${meeting._id}`
    const acceptUrl = `${appUrl}/api/meetings/${meeting._id}/rsvp?status=accepted&email=${encodeURIComponent(recipientEmail)}`
    const declineUrl = `${appUrl}/api/meetings/${meeting._id}/rsvp?status=declined&email=${encodeURIComponent(recipientEmail)}`
    const maybeUrl = `${appUrl}/api/meetings/${meeting._id}/rsvp?status=maybe&email=${encodeURIComponent(recipientEmail)}`

    const content = `
        <h2>You're Invited to a Meeting!</h2>
        <p>Hello! You have been invited to the following meeting:</p>
        
        <div class="meeting-card">
            <div class="meeting-title">${meeting.title}</div>
            <div class="meeting-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${formatDate(meeting.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${meeting.location || 'TBD'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Organizer:</span>
                    <span class="detail-value">${meeting.organizer.name} (${meeting.organizer.email})</span>
                </div>
                ${meeting.agenda ? `
                <div class="detail-row">
                    <span class="detail-label">📋 Agenda:</span>
                </div>
                <div class="agenda">${meeting.agenda}</div>
                ` : ''}
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <p><strong>Please respond to this invitation:</strong></p>
            <a href="${acceptUrl}" class="btn btn-success">✅ Accept</a>
            <a href="${declineUrl}" class="btn btn-danger">❌ Decline</a>
            <a href="${maybeUrl}" class="btn btn-warning">❓ Maybe</a>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <a href="${meetingUrl}" class="btn">View Meeting Details</a>
        </div>
    `

    const subject = `Meeting Invitation: ${meeting.title} - ${formatDate(meeting.date)}`

    return {
      subject,
      html: this.getBaseTemplate(content),
      text: `
Meeting Invitation: ${meeting.title}

You have been invited to a meeting:

Title: ${meeting.title}
Date: ${formatDate(meeting.date)}
Time: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
Location: ${meeting.location || 'TBD'}
Organizer: ${meeting.organizer.name} (${meeting.organizer.email})
${meeting.agenda ? `Agenda: ${meeting.agenda}` : ''}

Please respond:
Accept: ${acceptUrl}
Decline: ${declineUrl}
Maybe: ${maybeUrl}

View Details: ${meetingUrl}
      `
    }
  }

  static meetingReminder(meeting: Meeting, recipientEmail: string, minutesBefore: number): EmailTemplate {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const meetingUrl = `${appUrl}/meetings/${meeting._id}`

    const content = `
        <h2>⏰ Meeting Reminder</h2>
        <p>This is a friendly reminder about your upcoming meeting in ${minutesBefore} minutes:</p>
        
        <div class="meeting-card">
            <div class="meeting-title">${meeting.title}</div>
            <div class="meeting-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${formatDate(meeting.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${meeting.location || 'TBD'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Organizer:</span>
                    <span class="detail-value">${meeting.organizer.name}</span>
                </div>
                ${meeting.agenda ? `
                <div class="detail-row">
                    <span class="detail-label">📋 Agenda:</span>
                </div>
                <div class="agenda">${meeting.agenda}</div>
                ` : ''}
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            ${meeting.location?.startsWith('http') ? `
                <a href="${meeting.location}" class="btn">🎥 Join Meeting</a>
            ` : ''}
            <a href="${meetingUrl}" class="btn">📋 View Details</a>
        </div>

        <p style="text-align: center; color: #6b7280;">
            Don't forget to prepare any materials you might need for this meeting.
        </p>
    `

    const subject = `Reminder: ${meeting.title} starts in ${minutesBefore} minutes`

    return {
      subject,
      html: this.getBaseTemplate(content),
      text: `
Meeting Reminder: ${meeting.title}

Your meeting starts in ${minutesBefore} minutes:

Title: ${meeting.title}
Date: ${formatDate(meeting.date)}
Time: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
Location: ${meeting.location || 'TBD'}
Organizer: ${meeting.organizer.name}
${meeting.agenda ? `Agenda: ${meeting.agenda}` : ''}

${meeting.location?.startsWith('http') ? `Join Meeting: ${meeting.location}` : ''}
View Details: ${meetingUrl}
      `
    }
  }

  static meetingUpdate(meeting: Meeting, recipientEmail: string, changes: string[]): EmailTemplate {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const meetingUrl = `${appUrl}/meetings/${meeting._id}`

    const content = `
        <h2>📝 Meeting Updated</h2>
        <p>The following meeting has been updated:</p>
        
        <div class="meeting-card">
            <div class="meeting-title">${meeting.title}</div>
            <div class="meeting-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${formatDate(meeting.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${meeting.location || 'TBD'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Organizer:</span>
                    <span class="detail-value">${meeting.organizer.name}</span>
                </div>
            </div>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Changes Made:</h3>
            <ul style="color: #92400e; margin: 0;">
                ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingUrl}" class="btn">📋 View Updated Details</a>
        </div>
    `

    const subject = `Meeting Updated: ${meeting.title}`

    return {
      subject,
      html: this.getBaseTemplate(content),
      text: `
Meeting Updated: ${meeting.title}

The following meeting has been updated:

Title: ${meeting.title}
Date: ${formatDate(meeting.date)}
Time: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
Location: ${meeting.location || 'TBD'}
Organizer: ${meeting.organizer.name}

Changes Made:
${changes.map(change => `- ${change}`).join('\n')}

View Details: ${meetingUrl}
      `
    }
  }

  static meetingCancellation(meeting: Meeting, recipientEmail: string): EmailTemplate {
    const content = `
        <h2>❌ Meeting Cancelled</h2>
        <p>The following meeting has been cancelled:</p>
        
        <div class="meeting-card" style="border-left-color: #dc2626; background: #fef2f2;">
            <div class="meeting-title" style="color: #dc2626;">${meeting.title}</div>
            <div class="meeting-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${formatDate(meeting.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👤 Organizer:</span>
                    <span class="detail-value">${meeting.organizer.name}</span>
                </div>
            </div>
        </div>

        <p style="text-align: center; color: #6b7280;">
            Please update your calendar accordingly. If you have any questions, contact the organizer.
        </p>
    `

    const subject = `Meeting Cancelled: ${meeting.title}`

    return {
      subject,
      html: this.getBaseTemplate(content),
      text: `
Meeting Cancelled: ${meeting.title}

The following meeting has been cancelled:

Title: ${meeting.title}
Date: ${formatDate(meeting.date)}
Time: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
Organizer: ${meeting.organizer.name}

Please update your calendar accordingly.
      `
    }
  }

  static rsvpConfirmation(meeting: Meeting, recipientEmail: string, status: string): EmailTemplate {
    const statusEmoji = {
      accepted: '✅',
      declined: '❌',
      maybe: '❓'
    }[status] || '📝'

    const statusText = {
      accepted: 'accepted',
      declined: 'declined',
      maybe: 'marked as maybe'
    }[status] || 'updated'

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const meetingUrl = `${appUrl}/meetings/${meeting._id}`

    const content = `
        <h2>${statusEmoji} RSVP Confirmation</h2>
        <p>Thank you! You have ${statusText} the invitation for:</p>
        
        <div class="meeting-card">
            <div class="meeting-title">${meeting.title}</div>
            <div class="meeting-details">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${formatDate(meeting.date)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 Location:</span>
                    <span class="detail-value">${meeting.location || 'TBD'}</span>
                </div>
            </div>
        </div>

        ${status === 'accepted' ? `
        <div style="background: #dcfce7; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="color: #166534; margin: 0; text-align: center;">
                <strong>Great! We look forward to seeing you at the meeting.</strong>
            </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${meetingUrl}" class="btn">📋 View Meeting Details</a>
        </div>
    `

    const subject = `RSVP Confirmed: ${meeting.title}`

    return {
      subject,
      html: this.getBaseTemplate(content),
      text: `
RSVP Confirmed: ${meeting.title}

Thank you! You have ${statusText} the invitation for:

Title: ${meeting.title}
Date: ${formatDate(meeting.date)}
Time: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
Location: ${meeting.location || 'TBD'}

View Details: ${meetingUrl}
      `
    }
  }
}
