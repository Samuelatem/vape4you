import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new SocketIOServer(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
  })

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`)

    // Join user to their role-specific room and personal room
    socket.on('join-user', ({ userId, role, name }) => {
      ;(socket as any).userId = userId
      ;(socket as any).userRole = role
      ;(socket as any).userName = name
      
      socket.join(`user-${userId}`)
      socket.join(role) // 'vendor' or 'client' room
      
      console.log(`👤 User ${name} (${role}) joined with ID: ${userId}`)
      
      // Notify others about online status
      socket.broadcast.emit('user-online', { userId, name, role })
    })

    // Handle sending messages
    socket.on('send-message', (messageData) => {
      const { chatId, senderId, senderName, senderRole, message, recipientId } = messageData
      
      const fullMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        senderId,
        senderName,
        senderRole,
        message,
        timestamp: new Date(),
        recipientId
      }

      console.log(`💬 Message from ${senderName} to ${recipientId}: ${message}`)
      
      // Send to specific recipient
      socket.to(`user-${recipientId}`).emit('receive-message', fullMessage)
      
      // Send back to sender for confirmation
      socket.emit('message-sent', fullMessage)
    })

    // Handle typing indicators
    socket.on('typing-start', ({ chatId, userName, recipientId }) => {
      socket.to(`user-${recipientId}`).emit('user-typing', { chatId, userName })
    })

    socket.on('typing-stop', ({ chatId, recipientId }) => {
      socket.to(`user-${recipientId}`).emit('user-stop-typing', { chatId })
    })

    // Get online users
    socket.on('get-online-users', (callback) => {
      const sockets = Array.from(io.sockets.sockets.values())
      const onlineUsers = sockets
        .filter((s: any) => s.userId && s.userName && s.userRole)
        .map((s: any) => ({
          id: s.userId,
          name: s.userName,
          role: s.userRole,
          online: true
        }))
      
      callback(onlineUsers)
    })

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`)
      
      const userId = (socket as any).userId
      const userName = (socket as any).userName
      const userRole = (socket as any).userRole
      
      if (userId) {
        // Notify others about offline status
        socket.broadcast.emit('user-offline', { 
          userId, 
          name: userName, 
          role: userRole 
        })
      }
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`🚀 Server ready at http://${hostname}:${port}`)
      console.log('✅ Socket.IO server ready at /api/socketio')
    })
})