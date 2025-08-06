'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, ArrowLeft, Clock, Users, MapPin } from 'lucide-react'
import Link from 'next/link'

interface Meeting {
  _id: string
  title: string
  agenda: string
  date: string
  startTime: string
  endTime: string
  location: string
  participants: Array<{
    email: string
    name: string
    status: 'invited' | 'accepted' | 'declined' | 'maybe'
  }>
  isOrganizer: boolean
}

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings')
      if (response.ok) {
        const data = await response.json()
        setMeetings(data)
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getMeetingsForDate = (date: Date | null) => {
    if (!date) return []
    const dateString = date.toISOString().split('T')[0]
    return meetings.filter(meeting => meeting.date === dateString)
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Calendar className="loading-icon" />
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
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
            <Calendar className="header-icon" />
            <h1 className="header-title">Calendar View</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-2xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center space-x-2">
                <button className="btn btn-outline btn-sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            {/* Calendar Grid */}
            <div className="calendar-grid">
              {dayNames.map(day => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => {
                const dayMeetings = getMeetingsForDate(day)
                const isToday = day && day.toDateString() === new Date().toDateString()
                
                return (
                  <div
                    key={index}
                    className={`calendar-day ${!day ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="calendar-day-number">
                          {day.getDate()}
                        </div>
                        <div>
                          {dayMeetings.slice(0, 3).map(meeting => (
                            <div
                              key={meeting._id}
                              className="calendar-meeting"
                              title={`${meeting.title} - ${formatTime(meeting.startTime)}`}
                            >
                              <div className="calendar-meeting-title">{meeting.title}</div>
                              <div className="calendar-meeting-time">
                                <Clock />
                                {formatTime(meeting.startTime)}
                              </div>
                            </div>
                          ))}
                          {dayMeetings.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayMeetings.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Meetings List */}
        <div className="card mt-8">
          <div className="card-header">
            <h2 className="card-title">Upcoming Meetings This Month</h2>
          </div>
          <div className="card-content">
            {meetings.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <p className="text-gray-500">No meetings scheduled this month</p>
              </div>
            ) : (
              <div>
                {meetings.map(meeting => (
                  <div key={meeting._id} className="meeting-item">
                    <div className="meeting-header">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="meeting-title">{meeting.title}</h3>
                          {meeting.isOrganizer && (
                            <span className="badge badge-secondary">Organizer</span>
                          )}
                        </div>
                        <p className="meeting-agenda">{meeting.agenda}</p>
                        <div className="meeting-meta">
                          <div className="meeting-meta-item">
                            <Calendar />
                            {new Date(meeting.date).toLocaleDateString()}
                          </div>
                          <div className="meeting-meta-item">
                            <Clock />
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </div>
                          <div className="meeting-meta-item">
                            <MapPin />
                            {meeting.location}
                          </div>
                          <div className="meeting-meta-item">
                            <Users />
                            {meeting.participants.length} participants
                          </div>
                        </div>
                      </div>
                      <Link href={`/meetings/${meeting._id}`} className="btn btn-outline btn-sm">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
