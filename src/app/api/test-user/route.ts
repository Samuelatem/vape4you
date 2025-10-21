import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating test user...')
    
    await connectDB()
    console.log('Database connected')

    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@test.com' })
    console.log('Cleaned up existing test user')

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const testUser = await User.create({
      email: 'test@test.com',
      password: hashedPassword,
      name: 'Test User',
      role: 'client'
    })

    console.log('Test user created:', testUser._id)

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      userId: testUser._id
    })

  } catch (error) {
    console.error('Error creating test user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create test user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await connectDB()
    
    const userCount = await User.countDocuments()
    const users = await User.find({}).select('email name role createdAt').limit(5)
    
    return NextResponse.json({
      success: true,
      userCount,
      sampleUsers: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}