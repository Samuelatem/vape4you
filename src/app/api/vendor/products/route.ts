import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check role
    const user = await localDB.findUserByEmail(session.user.email)
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 })
    }
    
    // Get all platform products for vendor to manage
    const productsResult = await localDB.getProducts({})
    const products = productsResult.products || []

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching vendor products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check role
    const user = await localDB.findUserByEmail(session.user.email)
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      category,
      images,
      specifications,
      inStock = true
    } = body

    // Validate required fields
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price, and category are required' },
        { status: 400 }
      )
    }

    // Create product using local database
    const defaultImage = '/images/products/default-product.jpg'
    const productImages = images && images.length > 0 ? images : [defaultImage]
    
    const product = await localDB.addProduct({
      name,
      description,
      price: parseFloat(price),
      category,
      image: productImages[0], // Use first image as main image
      images: productImages,
      specifications: specifications || {},
      vendorId: user?.id || session.user.email,
      vendorName: user?.name || session.user.name || 'Vendor',
      inStock,
      featured: false,
      rating: 0,
      reviews: 0
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}