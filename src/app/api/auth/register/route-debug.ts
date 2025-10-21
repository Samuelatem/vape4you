import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called')
    
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

    console.log('Connecting to database...')
    await connectDB()
    console.log('Database connected successfully')

    // Check if user already exists
    console.log('Checking if user exists...')
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists')
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    console.log('Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('Password hashed successfully')

    // Create user
    console.log('Creating user...')
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
    })
    console.log('User created:', user._id)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword,
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}