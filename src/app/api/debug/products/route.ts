import { NextRequest, NextResponse } from 'next/server'
import { localDB } from '@/lib/local-db'

export async function GET(request: NextRequest) {
  try {
    const productsResult = await localDB.getProducts({})
    const products = productsResult.products || []
    
    // Log product IDs for debugging
    console.log('Debug - Products:', products.map(p => ({ id: p.id, name: p.name })))
    
    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price
      }))
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}