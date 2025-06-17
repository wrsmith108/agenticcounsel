# Agentic Counsel Frontend

A comprehensive Next.js 14 frontend application for the Agentic Counsel AI-powered executive coaching platform.

## Overview

Agentic Counsel is an innovative executive coaching platform that combines AI-powered coaching with personality insights to provide personalized leadership development. The frontend provides a modern, responsive interface for users to engage with their AI coach, track progress, and manage their coaching journey.

## Features

### 🎯 Core Features
- **AI-Powered Coaching**: Real-time coaching conversations with WebSocket support
- **Personality Profiling**: Comprehensive personality insights based on user data
- **Progress Tracking**: Visual progress monitoring with charts and analytics
- **Goal Management**: Set, track, and achieve coaching goals
- **Session Management**: Multiple coaching session types (goal setting, progress review, action planning)

### 🔐 Authentication & Security
- JWT-based authentication with automatic token refresh
- Protected routes with middleware
- Secure API communication with interceptors
- Session management with persistent login state

### 📱 User Experience
- Responsive design for desktop and mobile
- Real-time messaging with WebSocket connections
- Interactive onboarding flow
- Comprehensive dashboard with quick actions
- Error boundaries for graceful error handling
- Loading states and skeleton screens

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **HTTP Client**: Axios with interceptors
- **WebSocket**: Socket.io-client
- **Authentication**: JWT tokens with refresh mechanism

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── coaching/          # Coaching session pages
│   ├── dashboard/         # Main dashboard
│   ├── login/            # Authentication pages
│   ├── onboarding/       # User onboarding flow
│   ├── progress/         # Progress tracking
│   └── register/         # User registration
├── components/           # Reusable UI components
│   ├── CoachingCard.tsx  # Coaching session cards
│   ├── ErrorBoundary.tsx # Error handling
│   ├── LoadingSpinner.tsx # Loading states
│   ├── PersonalityDisplay.tsx # Personality profiles
│   └── ProgressCharts.tsx # Data visualization
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication state
├── lib/                # Utility libraries
│   ├── api.ts          # API client with all endpoints
│   └── socket.ts       # WebSocket service
├── types/              # TypeScript type definitions
│   └── index.ts        # All application types
└── middleware.ts       # Route protection middleware
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API server running (see backend README)
- PostgreSQL database (for backend)
- Redis (optional, for session management)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd agentic-counsel
   ```

2. **Install frontend dependencies**:
   ```bash
   cd agentic-counsel/frontend/frontend
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd ../../backend
   npm install
   ```

4. **Environment setup**:
   
   **Frontend** - Create `.env.local` in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   NODE_ENV=development
   ```

   **Backend** - Create `.env` in the backend directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/agentic_counsel
   JWT_SECRET=your-jwt-secret-here
   REDIS_URL=redis://localhost:6379
   PORT=3001
   NODE_ENV=development
   ```

5. **Database setup**:
   ```bash
   cd backend
   npm run db:setup
   npm run db:migrate
   npm run db:seed
   ```

6. **Start the application**:
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

   **Frontend** (Terminal 2):
   ```bash
   cd agentic-counsel/frontend/frontend
   npm run dev
   ```

7. **Open application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Claude-Flow Integration

This project includes advanced claude-flow integration with 17 specialized modes and 4 comprehensive workflows:

#### Available Claude-Flow Commands
```bash
# Quick access to claude-flow
npm run cf                    # Main orchestrator
npm run cf:status            # Show workflow status
npm run cf:list              # List available workflows and modes
npm run cf:component         # Generate new components
npm run cf:workflow          # Execute custom workflows
npm run cf:feature           # Feature development workflow
npm run cf:review            # Code review workflow
npm run cf:deploy            # Deployment preparation
```

#### Specialized Modes
- **architect**: System design and planning
- **code**: Implementation and coding
- **tdd**: Test-driven development
- **security-review**: Security auditing
- **devops**: Deployment and infrastructure
- **integration**: API and service integration
- **debug**: Issue troubleshooting
- **optimize**: Performance optimization
- **refactor**: Code quality improvement
- **ui-ux**: User interface design
- **api-design**: API architecture
- **documentation**: Technical documentation
- **workflow**: Process automation
- **component-generator**: React component creation
- **state-management**: State architecture
- **accessibility**: A11y compliance

#### Automated Workflows
1. **Component Generation**: Automated React component creation with TypeScript, tests, and documentation
2. **Feature Development**: Complete feature lifecycle from requirements to deployment
3. **Code Review**: Comprehensive code quality, security, and performance review
4. **Deployment Preparation**: Build optimization, testing, and deployment configuration

### Quick Start with Claude-Flow

Generate a new component:
```bash
npm run cf:component UserProfile "User profile display component"
```

Develop a new feature:
```bash
npm run cf:feature "Chat History" "Display and manage coaching conversation history"
```

Run code review:
```bash
npm run cf:review src/components/CoachingCard.tsx
```

Prepare for deployment:
```bash
npm run cf:deploy
```

## API Integration

The frontend integrates with a comprehensive backend API providing:

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /users/complete-onboarding` - Complete onboarding

### Coaching Services
- `POST /coaching/start-session` - Start coaching session
- `GET /coaching/conversations` - Get user conversations
- `GET /coaching/conversations/:id` - Get specific conversation
- `POST /coaching/conversations/:id/messages` - Send message
- `GET /coaching/conversations/:id/messages` - Get messages
- `POST /coaching/conversations/:id/end` - End session

### Progress Tracking
- `GET /progress/overview` - Get progress overview
- `GET /progress/history` - Get progress history
- `POST /progress/update` - Update progress

### Personality Insights
- `GET /personality/profile` - Get personality profile
- `POST /personality/generate` - Generate personality insights

## Key Components

### Authentication Flow
```typescript
// Login with automatic token management
const { login, user, isAuthenticated } = useAuth();
await login(email, password);
```

### Real-time Coaching
```typescript
// WebSocket connection for live coaching
socketService.connect();
socketService.joinConversation(conversationId);
socketService.on('new_message', handleNewMessage);
```

### Progress Visualization
```typescript
// Interactive charts with Recharts
<ProgressCharts 
  progressData={progressHistory}
  categoryData={categoryProgress}
  timeRange="month"
/>
```

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier configured
- Consistent component structure with props interfaces
- Error handling with try-catch blocks
- Loading states for all async operations

### Component Patterns
- Functional components with hooks
- Custom hooks for shared logic
- Context providers for global state
- Error boundaries for error handling
- Skeleton loading components

### API Integration
- Centralized API client with interceptors
- Automatic token refresh handling
- Consistent error handling
- Type-safe API responses

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NODE_ENV=production
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Features in Detail

### Dashboard
- Quick action buttons for starting coaching sessions
- Recent conversations overview
- Progress statistics and charts
- Goal tracking and management

### Coaching Interface
- Real-time messaging with WebSocket
- Message history with timestamps
- Session status indicators
- End session functionality

### Progress Tracking
- Visual progress charts (line, bar, pie)
- Goal completion tracking
- Historical progress data
- Category-based progress analysis

### Onboarding Flow
- Multi-step wizard interface
- Personality profile generation
- Goal selection and preferences
- Session type preferences

## Troubleshooting

### Common Issues

#### Frontend Issues

**Port 3000 already in use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
npm run dev -- -p 3001
```

**API connection errors**
- Verify backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure no CORS issues (backend should allow localhost:3000)

**WebSocket connection failures**
- Verify `NEXT_PUBLIC_WS_URL` is set correctly
- Check if backend WebSocket server is running
- Ensure firewall allows WebSocket connections

**Authentication issues**
- Clear localStorage: `localStorage.clear()`
- Check JWT token expiration
- Verify backend auth endpoints are working

#### Backend Issues

**Database connection errors**
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database
npm run db:reset
npm run db:migrate
npm run db:seed
```

**Migration failures**
```bash
# Check migration status
npm run db:status

# Rollback and retry
npm run db:rollback
npm run db:migrate
```

**Redis connection issues**
```bash
# Check Redis is running
redis-cli ping

# Start Redis (macOS with Homebrew)
brew services start redis
```

#### Claude-Flow Issues

**Workflow execution failures**
```bash
# Check claude-flow status
npm run cf:status

# Verify configuration
cat claude-flow.config.json

# Reset workflow state
rm -rf .claude-flow/cache
```

**Component generation errors**
- Ensure templates exist in `templates/` directory
- Check file permissions for write access
- Verify TypeScript configuration

### Performance Issues

**Slow initial load**
- Check bundle size: `npm run build && npm run analyze`
- Optimize images and assets
- Enable compression in production

**Memory leaks**
- Check for unclosed WebSocket connections
- Verify event listeners are properly cleaned up
- Monitor React component unmounting

### Development Tips

**Hot reload not working**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**TypeScript errors**
```bash
# Check types
npm run type-check

# Regenerate types if needed
npm run generate-types
```

**Linting issues**
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check specific files
npx eslint src/components/ComponentName.tsx
```

## Contributing

### Development Workflow

1. **Setup Development Environment**
   ```bash
   git clone <repository-url>
   cd agentic-counsel
   npm run setup  # Installs all dependencies
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Use Claude-Flow for Development**
   ```bash
   # Plan the feature
   npm run cf architect "Plan new feature implementation"
   
   # Generate components
   npm run cf:component FeatureName "Feature description"
   
   # Implement with TDD
   npm run cf tdd "Write tests for new feature"
   ```

4. **Code Quality Checks**
   ```bash
   # Run full review workflow
   npm run cf:review src/path/to/your/code
   
   # Manual checks
   npm run lint
   npm run type-check
   npm test
   ```

5. **Submit Pull Request**
   - Include comprehensive description
   - Add screenshots for UI changes
   - Ensure all tests pass
   - Request code review

### Code Standards

- **TypeScript**: Strict mode enabled, proper type definitions
- **React**: Functional components with hooks, proper error boundaries
- **Styling**: Tailwind CSS with consistent design system
- **Testing**: Jest and React Testing Library
- **Documentation**: JSDoc comments for complex functions
- **Git**: Conventional commit messages

### Architecture Guidelines

- Follow the established folder structure
- Use proper separation of concerns
- Implement proper error handling
- Add loading states for async operations
- Ensure accessibility compliance
- Optimize for performance

## License

This project is part of the Agentic Counsel platform. All rights reserved.