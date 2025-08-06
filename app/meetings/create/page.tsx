'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Users, MapPin, Plus, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function CreateMeetingPage() {
  const [formData, setFormData] = useState({
    title: '',
    agenda: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    participants: [] as string[]
  })
  const [participantEmail, setParticipantEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
 
      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.message || 'Failed to create meeting')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const addParticipant = () => {
    if (participantEmail && !formData.participants.includes(participantEmail)) {
      setFormData(prev => ({
        ...prev,
        participants: [...prev.participants, participantEmail]
      }))
      setParticipantEmail('')
    }
  }

  const removeParticipant = (email: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== email)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addParticipant()
    }
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
            <h1 className="header-title">Schedule New Meeting</h1>
          </div>
        </div>
      </header>

      <div className="container py-8" style={{ maxWidth: '800px' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Meeting Details</h2>
            <p className="card-description">Fill in the information for your new meeting</p>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="title" className="form-label">Meeting Title *</label>
                <input
                  id="title"
                  name="title"
                  placeholder="Enter meeting title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="agenda" className="form-label">Agenda</label>
                <textarea
                  id="agenda"
                  name="agenda"
                  placeholder="What will you discuss in this meeting?"
                  value={formData.agenda}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date" className="form-label">Date *</label>
                  <div className="form-input-icon">
                    <Calendar className="icon" />
                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="startTime" className="form-label">Start Time *</label>
                  <div className="form-input-icon">
                    <Clock className="icon" />
                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="endTime" className="form-label">End Time *</label>
                  <div className="form-input-icon">
                    <Clock className="icon" />
                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location" className="form-label">Location / Meeting Link</label>
                <div className="form-input-icon">
                  <MapPin className="icon" />
                  <input
                    id="location"
                    name="location"
                    placeholder="Conference room or video call link"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Participants</label>
                <div className="flex space-x-2">
                  <div className="form-input-icon" style={{ flex: 1 }}>
                    <Users className="icon" />
                    <input
                      placeholder="Enter participant email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="form-input"
                    />
                  </div>
                  <button type="button" onClick={addParticipant} className="btn btn-outline">
                    <Plus style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
                
                {formData.participants.length > 0 && (
                  <div className="participant-tags">
                    {formData.participants.map((email) => (
                      <div key={email} className="participant-tag">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeParticipant(email)}
                        >
                          <X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4" style={{ paddingTop: '1rem' }}>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                  {loading ? 'Creating Meeting...' : 'Create Meeting'}
                </button>
                <Link href="/dashboard" className="btn btn-outline">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
