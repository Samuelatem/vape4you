import { Server as SocketServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponse } from 'next'

const activeSessions: Map<string, { userId: string; role: string; socket: any }> = new Map()

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO...')
    const io = new SocketServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    // Socket.IO event handlers
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      // Handle user joining
      socket.on('join-user', ({ userId, role, name }) => {
        console.log(`User joined: ${name} (${role})`)
        
        // Store user session
        activeSessions.set(socket.id, { userId, role, socket })
        
        // Join role-specific room
        socket.join(role) // 'vendor' or 'client' room
        socket.join(`user:${userId}`)

        // Notify others of user's online status
        socket.broadcast.emit('user-online', { userId, name, role })

        // Send current online users to the new user
        const onlineUsers = Array.from(activeSessions.values())
          .map(({ userId, role }) => ({ userId, role }))
        socket.emit('online-users', onlineUsers)
      })

      // Handle chat messages
      socket.on('send-message', async (data) => {
        const { senderId, recipientId, message, senderRole } = data
        console.log(`Message from ${senderId} to ${recipientId}: ${message}`)

        // Find recipient's socket
        const recipientSocket = Array.from(activeSessions.entries())
          .find(([_, session]) => session.userId === recipientId)?.[1]?.socket

        if (recipientSocket) {
          // Send to recipient
          io.to(`user:${recipientId}`).emit('receive-message', {
            ...data,
            timestamp: new Date(),
          })

          // Send delivery confirmation to sender
          socket.emit('message-delivered', {
            messageId: data.messageId,
            timestamp: new Date(),
          })
        } else {
          // Store message for offline delivery
          socket.emit('message-pending', {
            messageId: data.messageId,
            timestamp: new Date(),
          })
        }
      })

      // Handle typing indicators
      socket.on('typing', ({ userId, recipientId }) => {
        io.to(`user:${recipientId}`).emit('user-typing', { userId })
      })

      socket.on('stop-typing', ({ userId, recipientId }) => {
        io.to(`user:${recipientId}`).emit('user-stop-typing', { userId })
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        const session = activeSessions.get(socket.id)
        if (session) {
          console.log(`User disconnected: ${session.userId} (${session.role})`)
          socket.broadcast.emit('user-offline', {
            userId: session.userId,
            role: session.role,
          })
          activeSessions.delete(socket.id)
        }
      })
    })

    res.socket.server.io = io
  }
  res.end()
}