import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getCollection } from '@/lib/mongodb'
import { User, sanitizeUser } from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const users = await getCollection('users')

    // Check if user already exists
    const existingUser = await users.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser: User = {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      preferences: {
        emailNotifications: true,
        reminderTime: 15, // 15 minutes before meeting
        defaultMeetingDuration: 60 // 1 hour
      }
    }

    const result = await users.insertOne(newUser)
    const createdUser = await users.findOne({ _id: result.insertedId })

    if (!createdUser) {
      return NextResponse.json(
        { message: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: createdUser._id.toString(), 
        email: createdUser.email 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    const sanitizedUser = sanitizeUser(createdUser)

    return NextResponse.json({
      message: 'User created successfully',
      token,
      user: sanitizedUser
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
