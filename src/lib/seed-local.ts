import { localDB } from './local-db'
import { productData } from '@/data/products'

async function seedLocalDatabase() {
  console.log('🌱 Starting local database seeding...')
  
  try {
    // Create vendor if not exists
    const vendor = await localDB.createUser({
      email: 'vendor@vape4you.com',
      password: 'password123',
      name: 'VapeShop Pro',
      role: 'vendor'
    }).catch(() => null)

    if (vendor) {
      console.log('✅ Created vendor user')
    } else {
      console.log('ℹ️ Vendor user already exists')
    }

    // Get vendor ID
    const existingVendor = await localDB.findUserByEmail('vendor@vape4you.com')
    if (!existingVendor) {
      throw new Error('Vendor not found')
    }

    // Delete all existing products
    const db = (localDB as any).db
    db.products = []
    ;(localDB as any).saveDB()
    console.log('✅ Cleared existing products')

    // Add new products
    for (const product of productData) {
      await localDB.addProduct({
        ...product,
        vendorId: existingVendor.id,
        vendorName: existingVendor.name
      })
    }

    console.log(`✅ Added ${productData.length} products with updated prices`)
    console.log('🎉 Local database seeding completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedLocalDatabase().then(() => process.exit(0))
}

export default seedLocalDatabase