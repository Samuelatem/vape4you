import { NextRequest, NextResponse } from 'next/server'
import { localDB } from '@/lib/local-db'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called (Local DB)')
    
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { email, password, name, role } = body

    // Basic validation
    if (!email || !password || !name || !role) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['vendor', 'client'].includes(role)) {
      console.log('Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    console.log('Creating user with local database...')
    const user = await localDB.createUser({ email, password, name, role })
    console.log('User created:', user.id)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user,
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const userCount = await localDB.getUserCount()
    await localDB.seedDemoUsers()
    
    return NextResponse.json({
      success: true,
      message: 'Using local database',
      userCount,
      demoUsers: [
        { email: 'vendor@vape4you.com', password: 'password123', role: 'vendor' },
        { email: 'client@vape4you.com', password: 'password123', role: 'client' }
      ]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize local database' },
      { status: 500 }
    )
  }
}