# Agentic Counsel MVP - Technical Specification

## 1. System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Next)  │◄──►│  (Node.js/API)  │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Personality     │
                    │ Engine Service  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ AI Coaching     │
                    │ Service (GPT-4) │
                    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for chat functionality
- **AI Integration**: OpenAI GPT-4 API
- **Authentication**: JWT with bcrypt
- **Deployment**: Docker containers

## 2. Functional Requirements

### Core User Journey (10 Steps)
1. Landing page with value proposition
2. User registration and authentication
3. Personality blueprint collection (birth data)
4. Initial personality insights generation
5. Goal setting and coaching focus
6. First AI coaching conversation
7. Personalized action plan creation
8. Progress tracking setup
9. Ongoing coaching engagement
10. Community features (future)

### Four "Aha Moments"
1. **Personality Recognition**: Accurate personality insights
2. **Empathetic Understanding**: AI demonstrates deep understanding
3. **Personalized Guidance**: Tailored recommendations
4. **Progress Clarity**: Clear growth path visualization

## 3. Non-Functional Requirements

### Performance
- API response time: <2 seconds
- AI coaching response: <3 seconds
- Page load time: <1.5 seconds
- Mobile-first responsive design

### Security
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- HTTPS encryption
- GDPR compliance for birth data

### Scalability
- Stateless API design
- Database connection pooling
- Caching strategy for personality insights
- Horizontal scaling capability

## 4. Database Schema

### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    birth_date DATE,
    birth_time TIME,
    birth_location VARCHAR(255),
    personality_profile JSONB,
    coaching_goals TEXT[],
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    session_type VARCHAR(50),
    messages JSONB,
    insights_shared TEXT[],
    duration_minutes INTEGER,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Personality Insights Table
```sql
CREATE TABLE personality_insights (
    insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    category VARCHAR(100),
    astrological_basis JSONB,
    coaching_language TEXT,
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    disclosed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 5. API Specification

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### User Profile Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/personality-blueprint` - Submit birth data
- `GET /api/user/personality-insights` - Get personality insights

### Coaching Endpoints
- `POST /api/coaching/start-session` - Start coaching session
- `POST /api/coaching/message` - Send message in session
- `GET /api/coaching/history` - Get conversation history
- `POST /api/coaching/end-session` - End coaching session
- `POST /api/coaching/rate-session` - Rate session satisfaction

## 6. Component Architecture

### Frontend Components
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthGuard.tsx
│   ├── onboarding/
│   │   ├── PersonalityBlueprint.tsx
│   │   ├── InitialInsights.tsx
│   │   └── GoalSetting.tsx
│   ├── coaching/
│   │   ├── ChatInterface.tsx
│   │   ├── CoachingSession.tsx
│   │   └── ActionPlan.tsx
│   ├── dashboard/
│   │   ├── UserDashboard.tsx
│   │   ├── ProgressTracking.tsx
│   │   └── InsightCards.tsx
│   └── common/
│       ├── Layout.tsx
│       ├── Navigation.tsx
│       └── LoadingSpinner.tsx
├── pages/
│   ├── index.tsx (Landing)
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│   └── coaching/
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── websocket.ts
└── utils/
    ├── validation.ts
    └── formatting.ts
```

### Backend Services
```
src/
├── controllers/
│   ├── authController.ts
│   ├── userController.ts
│   └── coachingController.ts
├── services/
│   ├── personalityService.ts
│   ├── aiCoachingService.ts
│   └── astrologicalService.ts
├── middleware/
│   ├── auth.ts
│   ├── validation.ts
│   └── errorHandler.ts
├── models/
│   ├── User.ts
│   ├── Conversation.ts
│   └── PersonalityInsight.ts
└── utils/
    ├── astrology.ts
    ├── coaching.ts
    └── validation.ts
```

## 7. Success Criteria

### Technical Metrics
- 99.5% uptime
- <1% error rate
- 90%+ mobile compatibility
- GDPR compliance

### User Experience Metrics
- 85%+ registration to first session completion
- 70%+ personality accuracy validation
- 8+ minute average session duration
- 4.5+ session satisfaction rating

### Business Metrics
- 80%+ users experience 3+ aha moments
- 60%+ return for second session within 7 days
- 75%+ recognize clear value in personalized coaching
- 40%+ express interest in premium features

## 8. Implementation Phases

### Phase 1A: Core Foundation (MVP)
- User authentication system
- Personality blueprint collection
- Basic personality profiling engine
- Initial insights presentation
- Database setup and API foundation

### Phase 1B: AI Coaching Integration
- Real-time chat interface
- AI coaching engine integration
- Conversation management
- Progress tracking
- Complete user journey implementation

## 9. Security Considerations

### Data Protection
- Birth data encryption at rest
- Secure API endpoints
- Input validation and sanitization
- Rate limiting on API calls
- Audit logging for sensitive operations

### Privacy Compliance
- Clear data usage policies
- User consent management
- Data deletion capabilities
- GDPR compliance measures
- Transparent privacy controls

## 10. Deployment Strategy

### Development Environment
- Local development with Docker Compose
- Hot reloading for frontend and backend
- Test database with sample data
- Environment variable management

### Production Environment
- Containerized deployment
- Load balancing
- Database connection pooling
- SSL/TLS encryption
- Monitoring and logging