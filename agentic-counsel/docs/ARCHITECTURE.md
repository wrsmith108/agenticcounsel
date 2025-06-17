# Agentic Counsel MVP - System Architecture

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (React/Next.js)  │  Mobile Browser (Responsive)    │
│  - Authentication UI           │  - Touch-optimized interface   │
│  - Personality Collection      │  - Mobile chat experience      │
│  - Coaching Chat Interface     │  - Progressive Web App         │
│  - Progress Dashboard          │  - Offline capability          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (Nginx)        │  SSL/TLS Termination           │
│  - Request routing            │  - Certificate management      │
│  - Rate limiting              │  - Security headers            │
│  - Health checks              │  - CORS configuration          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Node.js/Express Server       │  WebSocket Server (Socket.io)  │
│  - REST API endpoints         │  - Real-time chat              │
│  - Authentication middleware  │  - Session management          │
│  - Request validation         │  - Connection handling         │
│  - Error handling             │  - Message broadcasting        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Personality Service          │  AI Coaching Service            │
│  - Astrological calculations  │  - OpenAI GPT-4 integration    │
│  - Psychological mapping      │  - Context management          │
│  - Insight generation         │  - Response personalization    │
│  - Accuracy validation        │  - Conversation flow           │
├─────────────────────────────────────────────────────────────────┤
│  User Service                 │  Progress Tracking Service     │
│  - Profile management         │  - Goal setting                │
│  - Authentication             │  - Milestone tracking          │
│  - Session management         │  - Analytics collection        │
│  - Privacy controls           │  - Report generation           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database          │  Redis Cache                    │
│  - User profiles              │  - Session storage             │
│  - Conversation history       │  - Personality insights cache  │
│  - Personality insights       │  - Rate limiting data          │
│  - Progress tracking          │  - Temporary data storage      │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Frontend Architecture (React/Next.js)

### Component Hierarchy
```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserMenu
│   │   └── NotificationBell
│   ├── Main
│   │   └── [Page Components]
│   └── Footer
├── Pages
│   ├── LandingPage
│   ├── AuthPages
│   │   ├── LoginPage
│   │   └── RegisterPage
│   ├── OnboardingPages
│   │   ├── PersonalityBlueprintPage
│   │   ├── InitialInsightsPage
│   │   └── GoalSettingPage
│   ├── DashboardPage
│   ├── CoachingPages
│   │   ├── CoachingSessionPage
│   │   └── SessionHistoryPage
│   └── ProfilePage
└── Shared Components
    ├── Forms
    │   ├── InputField
    │   ├── DatePicker
    │   ├── LocationPicker
    │   └── FormValidation
    ├── UI Elements
    │   ├── Button
    │   ├── Card
    │   ├── Modal
    │   ├── LoadingSpinner
    │   └── ProgressBar
    └── Chat Components
        ├── ChatInterface
        ├── MessageBubble
        ├── TypingIndicator
        └── MessageInput
```

### State Management Architecture
```typescript
// Redux Store Structure
interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
  };
  personality: {
    profile: PersonalityProfile | null;
    insights: PersonalityInsight[];
    accuracyRatings: Record<string, number>;
    loading: boolean;
  };
  coaching: {
    currentSession: CoachingSession | null;
    conversationHistory: Message[];
    sessionHistory: CoachingSession[];
    isConnected: boolean;
    typing: boolean;
  };
  progress: {
    goals: Goal[];
    milestones: Milestone[];
    currentProgress: ProgressData;
    analytics: AnalyticsData;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    notifications: Notification[];
    loading: Record<string, boolean>;
  };
}
```

## 3. Backend Architecture (Node.js/Express)

### Service Layer Design
```typescript
// Service Architecture
interface ServiceLayer {
  UserService: {
    register(userData: RegisterData): Promise<User>;
    authenticate(credentials: LoginData): Promise<AuthResult>;
    updateProfile(userId: string, updates: ProfileUpdates): Promise<User>;
    deleteAccount(userId: string): Promise<void>;
  };
  
  PersonalityService: {
    generateProfile(birthData: BirthData): Promise<PersonalityProfile>;
    getInsights(userId: string): Promise<PersonalityInsight[]>;
    validateInsight(insightId: string, rating: number): Promise<void>;
    refineProfile(userId: string, feedback: Feedback[]): Promise<PersonalityProfile>;
  };
  
  CoachingService: {
    startSession(userId: string, type: SessionType): Promise<CoachingSession>;
    processMessage(sessionId: string, message: string): Promise<CoachingResponse>;
    endSession(sessionId: string, rating?: number): Promise<SessionSummary>;
    getSessionHistory(userId: string): Promise<CoachingSession[]>;
  };
  
  ProgressService: {
    setGoals(userId: string, goals: Goal[]): Promise<void>;
    updateProgress(userId: string, progressData: ProgressUpdate): Promise<ProgressStatus>;
    getMilestones(userId: string): Promise<Milestone[]>;
    generateReport(userId: string, period: TimePeriod): Promise<ProgressReport>;
  };
}
```

### API Route Structure
```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh
│   └── GET /verify
├── /user
│   ├── GET /profile
│   ├── PUT /profile
│   ├── POST /personality-blueprint
│   ├── GET /personality-insights
│   └── DELETE /account
├── /coaching
│   ├── POST /sessions
│   ├── GET /sessions
│   ├── GET /sessions/:id
│   ├── POST /sessions/:id/messages
│   ├── PUT /sessions/:id/end
│   └── POST /sessions/:id/rate
├── /progress
│   ├── GET /goals
│   ├── POST /goals
│   ├── PUT /goals/:id
│   ├── GET /milestones
│   ├── POST /progress
│   └── GET /reports
└── /admin
    ├── GET /analytics
    ├── GET /users
    └── GET /system-health
```

## 4. Database Architecture

### Entity Relationship Diagram
```
Users ||--o{ Conversations : has
Users ||--o{ PersonalityInsights : has
Users ||--o{ ProgressTracking : has
Conversations ||--o{ Messages : contains
PersonalityInsights }o--|| InsightCategories : belongs_to
ProgressTracking ||--o{ Milestones : contains

Users:
- user_id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- birth_date (DATE)
- birth_time (TIME)
- birth_location (VARCHAR)
- personality_profile (JSONB)
- coaching_goals (TEXT[])
- onboarding_completed (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Conversations:
- conversation_id (UUID, PK)
- user_id (UUID, FK)
- session_type (VARCHAR)
- status (VARCHAR)
- duration_minutes (INTEGER)
- satisfaction_rating (INTEGER)
- created_at (TIMESTAMP)
- ended_at (TIMESTAMP)

Messages:
- message_id (UUID, PK)
- conversation_id (UUID, FK)
- sender_type (VARCHAR) -- 'user' | 'coach'
- content (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)

PersonalityInsights:
- insight_id (UUID, PK)
- user_id (UUID, FK)
- category (VARCHAR)
- astrological_basis (JSONB)
- coaching_language (TEXT)
- accuracy_rating (INTEGER)
- disclosed_at (TIMESTAMP)
- created_at (TIMESTAMP)

ProgressTracking:
- tracking_id (UUID, PK)
- user_id (UUID, FK)
- goal_category (VARCHAR)
- current_progress (JSONB)
- milestones (JSONB)
- personality_aligned_metrics (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Database Optimization Strategy
```sql
-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_personality_insights_user_id ON personality_insights(user_id);
CREATE INDEX idx_progress_tracking_user_id ON progress_tracking(user_id);

-- Partial indexes for active sessions
CREATE INDEX idx_active_conversations ON conversations(user_id, created_at) 
WHERE status = 'active';

-- Composite indexes for common queries
CREATE INDEX idx_user_insights_category ON personality_insights(user_id, category);
CREATE INDEX idx_user_progress_goal ON progress_tracking(user_id, goal_category);
```

## 5. Security Architecture

### Authentication & Authorization Flow
```
1. User Registration/Login
   ├── Password hashing (bcrypt, salt rounds: 12)
   ├── JWT token generation (RS256 algorithm)
   ├── Refresh token storage (Redis, 7-day expiry)
   └── Session management

2. Request Authentication
   ├── JWT token validation
   ├── Token expiry check
   ├── User authorization verification
   └── Rate limiting enforcement

3. Data Protection
   ├── Input validation & sanitization
   ├── SQL injection prevention (parameterized queries)
   ├── XSS protection (Content Security Policy)
   └── CSRF protection (SameSite cookies)

4. Privacy Controls
   ├── Birth data encryption (AES-256)
   ├── PII data masking in logs
   ├── GDPR compliance features
   └── Data retention policies
```

### Security Middleware Stack
```typescript
// Security middleware configuration
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https://api.openai.com"]
      }
    }
  }),
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  }),
  express.json({ limit: '10mb' }),
  express.urlencoded({ extended: true, limit: '10mb' })
];
```

## 6. Real-time Communication Architecture

### WebSocket Connection Management
```typescript
// Socket.io server configuration
interface SocketServer {
  namespaces: {
    '/coaching': {
      middleware: [authenticateSocket, validateSession];
      events: {
        'join_session': (sessionId: string) => void;
        'send_message': (message: MessageData) => void;
        'typing_start': () => void;
        'typing_stop': () => void;
        'leave_session': () => void;
      };
    };
  };
  
  rooms: {
    [sessionId: string]: {
      users: SocketUser[];
      metadata: SessionMetadata;
    };
  };
}

// Message flow architecture
const messageFlow = {
  userMessage: [
    'validate_input',
    'save_to_database',
    'generate_ai_response',
    'personalize_response',
    'broadcast_to_room',
    'update_conversation_state'
  ],
  
  aiResponse: [
    'apply_personality_filter',
    'check_content_safety',
    'add_coaching_context',
    'format_for_display',
    'send_to_client',
    'log_interaction'
  ]
};
```

## 7. AI Integration Architecture

### OpenAI GPT-4 Integration
```typescript
interface AICoachingService {
  contextBuilder: {
    buildPersonalityContext(profile: PersonalityProfile): string;
    buildConversationContext(history: Message[]): string;
    buildCoachingContext(goals: Goal[], session: CoachingSession): string;
  };
  
  responseGenerator: {
    generateResponse(context: CoachingContext): Promise<string>;
    personalizeResponse(response: string, personality: PersonalityProfile): string;
    validateResponse(response: string): boolean;
  };
  
  qualityControl: {
    checkContentSafety(content: string): Promise<boolean>;
    validateCoachingQuality(response: string): Promise<QualityScore>;
    ensurePersonalization(response: string, personality: PersonalityProfile): boolean;
  };
}

// AI prompt engineering architecture
const promptTemplates = {
  sessionStart: `You are an expert executive coach working with {userName}. 
    Based on their personality profile: {personalityInsights}
    Their coaching goals: {coachingGoals}
    Communication style: {communicationStyle}
    
    Provide empathetic, insightful coaching that demonstrates deep understanding 
    of their unique patterns and challenges.`,
    
  conversationContinuation: `Continue the coaching conversation with {userName}.
    Previous context: {conversationHistory}
    Current message: {currentMessage}
    
    Respond in a way that shows you understand their {personalityType} patterns
    and helps them progress toward their goals: {currentGoals}`,
    
  ahaDelivery: `Deliver an "aha moment" for {userName} focused on {momentType}.
    Their personality shows: {keyInsights}
    
    Present this insight in a way that feels personally revelatory and 
    immediately applicable to their situation.`
};
```

## 8. Deployment Architecture

### Container Architecture
```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Infrastructure as Code
```yaml
# docker-compose.yml for development
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend
      
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agenticcounsel
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
      
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=agenticcounsel
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 9. Monitoring and Observability

### Application Monitoring Stack
```typescript
interface MonitoringArchitecture {
  logging: {
    application: 'Winston + structured JSON logs';
    access: 'Morgan HTTP request logging';
    error: 'Sentry error tracking';
    audit: 'Custom audit trail for sensitive operations';
  };
  
  metrics: {
    performance: 'Response times, throughput, error rates';
    business: 'User engagement, session completion, aha moments';
    infrastructure: 'CPU, memory, database connections';
    ai: 'OpenAI API usage, response quality scores';
  };
  
  alerting: {
    critical: 'System down, database connection lost';
    warning: 'High error rate, slow response times';
    info: 'Deployment completed, scheduled maintenance';
  };
  
  dashboards: {
    operational: 'System health, performance metrics';
    business: 'User engagement, conversion funnels';
    development: 'Code quality, deployment frequency';
  };
}
```

This architecture provides a robust, scalable foundation for the Agentic Counsel MVP while maintaining flexibility for future enhancements and growth.