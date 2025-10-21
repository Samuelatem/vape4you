import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import { Product } from '@/models/Product'

export async function GET() {
  try {
    await dbConnect()
    
    const productCount = await Product.countDocuments()
    const sampleProduct = await Product.findOne().lean()
    
    return NextResponse.json({
      success: true,
      data: {
        productCount,
        sampleProduct,
        dbConnected: true,
      }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}