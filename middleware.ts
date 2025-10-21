import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle Socket.IO polling requests
  if (request.url.includes('/api/socketio')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', '*')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}