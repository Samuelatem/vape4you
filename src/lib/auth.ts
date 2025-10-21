import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { localDB } from '@/lib/local-db'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'your-development-secret-key'

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          let user: any = null
          let useLocalDB = false

          // Try MongoDB Atlas first
          try {
            await connectDB()
            console.log('MongoDB Atlas connected for auth')
            user = await User.findOne({ email: credentials.email }).lean() as any
            console.log('User found in MongoDB:', user ? 'Yes' : 'No')
          } catch (dbError) {
            console.log('MongoDB Atlas failed, trying local database')
            useLocalDB = true
          }

          // Fallback to local database
          if (useLocalDB || !user) {
            console.log('Using local database for auth')
            const localUser = await localDB.validatePassword(credentials.email, credentials.password)
            
            if (localUser) {
              console.log('Authentication successful with local DB:', localUser.email, 'role:', localUser.role)
              // Create a MongoDB ObjectId for local users
              const objectId = new mongoose.Types.ObjectId();
              return {
                id: objectId.toString(),
                email: localUser.email,
                name: localUser.name,
                role: localUser.role,
              }
            } else {
              console.log('Authentication failed with local DB')
              return null
            }
          }

          // MongoDB authentication
          if (user) {
            const isValidPassword = await bcrypt.compare(
              credentials.password,
              user.password
            )
            console.log('Password valid:', isValidPassword)

            if (!isValidPassword) {
              console.log('Invalid password')
              return null
            }

            console.log('Authentication successful with MongoDB:', user.email, 'role:', user.role)
            
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user)
    },
    async signOut({ token }) {
      console.log('User signed out:', token)
    },
    async createUser({ user }) {
      console.log('User created:', user)
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log('JWT token updated:', {
          role: token.role,
          id: token.id,
          email: token.email
        })
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user = {
          ...session.user,
          id: token.sub || token.id as string,
          role: token.role as string,
          email: token.email as string,
          name: token.name as string
        }
        console.log('Session updated:', {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email
        })
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
}