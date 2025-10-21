import { NextRequest, NextResponse } from 'next/server'
import seedDatabase from '@/lib/seed'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.ADMIN_SEED_TOKEN

    if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await seedDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with all 25 products',
      data: {
        productsCreated: 25
      }
    })
    
  } catch (error) {
    console.error('Production seeding error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}