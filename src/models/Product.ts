import mongoose, { Schema, model, models } from 'mongoose'

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [{
    type: String,
    required: true,
  }],
  category: {
    type: String,
    required: true,
    enum: ['disposable', 'pod-system', 'mod', 'e-liquid', 'accessories'],
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  vendorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  specifications: {
    type: Map,
    of: String,
    default: new Map(),
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
})

// Indexes for better performance
ProductSchema.index({ vendorId: 1 })
ProductSchema.index({ category: 1 })
ProductSchema.index({ name: 'text', description: 'text' })
ProductSchema.index({ price: 1 })
ProductSchema.index({ 'rating.average': -1 })
ProductSchema.index({ createdAt: -1 })

export const Product = models.Product || model('Product', ProductSchema)