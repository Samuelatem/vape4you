import { NextRequest, NextResponse } from 'next/server'
import seedDatabase from '@/lib/seed'

export async function POST(request: NextRequest) {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seeding not allowed in production' },
        { status: 403 }
      )
    }
    
    await seedDatabase()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with all 25 products',
      data: {
        productsCreated: 25,
        vendorEmail: 'vendor@vape4you.com',
        vendorPassword: 'password123'
      }
    })
    
  } catch (error) {
    console.error('Seeding API error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}