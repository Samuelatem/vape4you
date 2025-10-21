import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { localDB } from '@/lib/local-db'

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

    if (!['vendor', 'client'].includes(role)) {
      console.log('Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    console.log('Attempting to connect to MongoDB Atlas...')
    let useLocalDB = false
    
    try {
      await connectDB()
      console.log('MongoDB Atlas connected successfully')
    } catch (dbError) {
      console.log('MongoDB Atlas connection failed, using local database')
      console.error('DB Error:', dbError)
      useLocalDB = true
    }

    let userWithoutPassword

    if (useLocalDB) {
      // Use local database
      console.log('Creating user with local database...')
      userWithoutPassword = await localDB.createUser({ email, password, name, role })
      console.log('User created in local DB:', userWithoutPassword.id)
    } else {
      // Use MongoDB Atlas
      console.log('Checking if user exists in MongoDB...')
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        console.log('User already exists')
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        )
      }

      console.log('Hashing password...')
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log('Password hashed successfully')

      console.log('Creating user in MongoDB...')
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        role,
      })
      console.log('User created:', user._id)

      // Remove password from response
      const { password: _, ...userData } = user.toObject()
      userWithoutPassword = userData
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword,
      database: useLocalDB ? 'local' : 'mongodb'
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