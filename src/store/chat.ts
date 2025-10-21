import { create } from 'zustand'
import { ChatRoom, Message } from '@/types'

interface ChatStore {
  rooms: ChatRoom[]
  activeRoom: ChatRoom | null
  messages: Record<string, Message[]>
  unreadCount: number
  
  setRooms: (rooms: ChatRoom[]) => void
  addRoom: (room: ChatRoom) => void
  setActiveRoom: (room: ChatRoom | null) => void
  addMessage: (message: Message) => void
  markAsRead: (roomId: string) => void
  updateUnreadCount: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},
  unreadCount: 0,
  
  setRooms: (rooms: ChatRoom[]) => {
    set({ rooms })
    get().updateUnreadCount()
  },
  
  addRoom: (room: ChatRoom) => {
    set((state) => ({
      rooms: [...state.rooms, room]
    }))
  },
  
  setActiveRoom: (room: ChatRoom | null) => {
    set({ activeRoom: room })
    if (room) {
      get().markAsRead(room.id)
    }
  },
  
  addMessage: (message: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [message.roomId]: [
          ...(state.messages[message.roomId] || []),
          message
        ]
      }
    }))
    
    // Update room's last message and unread count
    set((state) => ({
      rooms: state.rooms.map(room => 
        room.id === message.roomId
          ? { 
              ...room, 
              lastMessage: message,
              unreadCount: room.unreadCount + 1
            }
          : room
      )
    }))
    
    get().updateUnreadCount()
  },
  
  markAsRead: (roomId: string) => {
    set((state) => ({
      rooms: state.rooms.map(room =>
        room.id === roomId
          ? { ...room, unreadCount: 0 }
          : room
      )
    }))
    get().updateUnreadCount()
  },
  
  updateUnreadCount: () => {
    const totalUnread = get().rooms.reduce((total, room) => total + room.unreadCount, 0)
    set({ unreadCount: totalUnread })
  }
}))