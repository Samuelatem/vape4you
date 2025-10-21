import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session in users API:', session)
    
    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized - no session' }, { status: 401 })
    }
    
    if (!session.user?.id || !session.user?.role) {
      console.error('Invalid session:', session)
      return NextResponse.json({ 
        error: 'Unauthorized - invalid session',
        session: session
      }, { status: 401 })
    }
    
    // Validate session user data
    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      console.error('Invalid user ID in session:', session.user.id)
      return NextResponse.json({ error: 'Invalid user ID format in session' }, { status: 400 })
    }

    console.log('Connecting to MongoDB...')
    await connectDB()
    console.log('MongoDB connected successfully')

    // Convert string ID to ObjectId if needed
    const userId = session.user.id.toString()
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid user ID format:', userId)
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    console.log('Fetching current user:', session.user.id)
    const currentUser = await User.findById(session.user.id).lean()
    
    if (!currentUser) {
      console.error('User not found:', session.user.id)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Current user role:', currentUser.role)

    // Get users of the opposite role
    const users = await User.find({
      _id: { $ne: currentUser._id },
      role: currentUser.role === 'vendor' ? 'client' : 'vendor'
    }).select('_id name email role')

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      email: user.email,
      online: true // You can implement real online status with Socket.io
    }))
    
    return NextResponse.json({
      success: true,
      users: formattedUsers
    })
  } catch (error) {
    console.error('Error fetching available users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available users' },
      { status: 500 }
    )
  }
}