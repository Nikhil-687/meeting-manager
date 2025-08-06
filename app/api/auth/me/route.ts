import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Mock database
const users: Array<{
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
}> = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
    createdAt: new Date()
  }
]

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
    const user = users.find(u => u.id === decoded.userId)

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    )
  }
}
