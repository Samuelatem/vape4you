import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Product } from '@/models/Product'
import { connectDB } from '@/lib/db'
import { localDB } from '@/lib/local-db'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let useLocalDB = false
    let result: any

    // Try MongoDB Atlas first
    try {
      console.log('Attempting to connect to MongoDB Atlas for products...')
      await connectDB()
      console.log('MongoDB Atlas connected successfully')

      const skip = (page - 1) * limit

      // Build query
      const query: any = { isActive: true }

      if (category) {
        query.category = category
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      // Build sort object
      const sort: any = {}
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1

      const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()

      const total = await Product.countDocuments(query)

      result = {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } catch (dbError) {
      console.log('MongoDB Atlas failed, using local database')
      console.error('DB Error:', dbError)
      useLocalDB = true
    }

    // Use local database if MongoDB failed
    if (useLocalDB) {
      console.log('Fetching products from local database')
      result = await localDB.getProducts({
        page,
        limit,
        category: category || undefined,
        search: search || undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc'
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
      database: useLocalDB ? 'local' : 'mongodb'
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || (session.user as any).role !== 'vendor') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, price, images, category, stock, specifications, tags } = body

    // Validation
    if (!name || !description || !price || !images || !category || !stock) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    await connectDB()

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      images,
      category,
      stock: parseInt(stock),
      vendorId: (session.user as any).id,
      specifications: specifications || {},
      tags: tags || [],
    })

    const populatedProduct = await Product.findById(product._id)
      .populate('vendorId', 'name email')
      .lean()

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct,
    })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}