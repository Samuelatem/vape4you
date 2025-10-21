import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`
}

const handler = NextAuth(authOptions)

export const GET = handler
export const POST = handler