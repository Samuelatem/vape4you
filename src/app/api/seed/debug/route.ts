import { NextRequest, NextResponse } from 'next/server'
import seedDatabase from '@/lib/seed'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-seed-key')
    
    // Simple key check - replace with your own key
    if (authHeader !== 'vape4you-debug-2023') {
      return NextResponse.json(
        { error: 'Unauthorized seeding attempt' },
        { status: 403 }
      )
    }

    console.log('Starting debug seeding process...')
    await seedDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully'
    })
  } catch (error) {
    console.error('Debug seeding error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed database' },
      { status: 500 }
    )
  }
}