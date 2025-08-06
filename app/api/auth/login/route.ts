import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getCollection } from '@/lib/mongodb'
import { sanitizeUser } from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    const users = await getCollection('users')

    // Find user
    const user = await users.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          updatedAt: new Date(),
          lastLoginAt: new Date()
        }
      }
    )

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    const sanitizedUser = sanitizeUser(user)

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: sanitizedUser
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
