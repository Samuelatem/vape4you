import mongoose from 'mongoose'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables if not in Next.js context
if (!process.env.MONGODB_URI) {
  config({ path: path.resolve(process.cwd(), '.env.local') })
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local')
}

if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
  throw new Error('Invalid MongoDB connection string format. Must start with "mongodb://" or "mongodb+srv://"')
}

interface CachedConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: CachedConnection | undefined
}

let cached = globalThis.mongoose

if (!cached) {
  cached = globalThis.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    if (!cached) {
      cached = globalThis.mongoose = { conn: null, promise: null }
    }
    
    if (cached.conn && mongoose.connection.readyState === 1) {
      return cached.conn
    }

    if (!cached.promise) {
      console.log('Initiating MongoDB connection...')
      
      const opts: mongoose.ConnectOptions = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 20000,
        maxPoolSize: 10,
        retryWrites: true,
        retryReads: true,
        w: 'majority'
      }
      
      // Clear any existing connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect()
      }

      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('MongoDB connected successfully')
          
          // Set up event listeners
          mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err)
            if (cached) {
              cached.conn = null
              cached.promise = null
            }
          })

          mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected')
            if (cached) {
              cached.conn = null
              cached.promise = null
            }
          })

          return mongoose
        })
        .catch((err) => {
          console.error('MongoDB connection failed:', err)
          if (cached) {
            cached.conn = null
            cached.promise = null
          }
          throw err
        })
    }

    cached.conn = await cached.promise
    return cached.conn
  } catch (e) {
    const error = e as any
    console.error('Error in dbConnect:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      connectionString: MONGODB_URI.replace(/\/\/.+@/, '//****:****@')
    })
    if (cached) {
      cached.conn = null
      cached.promise = null
    }
    throw e
  }
}

export const connectDB = dbConnect
export default dbConnect