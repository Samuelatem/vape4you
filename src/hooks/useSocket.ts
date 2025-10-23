import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketOptions {
  userId?: string
  userName?: string
  userRole?: 'vendor' | 'client'
}

export const useSocket = ({ userId, userName, userRole }: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId || !userName || !userRole) return

    // Force WebSocket transport and use the current domain
        const socket = io('https://vape4you-com.onrender.com', {
      path: '/api/socketio',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      addTrailingSlash: false,
    })

    socketRef.current = socket

    // Join user room when connected
    socket.on('connect', () => {
      console.log('🔗 Connected to chat server')
      socket.emit('join-user', { userId, role: userRole, name: userName })
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    socket.on('error', (error) => {
      console.error('Socket general error:', error)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, userName, userRole])

  return socketRef.current
}