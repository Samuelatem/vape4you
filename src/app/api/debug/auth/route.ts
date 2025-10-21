import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Debug - Session data:', JSON.stringify(session, null, 2))

    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'No session or email',
        session: session
      })
    }

    // Try to find user in local database
    const user = await localDB.findUserByEmail(session.user.email)
    console.log('Debug - User from local DB:', JSON.stringify(user, null, 2))

    return NextResponse.json({
      session,
      user,
      message: 'Debug info'
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    )
  }
}