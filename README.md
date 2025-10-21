# 🚀 Vape4You - Complete E-commerce Platform

## 📋 Overview

Vape4You is a full-stack vape e-commerce website with vendor/client role-based authentication, real-time chat, multiple payment methods, and a comprehensive product catalog. Built with modern technologies for optimal performance and user experience.

**🎯 Status: FULLY FUNCTIONAL** - All core features implemented and working!

## Features

### 🛍️ E-commerce Core
- Product catalog with detailed product pages
- Shopping cart functionality
- Order management system
- Inventory tracking

### 👥 User Authentication & Roles
- **Vendor Role**: 
  - Add/edit/delete products
  - Manage inventory and pricing
  - View sales analytics
  - Real-time chat with customers
- **Client Role**:
  - Browse and purchase products
  - Order history
  - Real-time chat with vendors

### 💰 Multiple Payment Methods
- Bitcoin payments
- PayPal integration
- CashApp payments
- Revolut payments
- Contact vendor for alternative payment methods

### 💬 Real-time Communication
- Live chat between vendors and clients
- Real-time notifications
- Order status updates
- Support system

### 🎨 Modern UI/UX
- Responsive design for all devices
- Dark/light mode support
- Smooth animations
- Intuitive navigation

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Icons**: Lucide React & Heroicons

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd vape4you
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat components
│   ├── products/         # Product-related components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication config
│   └── utils.ts         # General utilities
├── models/              # Database models
│   ├── User.ts
│   ├── Product.ts
│   ├── Order.ts
│   └── Chat.ts
├── store/               # State management
│   ├── auth.ts
│   ├── cart.ts
│   └── chat.ts
└── types/               # TypeScript types
    └── index.ts
```

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (vendor only)
- `PUT /api/products/[id]` - Update product (vendor only)
- `DELETE /api/products/[id]` - Delete product (vendor only)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `PUT /api/orders/[id]` - Update order status

### Chat
- `GET /api/chat/rooms` - Get chat rooms
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/[roomId]` - Get room messages

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/vape4you

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Payment APIs (add your keys)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
BITCOIN_API_KEY=your_bitcoin_api_key
CASHAPP_API_KEY=your_cashapp_api_key
REVOLUT_API_KEY=your_revolut_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Support

For support, email support@vape4you.com or join our chat system within the application.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`

## Development Notes

- The application uses Next.js 14 with the new App Router
- Real-time features are powered by Socket.io
- Payment integrations require proper API keys and webhook setup
- Database models are designed for scalability
- The UI is fully responsive and supports both light and dark themes

---

**Note**: This application is designed for educational purposes. Ensure compliance with local laws and regulations regarding vape product sales in your jurisdiction.