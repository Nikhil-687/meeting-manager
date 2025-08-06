'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, Plus, MapPin, Video, LogOut, Bell, TrendingUp } from 'lucide-react'
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
  organizer: {
    name: string
    email: string
  }
  isOrganizer: boolean
}

interface Stats {
  totalMeetings: number
  upcomingMeetings: number
  todayMeetings: number
  acceptanceRate: number
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [stats, setStats] = useState<Stats>({
    totalMeetings: 0,
    upcomingMeetings: 0,
    todayMeetings: 0,
    acceptanceRate: 0
  })
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [meetingsRes, statsRes, userRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/meetings/stats'),
        fetch('/api/auth/me')
      ])

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json()
        setMeetings(meetingsData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/auth/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted': return 'badge-success'
      case 'declined': return 'badge-danger'
      case 'maybe': return 'badge-warning'
      default: return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <Calendar className="loading-icon" />
          <p className="text-gray-600">Loading your meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <Calendar className="header-icon" />
            <h1 className="header-title">Meeting Scheduler</h1>
          </div>
          <div className="header-nav">
            <button className="btn btn-ghost btn-sm">
              <Bell style={{ width: '1rem', height: '1rem' }} />
            </button>
            <div className="flex items-center space-x-2">
              <div className="avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              <LogOut style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <Calendar className="stat-icon" style={{ color: '#2563eb' }} />
            <div className="stat-content">
              <h3>Total Meetings</h3>
              <p>{stats.totalMeetings}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <Clock className="stat-icon" style={{ color: '#16a34a' }} />
            <div className="stat-content">
              <h3>Upcoming</h3>
              <p>{stats.upcomingMeetings}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <Users className="stat-icon" style={{ color: '#7c3aed' }} />
            <div className="stat-content">
              <h3>Today</h3>
              <p>{stats.todayMeetings}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <TrendingUp className="stat-icon" style={{ color: '#ea580c' }} />
            <div className="stat-content">
              <h3>Acceptance Rate</h3>
              <p>{stats.acceptanceRate}%</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/meetings/create" className="btn btn-primary">
            <Plus className="btn-icon" />
            Schedule Meeting
          </Link>
          <Link href="/calendar" className="btn btn-outline">
            <Calendar className="btn-icon" />
            Calendar View
          </Link>
        </div>

        {/* Upcoming Meetings */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Meetings</h2>
            <p className="card-description">Your scheduled meetings for the next few days</p>
          </div>
          <div className="card-content">
            {meetings.length === 0 ? (
              <div className="empty-state">
                <Calendar className="empty-state-icon" />
                <p className="text-gray-500 mb-4">No upcoming meetings</p>
                <Link href="/meetings/create" className="btn btn-primary">
                  <Plus className="btn-icon" />
                  Schedule your first meeting
                </Link>
              </div>
            ) : (
              <div>
                {meetings.map((meeting) => (
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
                            {formatDate(meeting.date)}
                          </div>
                          <div className="meeting-meta-item">
                            <Clock />
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </div>
                          <div className="meeting-meta-item">
                            {meeting.location.startsWith('http') ? (
                              <Video />
                            ) : (
                              <MapPin />
                            )}
                            {meeting.location}
                          </div>
                          <div className="meeting-meta-item">
                            <Users />
                            {meeting.participants.length} participants
                          </div>
                        </div>
                      </div>
                      <div className="meeting-actions">
                        {!meeting.isOrganizer && (
                          <div className="flex space-x-1">
                            {['accepted', 'declined', 'maybe'].map((status) => (
                              <button
                                key={status}
                                className={`btn btn-sm ${
                                  meeting.participants.find(p => p.email === user?.email)?.status === status 
                                    ? 'btn-primary' 
                                    : 'btn-outline'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                        <Link href={`/meetings/${meeting._id}`} className="btn btn-outline btn-sm">
                          View
                        </Link>
                      </div>
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
