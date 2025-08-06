import { ObjectId, WithId, Document } from 'mongodb'

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  avatar?: string
  timezone?: string
  lastLoginAt?: Date
  preferences?: {
    emailNotifications: boolean
    reminderTime: number // minutes before meeting
    defaultMeetingDuration: number // minutes
  }
}

export interface UserResponse {
  _id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  avatar?: string
  timezone?: string
  lastLoginAt?: Date
  preferences?: {
    emailNotifications: boolean
    reminderTime: number
    defaultMeetingDuration: number
  }
}

// Type guard to check if a document is a valid User
export function isValidUser(doc: WithId<Document>): doc is WithId<Document> & User {
  return (
    typeof doc.name === 'string' &&
    typeof doc.email === 'string' &&
    typeof doc.password === 'string' &&
    doc.createdAt instanceof Date &&
    doc.updatedAt instanceof Date &&
    typeof doc.isActive === 'boolean'
  )
}

// Updated sanitizeUser function to handle MongoDB documents
export function sanitizeUser(user: User | WithId<Document>): UserResponse {
  // Type assertion for MongoDB document
  const userDoc = user as User & { _id: ObjectId }
  
  const { password, ...sanitized } = userDoc
  return {
    ...sanitized,
    _id: userDoc._id?.toString() || ''
  }
}

// Alternative: Create a typed version for MongoDB documents
export function sanitizeUserFromDoc(doc: WithId<Document>): UserResponse | null {
  if (!isValidUser(doc)) {
    return null
  }
  
  const { password, ...sanitized } = doc
  return {
    ...sanitized,
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    isActive: doc.isActive,
    avatar: doc.avatar,
    timezone: doc.timezone,
    lastLoginAt: doc.lastLoginAt,
    preferences: doc.preferences,
    _id: doc._id.toString()
  }
}