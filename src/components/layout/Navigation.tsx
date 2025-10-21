'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react'
import { useCartStore } from '@/store/cart'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()
  const itemCount = useCartStore((state) => state.getItemCount())

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Check if user is a vendor
  const isVendor = session?.user?.role === 'vendor'

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-purple-600">
              Vape4You
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {session?.user ? (
              isVendor ? (
                // Vendor Navigation - Only Dashboard and Chat
                <>
                  <Link href="/vendor" className="text-gray-600 hover:text-purple-600 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/chat" className="text-gray-600 hover:text-purple-600 font-medium">
                    Chat
                  </Link>
                </>
              ) : (
                // Client Navigation - Full navigation
                <>
                  <Link href="/" className="text-gray-600 hover:text-purple-600 font-medium">
                    Home
                  </Link>
                  <Link href="/products" className="text-gray-600 hover:text-purple-600 font-medium">
                    Products
                  </Link>
                  <Link href="/chat" className="text-gray-600 hover:text-purple-600 font-medium">
                    Chat
                  </Link>
                  <Link href="/orders" className="text-gray-600 hover:text-purple-600 font-medium">
                    Orders
                  </Link>
                </>
              )
            ) : (
              // Not logged in - Public navigation
              <>
                <Link href="/" className="text-gray-600 hover:text-purple-600 font-medium">
                  Home
                </Link>
                <Link href="/products" className="text-gray-600 hover:text-purple-600 font-medium">
                  Products
                </Link>
              </>
            )}
            
            {/* Cart */}
            <Link href="/cart" className="text-gray-600 hover:text-purple-600 font-medium relative">
              <ShoppingCart className="w-6 h-6" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Links */}
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  Welcome, {session.user?.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-gray-600 hover:text-purple-600 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-gray-600 hover:text-purple-600 font-medium">
                  Login
                </Link>
                <Link href="/auth/register" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-purple-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {session?.user?.email ? (
                session.user.role === 'vendor' ? (
                  // Vendor Mobile Navigation - Only Dashboard and Chat
                  <>
                    <Link 
                      href="/vendor" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/chat" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Chat
                    </Link>
                  </>
                ) : (
                  // Client Mobile Navigation
                  <>
                    <Link 
                      href="/" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link 
                      href="/products" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link 
                      href="/chat" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Chat
                    </Link>
                    <Link 
                      href="/orders" 
                      className="text-gray-600 hover:text-purple-600 font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link 
                      href="/cart" 
                      className="text-gray-600 hover:text-purple-600 font-medium flex items-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Cart {mounted && itemCount > 0 && `(${itemCount})`}
                    </Link>
                  </>
                )
              ) : (
                // Not logged in
                <>
                  <Link 
                    href="/" 
                    className="text-gray-600 hover:text-purple-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/products" 
                    className="text-gray-600 hover:text-purple-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Products
                  </Link>
                </>
              )}
              
              {session ? (
                <div className="flex flex-col space-y-4">
                  <span className="text-gray-600">Welcome, {session.user?.name}</span>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center text-gray-600 hover:text-purple-600 font-medium text-left"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link 
                    href="/auth/login" 
                    className="text-gray-600 hover:text-purple-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}