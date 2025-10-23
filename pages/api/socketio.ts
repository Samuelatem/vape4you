import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import type { NextApiResponse } from 'next'

// Extend NextApiResponse to include the Socket.IO server instance
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: {
      io?: any
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.IO')
    
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'https://vape4you-com.onrender.com',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    // Handle user connections
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('join-user', ({ userId, role, name }) => {
        socket.join(`user:${userId}`)
        console.log(`${role} ${name} joined their room`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }

  res.end()
}

export default ioHandler