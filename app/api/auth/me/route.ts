import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { sanitizeUser } from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const users = await getCollection('users')
    
    const user = await users.findOne({ 
      _id: new ObjectId(decoded.userId),
      isActive: true 
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    const sanitizedUser = sanitizeUser(user)
    return NextResponse.json(sanitizedUser)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}
