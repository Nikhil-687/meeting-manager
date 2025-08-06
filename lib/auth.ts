import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'

export interface AuthUser {
  _id: string
  name: string
  email: string
  isActive: boolean
}

export async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const users = await getCollection('users')
    
    const user = await users.findOne({ 
      _id: new ObjectId(decoded.userId),
      isActive: true 
    })

    if (!user) return null

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isActive: user.isActive
    }
  } catch {
    return null
  }
}
