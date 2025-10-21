import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
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
    
    // Get real data from database
    const productsResult = await localDB.getProducts({})
    const products = productsResult.products || []
    
    // Get orders from database, seed demo orders if none exist
    let orders = await localDB.getOrders() || []
    if (orders.length === 0) {
      orders = await localDB.seedDemoOrders()
    }
    
    // Get all users to count customers
    const users = await localDB.getAllUsers() || []
    const customers = users.filter(u => u.role === 'client')

    // Calculate vendor's orders (for demo, we'll show all orders)
    const vendorOrders = orders.filter(order => order.status !== 'cancelled')
    
    // Calculate revenue from completed orders
    const completedOrders = vendorOrders.filter(order => 
      order.status === 'delivered' || order.status === 'shipped'
    )
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0)

    const stats = {
      totalProducts: products.length,
      totalRevenue: totalRevenue,
      totalCustomers: customers.length,
      totalOrders: vendorOrders.length,
      pendingOrders: vendorOrders.filter(order => order.status === 'pending').length,
      shippedOrders: vendorOrders.filter(order => order.status === 'shipped').length,
      deliveredOrders: vendorOrders.filter(order => order.status === 'delivered').length,
      inStockProducts: products.filter(product => product.inStock !== false).length,
      outOfStockProducts: products.filter(product => product.inStock === false).length
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching vendor stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}