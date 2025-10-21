import mongoose from 'mongoose'

const chatSessionSchema = new mongoose.Schema({
  participants: {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  lastMessage: { type: String },
  lastMessageTime: { type: Date },
  unreadCount: {
    vendor: { type: Number, default: 0 },
    client: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
})

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
})

// Create indexes for better query performance
chatSessionSchema.index({ 'participants.vendorId': 1, 'participants.clientId': 1 }, { background: true })
messageSchema.index({ chatId: 1, timestamp: -1 }, { background: true })

// Add error handling for indexes
chatSessionSchema.on('index', function(error) {
  if (error) {
    console.error('ChatSession index error:', error)
  }
})

messageSchema.on('index', function(error) {
  if (error) {
    console.error('Message index error:', error)
  }
})

export const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema)
export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema)

// TypeScript interfaces
export interface IChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string  
  senderRole: 'vendor' | 'client'
  recipientId: string
  recipientName: string
  message: string
  timestamp: string
  read: boolean
}

export interface IChatSession {
  id: string
  participants: {
    vendorId: string
    vendorName: string
    clientId: string
    clientName: string
  }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: {
    vendor: number
    client: number
  }
  createdAt: string
}