import { localDB } from './src/lib/local-db'

async function initializeLocalDatabase() {
  try {
    console.log('🚀 Initializing local database...')
    
    // Seed demo users and products
    const result = await localDB.seedDemoUsers()
    
    const userCount = await localDB.getUserCount()
    const productData = await localDB.getProducts({ limit: 100 })
    
    console.log(`📊 Total users in local database: ${userCount}`)
    console.log(`📦 Total products in local database: ${productData.products.length}`)
    
    console.log('✅ Local database initialized successfully!')
    console.log('\n🔑 Demo Credentials:')
    console.log('   Vendor: vendor@vape4you.com / password123')
    console.log('   Client: client@vape4you.com / password123')
    console.log('\n🌐 Visit: http://localhost:3000/auth/login')
    console.log('🛍️ Browse products: http://localhost:3000/products')
    
  } catch (error) {
    console.error('❌ Error initializing local database:', error)
  }
}

initializeLocalDatabase()