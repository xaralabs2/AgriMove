# AgriMove - Agricultural Logistics Platform

## Overview

AgriMove is a mobile-first logistics platform that connects farmers, market sellers, and drivers to consumers and businesses. The application enables efficient, AI-powered delivery services while reducing food waste and empowering local farmers through direct market access.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Vite build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon (serverless PostgreSQL)
- **Styling**: Tailwind CSS with Radix UI components
- **Real-time Communication**: WebSockets for live updates
- **External Services**: 
  - Twilio for SMS/WhatsApp messaging
  - Google Maps API for location services
  - OpenAI for demand forecasting

### Architecture Pattern
The application follows a full-stack monorepo architecture with:
- Shared schema definitions between client and server
- Type-safe API communication
- Real-time data synchronization via WebSockets
- Responsive mobile-first design

## Key Components

### Frontend Architecture
- **React SPA** with wouter for routing
- **Component Library**: Custom UI components built on Radix UI primitives
- **State Management**: React Query for server state, React Context for auth
- **Real-time Updates**: Custom WebSocket hook for live notifications
- **Forms**: React Hook Form with Zod validation
- **Mobile-first Design**: Responsive layout with bottom navigation

### Backend Architecture
- **Express.js Server** with TypeScript
- **Modular Route Structure**: Organized by feature domains
- **Authentication**: JWT-based auth with role-based access control
- **Database Layer**: Drizzle ORM with connection pooling
- **Real-time Communication**: WebSocket server for live updates
- **External Integrations**: Abstracted service layer for third-party APIs

### Database Schema
- **Users**: Multi-role system (buyer, farmer, driver)
- **Produce**: Farmer inventory management
- **Farms**: Farm profiles and information
- **Orders**: Complete order lifecycle management
- **Deliveries**: Driver assignment and tracking
- **Vehicles**: Driver vehicle information
- **Analytics**: Sales history and demand forecasting

## Data Flow

### User Authentication Flow
1. User registers/logs in through auth page
2. JWT token issued and stored in localStorage
3. Token included in all API requests
4. Role-based routing and component rendering

### Order Processing Flow
1. Buyer browses produce and adds to cart
2. Order created with multiple produce items
3. Farmers receive notifications and can accept/decline
4. Available drivers can accept delivery assignments
5. Real-time status updates via WebSocket
6. Order completion and rating system

### Real-time Communication Flow
1. WebSocket connection established on authentication
2. User subscribed to relevant channels based on role
3. Server broadcasts updates for orders, deliveries, messages
4. Client receives notifications and updates UI accordingly

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **wouter**: Lightweight routing
- **zod**: Runtime type validation

### Optional Services
- **Twilio**: SMS and WhatsApp messaging (graceful fallback)
- **Google Maps API**: Location services and mapping (graceful fallback)
- **OpenAI**: AI-powered demand forecasting (optional feature)

### Development Tools
- **Vite**: Fast development server and building
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Optimized builds with static asset serving
- **Database**: Neon serverless PostgreSQL with connection pooling
- **External Services**: Environment-based configuration with fallbacks

### Build Process
1. Client build via Vite (static assets)
2. Server build via ESBuild (Node.js bundle)
3. Database migrations via Drizzle
4. Environment variable validation

### Scalability Considerations
- Serverless-ready database connection handling
- Stateless server design for horizontal scaling
- WebSocket clustering support for multiple instances
- CDN-ready static asset organization

## Changelog
- June 28, 2025. Initial setup
- June 28, 2025. Added WhatsApp & USSD offline access functionality with interactive demos and admin dashboard
- June 28, 2025. Fixed category selector color contrast and made produce items clickable with product detail pages
- June 28, 2025. Resolved location service issues with graceful Google Maps API fallbacks and improved geolocation handling
- June 28, 2025. Implemented comprehensive AI features: price optimization, product recommendations, quality assessment, harvest timing, and route optimization
- June 28, 2025. Created complete product documentation covering all platform capabilities and AI integrations
- June 28, 2025. Built Progressive Web App (PWA) with mobile app installation capabilities, service worker for offline functionality, and mobile-optimized experience
- June 28, 2025. Prepared complete GitHub repository package for https://github.com/xaralabs2/AgriMove.git with deployment guides, documentation, and production configuration

## User Preferences

Preferred communication style: Simple, everyday language.
Keep "driver" terminology (not "transporter").