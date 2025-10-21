import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    
    const productId = params.id
    const product = await localDB.getProduct(productId)
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product for edit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id
    const body = await request.json()
    
    const updatedProduct = await localDB.updateProduct(productId, body)
    
    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const productId = params.id
    const success = await localDB.deleteProduct(productId)
    
    if (!success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}