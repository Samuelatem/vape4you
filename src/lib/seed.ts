import dbConnect from '@/lib/db'
import { Product } from '@/models/Product'
import { User } from '@/models/User'
import { Order } from '@/models/Order'
import { productData } from '@/data/products'
import bcrypt from 'bcryptjs'

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    console.log('Connecting to database...')
    const db = await dbConnect()
    console.log('Database connection state:', db.connection.readyState)
    
    if (db.connection.readyState !== 1) {
      throw new Error('Database connection is not ready')
    }
    
    // Clear existing data
    console.log('Clearing existing data...')
    await Promise.all([
      Product.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}) // Clean orders too
    ])
    
    // Create a default vendor user
    const hashedPassword = await bcrypt.hash('password123', 12)
    const vendor = await User.create({
      email: 'vendor@vape4you.com',
      password: hashedPassword,
      name: 'Vape4You Store',
      role: 'vendor',
      isVerified: true
    })
    
    console.log('✅ Created vendor user')
    
    // Create products with the vendor ID - ensure exact price matching
    const productsWithVendor = productData.map(product => ({
      ...product,
      vendorId: vendor._id,
      isActive: true,
      price: Number(product.price), // Ensure price is exactly as specified
      views: Math.floor(Math.random() * 100) + 10,
      rating: product.rating || { average: 4.5, count: 0 }
    }))
    
    console.log('Creating products...')
    const insertedProducts = await Product.insertMany(productsWithVendor)
    
    // Verify prices were set correctly
    const priceCheck = insertedProducts.map((product, index) => ({
      name: product.name,
      expectedPrice: productData[index].price,
      actualPrice: product.price,
      matched: product.price === productData[index].price
    }))
    
    const allPricesMatch = priceCheck.every(p => p.matched)
    
    console.log('Price verification results:')
    priceCheck.forEach(p => {
      if (!p.matched) {
        console.log(`❌ Price mismatch for ${p.name}: expected ${p.expectedPrice}, got ${p.actualPrice}`)
      }
    })
    
    console.log(`✅ Created ${productData.length} products${allPricesMatch ? ' with verified prices' : ' (WARNING: price mismatches found)'}`)
    console.log('🎉 Database seeding completed successfully!')
    
    // Log sample credentials
    console.log('\n📋 Sample Login Credentials:')
    console.log('Email: vendor@vape4you.com')
    console.log('Password: password123')
    console.log('Role: vendor')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

export default seedDatabase