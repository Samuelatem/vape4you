import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { ChatSession, Message } from '@/models/Chat'
import { User } from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const chatId = new mongoose.Types.ObjectId(params.sessionId)
    const userId = new mongoose.Types.ObjectId(session.user.id)

    // Verify the user is part of this chat
    const chatSession = await ChatSession.findOne({
      _id: chatId,
      $or: [
        { 'participants.vendorId': userId },
        { 'participants.clientId': userId }
      ]
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Get messages with user details
    const messages = await Message.aggregate([
      {
        $match: { chatId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipientId',
          foreignField: '_id',
          as: 'recipient'
        }
      },
      {
        $addFields: {
          sender: { $arrayElemAt: ['$sender', 0] },
          recipient: { $arrayElemAt: ['$recipient', 0] }
        }
      },
      {
        $project: {
          id: '$_id',
          chatId: 1,
          message: 1,
          timestamp: 1,
          read: 1,
          senderId: '$sender._id',
          senderName: '$sender.name',
          senderRole: '$sender.role',
          recipientId: '$recipient._id',
          recipientName: '$recipient.name'
        }
      },
      {
        $sort: { timestamp: 1 }
      }
    ])

    // Mark messages as read
    await Message.updateMany(
      {
        chatId,
        recipientId: userId,
        read: false
      },
      { $set: { read: true } }
    )

    // Update unread count
    const field = session.user.role === 'vendor' ? 'unreadCount.vendor' : 'unreadCount.client'
    await ChatSession.updateOne(
      { _id: chatId },
      { $set: { [field]: 0 } }
    )

    return NextResponse.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, recipientId } = await request.json()
    
    if (!message?.trim() || !recipientId) {
      return NextResponse.json(
        { error: 'Message and recipient ID are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const chatId = new mongoose.Types.ObjectId(params.sessionId)
    const senderId = new mongoose.Types.ObjectId(session.user.id)
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId)

    // Verify the chat session exists and both users are part of it
    const chatSession = await ChatSession.findOne({
      _id: chatId,
      $or: [
        {
          'participants.vendorId': senderId,
          'participants.clientId': recipientObjectId
        },
        {
          'participants.vendorId': recipientObjectId,
          'participants.clientId': senderId
        }
      ]
    })

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Invalid chat session' },
        { status: 404 }
      )
    }

    // Create the message
    const newMessage = await Message.create({
      chatId,
      senderId,
      recipientId: recipientObjectId,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    })

    // Update chat session
    const recipientRole = session.user.role === 'vendor' ? 'client' : 'vendor'
    await ChatSession.updateOne(
      { _id: chatId },
      {
        $set: {
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          [`unreadCount.${recipientRole}`]: chatSession.unreadCount[recipientRole] + 1
        }
      }
    )

    // Get populated message
    const populatedMessage = await Message.aggregate([
      {
        $match: { _id: newMessage._id }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipientId',
          foreignField: '_id',
          as: 'recipient'
        }
      },
      {
        $addFields: {
          sender: { $arrayElemAt: ['$sender', 0] },
          recipient: { $arrayElemAt: ['$recipient', 0] }
        }
      },
      {
        $project: {
          id: '$_id',
          chatId: 1,
          message: 1,
          timestamp: 1,
          read: 1,
          senderId: '$sender._id',
          senderName: '$sender.name',
          senderRole: '$sender.role',
          recipientId: '$recipient._id',
          recipientName: '$recipient.name'
        }
      }
    ]).then(messages => messages[0])

    return NextResponse.json({
      success: true,
      message: populatedMessage
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}