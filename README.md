# Agentic Counsel - AI-Powered Executive Coaching Platform

A comprehensive monorepo containing the AI-powered executive coaching platform that combines astrological insights with modern coaching techniques.

## 🏗️ Monorepo Structure

```
agentic-counsel/
├── apps/
│   ├── web/              # Frontend Next.js application
│   └── api/              # Backend Express.js API
├── packages/
│   └── shared/           # Shared types, utilities, and configurations
├── docs/                 # Documentation and architecture files
├── package.json          # Root workspace configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database
- Redis server

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agentic-counsel
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.local.example apps/web/.env.local
   
   # Edit the environment files with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:setup
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the API server (port 3001) and the web application (port 3000).

## 📦 Applications

### Web App (`apps/web/`)

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for progress visualization
- **Real-time**: Socket.io client for live coaching sessions

**Key Features**:
- User authentication and onboarding
- Personality profile display with astrological insights
- Interactive coaching sessions
- Progress tracking and visualization
- Natal chart display and interpretation

### API Server (`apps/api/`)

- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with custom migration system
- **Caching**: Redis for session management
- **Authentication**: JWT with refresh tokens
- **AI Integration**: OpenAI for coaching responses
- **Astrology**: Swiss Ephemeris for natal chart calculations
- **Real-time**: Socket.io for live coaching sessions

**Key Features**:
- RESTful API with comprehensive endpoints
- Swiss Ephemeris integration for accurate astrological calculations
- AI-powered coaching response generation
- Real-time coaching session management
- Progress tracking and analytics

## 📚 Shared Package (`packages/shared/`)

Contains shared TypeScript types, utilities, and configurations used across both applications:

- **Types**: Comprehensive type definitions for all data models
- **Interfaces**: API request/response interfaces
- **Enums**: Shared enumerations and constants
- **Utilities**: Common utility functions (future)

## 🛠️ Development Scripts

### Root Level Commands

```bash
# Development
npm run dev              # Start both API and web in development mode
npm run dev:api          # Start only the API server
npm run dev:web          # Start only the web application

# Building
npm run build            # Build all applications
npm run build:api        # Build only the API server
npm run build:web        # Build only the web application
npm run build:shared     # Build only the shared package

# Production
npm run start            # Start both applications in production mode
npm run start:api        # Start only the API server in production
npm run start:web        # Start only the web application in production

# Database Management
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed the database with initial data
npm run db:setup         # Run migrations and seed data
npm run db:status        # Check migration status

# Maintenance
npm run test             # Run tests across all packages
npm run lint             # Lint all packages
npm run lint:fix         # Fix linting issues across all packages
npm run clean            # Clean all build artifacts and node_modules
```

### Individual App Commands

You can also run commands for individual applications:

```bash
# Web app specific
npm run dev --workspace=apps/web
npm run build --workspace=apps/web
npm run lint --workspace=apps/web

# API specific
npm run dev --workspace=apps/api
npm run build --workspace=apps/api
npm run test --workspace=apps/api
```

## 🏛️ Architecture

### Technology Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **AI/ML**: OpenAI GPT for coaching responses
- **Astrology**: Swiss Ephemeris for natal chart calculations
- **Real-time**: Socket.io for live coaching sessions
- **Authentication**: JWT with refresh token rotation
- **Deployment**: Docker-ready with environment-based configuration

### Key Design Principles

1. **Monorepo Architecture**: Centralized codebase with shared dependencies
2. **Type Safety**: Comprehensive TypeScript coverage across all applications
3. **Shared Types**: Centralized type definitions to ensure consistency
4. **Modular Design**: Clear separation of concerns between frontend and backend
5. **Real-time Communication**: WebSocket integration for live coaching sessions
6. **Scalable Database**: PostgreSQL with proper indexing and relationships
7. **Caching Strategy**: Redis for session management and performance optimization

## 🔧 Configuration

### Environment Variables

#### API Server (`apps/api/.env`)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql