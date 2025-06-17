# API Integration Guide

This guide provides comprehensive documentation for integrating with the Agentic Counsel backend API, including endpoint specifications, WebSocket integration, authentication flows, and error handling patterns.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [API Client Configuration](#api-client-configuration)
- [Endpoint Documentation](#endpoint-documentation)
- [WebSocket Integration](#websocket-integration)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing API Integration](#testing-api-integration)

## API Overview

### Base Configuration

- **Base URL**: `http://localhost:3001` (development) / `https://api.your-domain.com` (production)
- **WebSocket URL**: `ws://localhost:3001` (development) / `wss://api.your-domain.com` (production)
- **API Version**: v1
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer tokens

### Response Format

All API responses follow a consistent structure:

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  errors?: ValidationError[];
  timestamp?: Date;
}
```

## Authentication

### JWT Token Flow

The application uses JWT tokens for authentication with automatic refresh capabilities.

#### Token Structure

```typescript
interface AuthResult {
  user: User;
  token: string;
  expires_in: string;
}
```

#### Authentication Flow

```typescript
// 1. Login
const loginResponse = await apiClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// 2. Token is automatically stored and used for subsequent requests
// 3. Token refresh happens automatically when needed
// 4. Logout clears token and session
await apiClient.logout();
```

### Protected Routes

The frontend uses middleware to protect routes that require authentication:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/coaching/:path*', '/progress/:path*']
};
```

## API Client Configuration

### Client Setup

```typescript
// lib/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token expiration
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### Environment Configuration

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=10000
```

## Endpoint Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request:**
```typescript
interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  birth_date: string;
  birth_time?: string;
  birth_location: string;
}
```

**Response:**
```typescript
interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_in: string;
  };
}
```

**Example:**
```typescript
const response = await apiClient.register({
  email: 'john@example.com',
  password: 'securePassword123',
  first_name: 'John',
  last_name: 'Doe',
  birth_date: '1990-01-15',
  birth_time: '14:30',
  birth_location: 'New York, NY'
});
```

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Request:**
```typescript
interface LoginData {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_in: string;
  };
}
```

**Example:**
```typescript
const response = await apiClient.login({
  email: 'john@example.com',
  password: 'securePassword123'
});
```

#### POST /api/auth/refresh

Refresh expired JWT token.

**Request:** No body required (uses existing token)

**Response:**
```typescript
interface RefreshResponse {
  success: boolean;
  data: {
    token: string;
    expires_in: string;
  };
}
```

#### GET /api/auth/verify

Verify current token validity.

**Response:**
```typescript
interface VerifyResponse {
  success: boolean;
  data: {
    user: User;
  };
}
```

#### POST /api/auth/logout

Logout user and invalidate token.

**Response:**
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

### User Management Endpoints

#### GET /api/user/profile

Get current user profile.

**Response:**
```typescript
interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}
```

#### PUT /api/user/profile

Update user profile information.

**Request:**
```typescript
interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  coaching_goals?: string[];
}
```

**Response:**
```typescript
interface UpdateProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}
```

#### POST /api/user/onboarding

Complete user onboarding process.

**Request:**
```typescript
interface OnboardingData {
  coaching_goals: string[];
  personality_insights_reviewed: boolean;
  initial_session_preferences?: {
    preferred_session_types: string[];
    communication_style: string;
    goal_priorities: string[];
  };
}
```

**Response:**
```typescript
interface OnboardingResponse {
  success: boolean;
  data: {
    user: User;
  };
}
```

#### GET /api/user/personality

Get user's personality profile and insights.

**Response:**
```typescript
interface PersonalityResponse {
  success: boolean;
  data: {
    personality_profile: PersonalityProfile;
    insights: PersonalityInsight[];
  };
}
```

### Coaching Endpoints

#### POST /api/coaching/start-session

Start a new coaching session.

**Request:**
```typescript
interface StartSessionData {
  session_type: 'initial_insights' | 'goal_setting' | 'coaching_conversation' | 'progress_review' | 'action_planning';
  initial_message?: string;
}
```

**Response:**
```typescript
interface StartSessionResponse {
  success: boolean;
  data: {
    conversation: CoachingSession;
    messages?: Message[];
    initial_response?: {
      message: Message;
      coaching_metadata: any;
    };
  };
}
```

**Example:**
```typescript
const response = await apiClient.startCoachingSession({
  session_type: 'coaching_conversation',
  initial_message: 'I want to work on my leadership skills'
});
```

#### GET /api/coaching/conversations

Get user's coaching conversations with pagination.

**Query Parameters:**
- `limit`: Number of conversations to return (default: 20)
- `offset`: Number of conversations to skip (default: 0)
- `status`: Filter by session status ('active', 'completed', 'cancelled')

**Response:**
```typescript
interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: CoachingSession[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
}
```

**Example:**
```typescript
const response = await apiClient.getCoachingConversations(10, 0);
```

#### GET /api/coaching/conversations/:id

Get specific coaching conversation with messages.

**Response:**
```typescript
interface ConversationResponse {
  success: boolean;
  data: {
    conversation: CoachingSession;
    messages: Message[];
  };
}
```

#### POST /api/coaching/conversations/:id/messages

Send a message in a coaching conversation.

**Request:**
```typescript
interface SendMessageData {
  content: string;
  metadata?: {
    message_type?: string;
    context?: any;
  };
}
```

**Response:**
```typescript
interface SendMessageResponse {
  success: boolean;
  data: {
    user_message: Message;
    coach_response: Message;
    coaching_metadata?: {
      personality_context: string;
      coaching_technique: string;
      aha_moment_type?: string;
    };
  };
}
```

**Example:**
```typescript
const response = await apiClient.sendMessage('conversation-id', {
  content: 'How can I improve my communication with my team?',
  metadata: {
    message_type: 'question',
    context: { topic: 'leadership' }
  }
});
```

#### GET /api/coaching/conversations/:id/messages

Get messages for a specific conversation.

**Query Parameters:**
- `limit`: Number of messages to return (default: 50)
- `offset`: Number of messages to skip (default: 0)

**Response:**
```typescript
interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
}
```

#### POST /api/coaching/conversations/:id/end

End a coaching session.

**Response:**
```typescript
interface EndSessionResponse {
  success: boolean;
  data: {
    conversation: CoachingSession;
    session_summary?: {
      duration_minutes: number;
      key_insights: string[];
      action_items: string[];
      next_steps: string[];
    };
  };
}
```

### Progress Tracking Endpoints

#### GET /api/progress/overview

Get user's progress overview and statistics.

**Response:**
```typescript
interface ProgressOverviewResponse {
  success: boolean;
  data: ProgressOverview;
}

interface ProgressOverview {
  total_goals: number;
  average_progress: number;
  completed_milestones: number;
  total_milestones: number;
  milestone_completion_rate: number;
  recent_activity: ActivityItem[];
  progress_by_category: CategoryProgress[];
}
```

#### GET /api/progress/goals

Get goal progress with optional category filtering.

**Query Parameters:**
- `category`: Filter by goal category (optional)

**Response:**
```typescript
interface GoalProgressResponse {
  success: boolean;
  data: {
    coaching_goals: string[];
    progress_records: ProgressTracking[];
    filtered_by_category: string | null;
  };
}
```

#### POST /api/progress/milestone

Record a new milestone achievement.

**Request:**
```typescript
interface MilestoneData {
  title: string;
  description: string;
  goal_category: string;
  target_date?: string;
  metadata?: {
    difficulty_level?: number;
    related_sessions?: string[];
    notes?: string;
  };
}
```

**Response:**
```typescript
interface MilestoneResponse {
  success: boolean;
  data: {
    milestone: Milestone;
    achievement: Achievement;
    goal_category: string;
    progress_update: {
      previous_percentage: number;
      new_percentage: number;
      improvement: number;
    };
  };
}
```

#### GET /api/progress/insights

Get personalized progress insights and recommendations.

**Response:**
```typescript
interface ProgressInsightsResponse {
  success: boolean;
  data: {
    insights: ProgressInsight[];
    recommendations: ProgressRecommendation[];
    progress_summary: {
      overall_trend: 'improving' | 'stable' | 'declining';
      strongest_areas: string[];
      growth_opportunities: string[];
      recent_achievements: Achievement[];
    };
  };
}
```

#### GET /api/progress/history

Get historical progress data for visualization.

**Query Parameters:**
- `timeRange`: Time range for data ('week', 'month', 'quarter', 'year')

**Response:**
```typescript
interface ProgressHistoryResponse {
  success: boolean;
  data: ProgressEntry[];
}
```

### Health Check Endpoint

#### GET /health

Check API server health status.

**Response:**
```typescript
interface HealthResponse {
  success: boolean;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    version: string;
    uptime: number;
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}
```

## WebSocket Integration

### Connection Setup

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string): void {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    this.socket = io(wsUrl, {
      auth: {
        token: token || localStorage.getItem('auth_token')
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }
}
```

### Real-time Coaching Events

#### Join Conversation

```typescript
// Join a coaching conversation room
socketService.joinConversation(conversationId);

// Event: 'join_conversation'
// Payload: { conversationId: string }
```

#### Send Message

```typescript
// Send real-time message
socketService.sendMessage(conversationId, content, metadata);

// Event: 'send_message'
// Payload: { conversationId: string, content: string, metadata?: any }
```

#### Listen for Messages

```typescript
// Listen for new messages
socketService.onMessage((message: Message) => {
  console.log('New message:', message);
  // Update UI with new message
});

// Event: 'new_message'
// Payload: Message
```

#### Coach Response

```typescript
// Listen for coach responses
socketService.onCoachResponse((message: Message) => {
  console.log('Coach response:', message);
  // Update UI with coach response
});

// Event: 'coach_response'
// Payload: Message with coaching metadata
```

#### Typing Indicators

```typescript
// Send typing indicator
socketService.sendTyping(conversationId, true);

// Listen for typing indicators
socketService.onTyping((data) => {
  console.log('Typing status:', data);
  // Show/hide typing indicator
});

// Event: 'typing'
// Payload: { conversationId: string, isTyping: boolean, sender: string }
```

#### Conversation Updates

```typescript
// Listen for conversation status changes
socketService.onConversationUpdate((data) => {
  console.log('Conversation updated:', data);
  // Update conversation status in UI
});

// Event: 'conversation_update'
// Payload: { conversationId: string, status: string, metadata?: any }
```

### WebSocket Error Handling

```typescript
class SocketService {
  connect(token?: string): void {
    // ... connection setup

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      
      // Handle specific error types
      switch (error.type) {
        case 'authentication_failed':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'rate_limit_exceeded':
          // Show rate limit message
          this.showRateLimitMessage();
          break;
        default:
          // Generic error handling
          this.showErrorMessage('Connection error occurred');
      }
    });
  }

  private reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Exponential backoff reconnection
    setTimeout(() => {
      this.connect();
    }, this.getReconnectDelay());
  }
}
```

## Error Handling

### Error Types

```typescript
interface APIError {
  code: string;
  message: string;
  details?: any;
}

// Common error codes:
// - VALIDATION_ERROR: Request validation failed
// - AUTHENTICATION_ERROR: Authentication required or failed
// - AUTHORIZATION_ERROR: Insufficient permissions
// - NOT_FOUND: Resource not found
// - RATE_LIMIT_EXCEEDED: Too many requests
// - INTERNAL_ERROR: Server error
// - DATABASE_ERROR: Database operation failed
// - EXTERNAL_SERVICE_ERROR: Third-party service error
```

### Error Handling Patterns

#### API Client Error Handling

```typescript
class ApiClient {
  async makeRequest<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.request<APIResponse<T>>(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as APIResponse;
        
        // Log error for debugging
        console.error('API Error:', {
          url: config.url,
          method: config.method,
          status: error.response?.status,
          error: apiError?.error
        });

        // Return structured error response
        return {
          success: false,
          error: apiError?.error || {
            code: 'NETWORK_ERROR',
            message: 'Network request failed'
          }
        };
      }

      // Handle non-Axios errors
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }
}
```

#### Component Error Handling

```typescript
const CoachingInterface = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.sendMessage(conversationId, { content });
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send message');
      }

      // Handle success
      handleMessageSent(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Log error for monitoring
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 text-red-600 hover:text-red-800"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    // Component JSX
  );
};
```

#### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
    
    // Send error to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Rate Limiting

### Client-side Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { count: number; window: number }> = new Map();

  constructor() {
    // Define rate limits for different endpoints
    this.limits.set('/api/coaching/conversations/*/messages', { count: 10, window: 60000 }); // 10 per minute
    this.limits.set('/api/auth/login', { count: 5, window: 300000 }); // 5 per 5 minutes
  }

  canMakeRequest(endpoint: string): boolean {
    const limit = this.limits.get(endpoint);
    if (!limit) return true;

    const now = Date.now();
    const requests = this.requests.get(endpoint) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.window);
    
    if (validRequests.length >= limit.count) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(endpoint, validRequests);
    
    return true;
  }
}
```

### Handling Rate Limit Responses

```typescript
// API client interceptor for rate limiting
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
      
      // Show rate limit message to user
      this.showRateLimitMessage(waitTime);
      
      // Optionally retry after wait time
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.client.request(error.config);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Testing API Integration

### Mock API Responses

```typescript
// __tests__/mocks/api.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'mock-jwt-token',
          expires_in: '24h'
        }
      })
    );
  }),

  rest.get('/api/coaching/conversations', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          conversations: [
            {
              conversation_id: '1',
              session_type: 'coaching_conversation',
              status: 'active',
              created_at: new Date().toISOString()
            }
          ],
          pagination: { total: 1, limit: 20, offset: 0, has_more: false }
        }
      })
    );
  }),

  rest.post('/api/coaching/conversations/:id/messages', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          user_message: {
            message_id: '1',
            content: 'Test message',
            sender_type: 'user',
            created_at: new Date().toISOString()
          },
          coach_response: {
            message_id: '2',
            content: 'Coach response',
            sender_type: 'coach',
            created_at: new Date().toISOString()
          }
        }
      })
    );
  })
];

export const server = setupServer(...handlers);
```

### Integration Tests

```typescript
// __tests__/api/coaching.test.ts
import { server } from '../mocks/api';
import apiClient from '@/lib/api';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Coaching API Integration', () => {
  it('should start a coaching session', async () => {
    const response = await apiClient.startCoachingSession({
      session_type: 'coaching_conversation',
      initial_message: 'Hello coach'
    });

    expect(response.success).toBe(true);
    expect(response.data.conversation).toBeDefined();
  });

  it('should send and receive messages', async () => {
    const response = await apiClient.sendMessage('conversation-1', {
      content: 'Test message'
    });

    expect(response.success).toBe(true);
    expect(response.data.user_message.content).toBe('Test message');
    expect(response.data.coach_response).toBeDefined();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.post('/api/coaching/start-session', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid session type'
            }
          })
        );
      })
    );

    const response = await apiClient.startCoachingSession({
      session_type: 'invalid_type' as any
    });

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('VALIDATION_ERROR');
  });
});
```

### WebSocket Testing

```typescript
// __tests__/socket/coaching.test.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';

describe('WebSocket Integration', () => {
  let server: Server;
  let clientSocket: any;

  beforeAll((done) => {
    const httpServer = createServer();
    server = new Server(httpServer);
    
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = Client(`http://localhost:${port}`);
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  it('should join conversation room', (done) => {
    clientSocket.emit('join_conversation', { conversationId: 'test-123' });
    
    server.on('connection', (socket) => {
      socket.on('join_conversation', (data) => {
        expect(data.conversationId).toBe('test-123');
        done();
      });
    });
  });

  it('should receive real-time messages', (done) => {
    clientSocket.on('new_message', (message) => {
      expect(message.content).toBe('Test message');
      done();
    });

    // Simulate server sending message
    server.emit('new_message', {
      message_id: '1',
      content: 'Test message',
      sender_type: 'coach'
    });
  });
});
```

This comprehensive API integration guide provides all the necessary information for working with the Agentic Counsel backend API, including detailed endpoint documentation, WebSocket integration, error handling patterns, and testing strategies.