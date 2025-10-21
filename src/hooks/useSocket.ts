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

    // Initialize socket connection
    const socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socketio',
      addTrailingSlash: false,
    })

    socketRef.current = socket

    // Join user room when connected
    socket.on('connect', () => {
      console.log('🔗 Connected to chat server')
      socket.emit('join-user', { userId, role: userRole, name: userName })
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