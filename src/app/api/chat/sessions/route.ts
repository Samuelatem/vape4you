import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ChatSession } from '@/models/Chat'
import { User } from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session in chat API:', session)
    
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

    console.log('Connecting to MongoDB...')
    try {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ])
      console.log('MongoDB connected successfully')
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
      return NextResponse.json(
        { error: 'Database connection failed', details: errorMessage },
        { status: 503 }
      )
    }

    // Convert string ID to ObjectId
    const userIdStr = session.user.id.toString()
    if (!mongoose.Types.ObjectId.isValid(userIdStr)) {
      console.error('Invalid user ID format:', userIdStr)
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    console.log('Session user details:', {
      id: userIdStr,
      role: session.user.role,
      email: session.user.email
    })

    const userId = new mongoose.Types.ObjectId(userIdStr)
    console.log('Fetching chat sessions for user:', userId.toString())
    
    // Find all chat sessions where the current user is either vendor or client
    // Ensure the ChatSession model is initialized
    if (!mongoose.models.ChatSession) {
      console.error('ChatSession model not initialized')
      return NextResponse.json(
        { error: 'Internal server error - Chat model not initialized' },
        { status: 500 }
      )
    }

    const chatSessions = await ChatSession.aggregate([
      {
        $match: {
          $or: [
            { 'participants.vendorId': userId },
            { 'participants.clientId': userId }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $addFields: {
          vendor: { $arrayElemAt: ['$vendor', 0] },
          client: { $arrayElemAt: ['$client', 0] }
        }
      },
      {
        $project: {
          id: '$_id',
          participants: {
            vendorId: '$vendor._id',
            vendorName: '$vendor.name',
            clientId: '$client._id',
            clientName: '$client.name'
          },
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          createdAt: 1
        }
      }
    ])

    if (!Array.isArray(chatSessions)) {
      console.error('Invalid response from aggregation:', chatSessions)
      return NextResponse.json(
        { error: 'Invalid response from database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: chatSessions || []
    })
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { message: 'Unknown error' }
    
    console.error('Error details:', errorDetails)
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat sessions',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipientId } = await request.json()
    
    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get both users
    const currentUser = await User.findById(session.user.id)
    const recipient = await User.findById(recipientId)
    
    if (!currentUser || !recipient) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (currentUser.role === recipient.role) {
      return NextResponse.json(
        { error: 'Cannot create chat with same role' },
        { status: 400 }
      )
    }

    // Check if a chat session already exists
    const existingSession = await ChatSession.findOne({
      $or: [
        {
          'participants.vendorId': currentUser.role === 'vendor' ? currentUser._id : recipient._id,
          'participants.clientId': currentUser.role === 'client' ? currentUser._id : recipient._id
        },
        {
          'participants.vendorId': currentUser.role === 'client' ? recipient._id : currentUser._id,
          'participants.clientId': currentUser.role === 'vendor' ? recipient._id : currentUser._id
        }
      ]
    })

    if (existingSession) {
      return NextResponse.json(
        { error: 'Chat session already exists' },
        { status: 400 }
      )
    }

    // Create new chat session
    const chatSession = await ChatSession.create({
      participants: {
        vendorId: currentUser.role === 'vendor' ? currentUser._id : recipient._id,
        clientId: currentUser.role === 'client' ? currentUser._id : recipient._id
      },
      unreadCount: {
        vendor: 0,
        client: 0
      }
    })

    // Populate the session with user details
    const populatedSession = await ChatSession.aggregate([
      {
        $match: { _id: chatSession._id }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participants.clientId',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $addFields: {
          vendor: { $arrayElemAt: ['$vendor', 0] },
          client: { $arrayElemAt: ['$client', 0] }
        }
      },
      {
        $project: {
          id: '$_id',
          participants: {
            vendorId: '$vendor._id',
            vendorName: '$vendor.name',
            clientId: '$client._id',
            clientName: '$client.name'
          },
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          createdAt: 1
        }
      }
    ]).then(sessions => sessions[0])
    
    return NextResponse.json({
      success: true,
      session: populatedSession
    })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}