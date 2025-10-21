import { NextRequest } from 'next/server'
import { type NextApiResponse } from 'next'
import { initSocketServer } from '@/lib/socket'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, res: NextApiResponse) {
  try {
    initSocketServer(res as any)
    return new Response('Socket.IO server running')
  } catch (error) {
    console.error('Socket.IO initialization error:', error)
    return new Response('Socket.IO server error', { status: 500 })
  }
}