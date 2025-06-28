# AgriMove - Agricultural Logistics Platform

A comprehensive mobile-first logistics platform connecting farmers, buyers, and drivers for efficient agricultural produce delivery with AI-powered optimization and offline accessibility.

## 🚀 Features

### Core Platform
- **Multi-role System**: Farmers, buyers, and drivers with role-based access
- **Real-time Marketplace**: Browse and order fresh produce directly from farms
- **Live Tracking**: GPS-enabled delivery tracking and status updates
- **Mobile-First Design**: Responsive interface optimized for mobile devices

### Mobile App (PWA)
- **Installable App**: Install directly to home screen from any browser
- **Offline Functionality**: Service worker with intelligent caching
- **Push Notifications**: Real-time order and delivery updates
- **Background Sync**: Queue actions for when connectivity returns

### Accessibility Features
- **WhatsApp Integration**: Complete marketplace access via messaging
- **USSD Support**: Feature phone compatibility with interactive menus
- **SMS Fallback**: Basic functionality for maximum reach
- **Multi-language Ready**: Extensible localization framework

### AI-Powered Features
- **Smart Recommendations**: Personalized product suggestions
- **Price Optimization**: Dynamic pricing based on market trends
- **Quality Assessment**: Image-based produce quality analysis
- **Route Optimization**: Intelligent delivery route planning
- **Demand Forecasting**: Predictive analytics for inventory management

### Location Services
- **GPS Integration**: Real-time location tracking
- **Geofencing**: Automated delivery confirmations
- **Offline Maps**: Cached location data for offline use
- **Address Validation**: Nigerian postal code integration

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with Radix UI components
- **React Query** for server state management
- **Wouter** for lightweight routing
- **Service Worker** for PWA functionality

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time communication
- **JWT Authentication** with role-based access
- **RESTful API** with type-safe endpoints

### External Services
- **Neon Database** (Serverless PostgreSQL)
- **OpenAI API** for AI-powered features
- **Twilio** for WhatsApp/SMS integration
- **Google Maps API** for location services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- OpenAI API key (optional, graceful fallbacks included)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/xaralabs2/AgriMove.git
cd AgriMove
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
Create `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

4. **Database setup**
```bash
npm run db:push
```

5. **Start development**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📱 Mobile App Installation

### Android
1. Open Chrome and navigate to the AgriMove app
2. Tap "Install" when prompted
3. App installs to home screen like native app

### iOS
1. Open Safari and navigate to the AgriMove app
2. Tap Share → "Add to Home Screen"
3. Tap "Add" to complete installation

### Desktop
1. Open Chrome/Edge/Firefox
2. Click install icon in address bar
3. App installs as desktop application

## 👥 Demo Accounts

Test the platform with these pre-configured accounts:

- **Farmer**: `farmer1` / `password123`
- **Buyer**: `buyer1` / `password123`
- **Driver**: `driver1` / `password123`

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Marketplace
- `GET /api/produce` - Browse all produce
- `GET /api/farms` - List all farms
- `GET /api/farms/featured` - Featured farms
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders

### AI Services
- `GET /api/ai/recommendations/:userId` - Get personalized recommendations
- `POST /api/ai/price-optimize` - Get pricing suggestions
- `POST /api/ai/quality-assess` - Analyze produce quality
- `POST /api/ai/route-optimize` - Optimize delivery routes

### Real-time Features
- `WebSocket /ws` - Real-time updates for orders and deliveries

## 🏗 Project Structure

```
AgriMove/
├── client/                 # React frontend
│   ├── public/            # Static assets and PWA manifest
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
│   ├── services/          # Business logic and AI services
│   ├── routes.ts          # API endpoint definitions
│   ├── storage.ts         # Database operations
│   └── websocket.ts       # Real-time communication
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and validation
└── docs/                  # Documentation files
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open database studio

### Testing
- Access WhatsApp demo at `/whatsapp-demo`
- Test USSD functionality at `/admin-dashboard`
- Install PWA and test offline functionality

## 🚀 Deployment

### Replit Deployment
1. Connect repository to Replit
2. Configure environment variables
3. Deploy with Replit Deployments

### Manual Deployment
1. Build the application: `npm run build`
2. Configure production environment variables
3. Deploy to your preferred hosting platform

## 📖 Documentation

- [Product Documentation](PRODUCT_DOCUMENTATION.md) - Complete feature overview
- [Mobile App Guide](MOBILE_APP_FEATURES.md) - PWA installation and features
- [WhatsApp Integration](WHATSAPP_USSD_GUIDE.md) - Offline access setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Nigerian agricultural communities
- Designed for maximum accessibility and offline functionality
- Powered by modern web technologies and AI

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation for common solutions

---

**AgriMove** - Revolutionizing agricultural logistics through technology, accessibility, and community connection.