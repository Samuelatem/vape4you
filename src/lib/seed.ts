import dbConnect from '@/lib/db'
import { Product } from '@/models/Product'
import { User } from '@/models/User'
import { productData } from '@/data/products'
import bcrypt from 'bcryptjs'

async function seedDatabase() {
  try {
    await dbConnect()
    
    console.log('🌱 Starting database seeding...')
    
    // Clear existing data
    await Product.deleteMany({})
    await User.deleteMany({})
    
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
    
    await Product.insertMany(productsWithVendor)
    
    console.log(`✅ Created ${productData.length} products`)
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