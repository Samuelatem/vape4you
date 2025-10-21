import { NextRequest, NextResponse } from 'next/server'
import { localDB } from '@/lib/local-db'

export async function POST(request: NextRequest) {
  try {
    // Seed demo orders
    const orders = await localDB.seedDemoOrders()
    
    return NextResponse.json({
      success: true,
      message: 'Demo orders seeded successfully',
      count: orders.length
    })
  } catch (error) {
    console.error('Error seeding demo orders:', error)
    return NextResponse.json(
      { error: 'Failed to seed demo orders' },
      { status: 500 }
    )
  }
}