import { Server as NetServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { NextApiResponse } from 'next'

interface CustomSocket extends Socket {
  userId?: string
  userRole?: string
  userName?: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

export const initSocketServer = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('🔄 Initializing Socket.IO server...')
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'],
    })

    const connectedUsers = new Map()

    io.on('connection', (socket: CustomSocket) => {
      console.log('✅ Client connected:', socket.id)

      socket.on('join-user', ({ userId, role, name }) => {
        console.log(`👤 User joined: ${name} (${role})`)
        socket.userId = userId
        socket.userRole = role
        socket.userName = name
        
        socket.join(`user-${userId}`)
        socket.join(role)
        
        connectedUsers.set(userId, {
          socketId: socket.id,
          role,
          name,
          online: true
        })
        
        io.emit('user-online', {
          userId,
          role,
          name,
          online: true
        })
      })

      socket.on('send-message', async ({ chatId, message, recipientId, senderId }) => {
        console.log(`💬 New message in chat ${chatId}`)
        
        const fullMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatId,
          senderId,
          message,
          timestamp: new Date().toISOString(),
          recipientId
        }
        
        io.to(`user-${recipientId}`).emit('receive-message', fullMessage)
        socket.emit('message-sent', fullMessage)
      })

      socket.on('typing', ({ chatId, userId, name }) => {
        socket.broadcast.to(chatId).emit('user-typing', {
          chatId,
          name
        })
      })

      socket.on('stop-typing', ({ chatId }) => {
        socket.broadcast.to(chatId).emit('user-stop-typing', {
          chatId
        })
      })

      socket.on('mark-read', ({ chatId, messageId, userId }) => {
        io.to(chatId).emit('message-read', {
          chatId,
          messageId,
          userId
        })
      })

      socket.on('get-online-users', (callback) => {
        const onlineUsers = Array.from(connectedUsers.entries())
          .map(([id, user]) => ({
            id,
            name: user.name,
            role: user.role,
            online: true
          }))
        callback(onlineUsers)
      })

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
        for (const [userId, user] of connectedUsers.entries()) {
          if (user.socketId === socket.id) {
            connectedUsers.delete(userId)
            io.emit('user-offline', { 
              userId,
              name: user.name,
              role: user.role,
              online: false
            })
            break
          }
        }
      })
    })

    res.socket.server.io = io
  }
  
  return res.socket.server.io
}