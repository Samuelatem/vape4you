export interface User {
  id: string
  email: string
  name: string
  role: 'vendor' | 'client'
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  stock: number
  vendorId: string
  vendor: User
  rating: {
    average: number
    count: number
  }
  specifications?: {
    [key: string]: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  user: User
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'bitcoin' | 'paypal' | 'cashapp' | 'revolut' | 'other'
  paymentStatus: 'pending' | 'completed' | 'failed'
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  price: number
}

export interface ChatRoom {
  id: string
  vendorId: string
  clientId: string
  vendor: User
  client: User
  lastMessage?: Message
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  sender: User
  content: string
  type: 'text' | 'image' | 'file'
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'order' | 'chat' | 'system'
  read: boolean
  data?: any
  createdAt: Date
  updatedAt: Date
}

export interface PaymentMethod {
  id: string
  name: string
  type: 'bitcoin' | 'paypal' | 'cashapp' | 'revolut' | 'other'
  details: {
    address?: string
    email?: string
    username?: string
    qrCode?: string
  }
  instructions: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}