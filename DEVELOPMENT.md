# Development Guide

This guide covers the development workflow for the Agentic Counsel frontend application, including claude-flow integration, component development, testing procedures, and debugging techniques.

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Claude-Flow Development Workflow](#claude-flow-development-workflow)
- [Available NPM Scripts](#available-npm-scripts)
- [Component Development Guidelines](#component-development-guidelines)
- [Testing and Debugging](#testing-and-debugging)
- [Code Quality and Standards](#code-quality-and-standards)
- [Git Workflow](#git-workflow)
- [Performance Optimization](#performance-optimization)

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (or yarn/pnpm)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions
- **PostgreSQL**: For backend database
- **Redis**: For session management (optional)

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Initial Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd agentic-counsel
   cd agentic-counsel/frontend/frontend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start Development Servers**:
   ```bash
   # Terminal 1 - Backend
   cd ../../backend
   npm run dev

   # Terminal 2 - Frontend
   cd ../agentic-counsel/frontend/frontend
   npm run dev
   ```

## Claude-Flow Development Workflow

### Overview

Claude-Flow provides 17 specialized modes and 4 comprehensive workflows to streamline development:

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
1. **Component Generation**: Complete component lifecycle
2. **Feature Development**: End-to-end feature implementation
3. **Code Review**: Quality, security, and performance audit
4. **Deployment Preparation**: Production readiness

### Using Claude-Flow

#### 1. Component Generation Workflow

```bash
# Generate a new component with full setup
npm run cf:component UserProfile "User profile display component with avatar and details"

# This creates:
# - src/components/UserProfile.tsx
# - src/components/__tests__/UserProfile.test.tsx
# - Documentation and type definitions
```

**Generated Component Structure**:
```typescript
// src/components/UserProfile.tsx
'use client';

import React from 'react';
import { User } from '@/types';

interface UserProfileProps {
  user: User;
  showDetails?: boolean;
  onEdit?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  showDetails = true, 
  onEdit 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Component implementation */}
    </div>
  );
};

export default UserProfile;
```

#### 2. Feature Development Workflow

```bash
# Complete feature development
npm run cf:feature "Chat History" "Display and manage coaching conversation history with search and filtering"

# This executes:
# 1. Requirements analysis
# 2. Architecture design
# 3. API interface design
# 4. Implementation
# 5. Testing
# 6. Security review
# 7. Integration testing
# 8. Documentation
```

#### 3. Code Review Workflow

```bash
# Comprehensive code review
npm run cf:review src/components/CoachingCard.tsx

# Reviews:
# - Security vulnerabilities
# - Performance issues
# - Accessibility compliance
# - Code quality
# - Documentation completeness
```

#### 4. Custom Workflows

```bash
# Execute specific workflow
npm run cf:workflow feature-development "Shopping Cart Feature"

# Available workflows:
# - component-generation
# - feature-development
# - code-review
# - deployment-prep
```

### Claude-Flow Configuration

The `claude-flow.config.json` file defines the development environment:

```json
{
  "name": "agentic-counsel-frontend",
  "framework": "next.js",
  "language": "typescript",
  "sparc": {
    "enabled": true,
    "modes": ["architect", "code", "tdd", "security-review", ...]
  },
  "workflows": {
    "component-generation": {
      "description": "Automated React component generation",
      "steps": [
        "architect: Design component structure",
        "code: Implement component",
        "tdd: Create tests",
        "documentation: Add documentation"
      ]
    }
  }
}
```

## Available NPM Scripts

### Development Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix

# Type checking
npm run type-check
```

### Claude-Flow Scripts

```bash
# Main orchestrator
npm run claude-flow
npm run cf

# Workflow management
npm run cf:status          # Show current status
npm run cf:list            # List available workflows and modes
npm run cf:workflow        # Execute custom workflow
npm run cf:feature         # Feature development workflow
npm run cf:review          # Code review workflow
npm run cf:deploy          # Deployment preparation

# Component generation
npm run cf:component       # Generate new component
```

### Testing Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- UserProfile.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Utility Scripts

```bash
# Clean build artifacts
npm run clean

# Analyze bundle size
npm run analyze

# Generate types from API
npm run generate-types

# Database operations (backend)
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Component Development Guidelines

### Component Structure

```typescript
// Standard component template
'use client'; // For client components

import React, { useState, useEffect } from 'react';
import { ComponentProps } from '@/types';

interface MyComponentProps {
  // Required props
  title: string;
  data: ComponentProps[];
  
  // Optional props with defaults
  showHeader?: boolean;
  variant?: 'primary' | 'secondary';
  
  // Event handlers
  onSelect?: (item: ComponentProps) => void;
  onError?: (error: Error) => void;
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  data,
  showHeader = true,
  variant = 'primary',
  onSelect,
  onError
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    // Component logic
  }, [data]);

  // Event handlers
  const handleSelect = (item: ComponentProps) => {
    try {
      onSelect?.(item);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`component-container ${variant}`}>
      {showHeader && (
        <header className="component-header">
          <h2 className="text-lg font-semibold">{title}</h2>
        </header>
      )}
      
      <main className="component-content">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => handleSelect(item)}
            className="cursor-pointer hover:bg-gray-50 p-2 rounded"
          >
            {item.name}
          </div>
        ))}
      </main>
    </div>
  );
};

export default MyComponent;
```

### Component Best Practices

1. **Props Interface**: Always define TypeScript interfaces for props
2. **Default Values**: Use default parameters for optional props
3. **Error Handling**: Implement proper error boundaries and states
4. **Loading States**: Show loading indicators for async operations
5. **Accessibility**: Include ARIA labels and keyboard navigation
6. **Performance**: Use React.memo for expensive components
7. **Testing**: Write comprehensive tests for all component states

### Custom Hooks

```typescript
// hooks/useCoachingSession.ts
import { useState, useEffect } from 'react';
import { CoachingSession } from '@/types';
import apiClient from '@/lib/api';

export const useCoachingSession = (sessionId: string) => {
  const [session, setSession] = useState<CoachingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCoachingConversation(sessionId);
        if (response.success) {
          setSession(response.data.conversation);
        } else {
          setError(response.error?.message || 'Failed to fetch session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const updateSession = (updates: Partial<CoachingSession>) => {
    if (session) {
      setSession({ ...session, ...updates });
    }
  };

  return {
    session,
    loading,
    error,
    updateSession,
    refetch: () => fetchSession()
  };
};
```

## Testing and Debugging

### Testing Strategy

#### Unit Tests with Jest and React Testing Library

```typescript
// __tests__/CoachingCard.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoachingCard } from '@/components/CoachingCard';
import { CoachingSession } from '@/types';

const mockSession: CoachingSession = {
  conversation_id: '123',
  user_id: 'user-1',
  session_type: 'coaching_conversation',
  status: 'active',
  created_at: new Date(),
};

describe('CoachingCard', () => {
  it('renders session information correctly', () => {
    render(<CoachingCard session={mockSession} />);
    
    expect(screen.getByText('Coaching Conversation')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles session start action', async () => {
    const mockOnStart = jest.fn();
    render(
      <CoachingCard 
        session={mockSession} 
        onStartSession={mockOnStart} 
      />
    );
    
    const startButton = screen.getByText('Continue Session');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockOnStart).toHaveBeenCalledWith('coaching_conversation');
    });
  });

  it('displays error state correctly', () => {
    const errorSession = { ...mockSession, status: 'error' as any };
    render(<CoachingCard session={errorSession} />);
    
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
```

#### Integration Tests

```typescript
// __tests__/integration/coaching-flow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CoachingPage } from '@/app/coaching/[id]/page';
import { server } from '../mocks/server';

// Mock API responses
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Coaching Flow Integration', () => {
  it('completes full coaching session flow', async () => {
    render(
      <AuthProvider>
        <CoachingPage params={{ id: 'test-session' }} />
      </AuthProvider>
    );

    // Wait for session to load
    await waitFor(() => {
      expect(screen.getByText('Coaching Session')).toBeInTheDocument();
    });

    // Send a message
    const messageInput = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(messageInput, { target: { value: 'Hello coach' } });
    fireEvent.click(screen.getByText('Send'));

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText('Hello coach')).toBeInTheDocument();
    });
  });
});
```

### Debugging Techniques

#### 1. React Developer Tools

```typescript
// Add debug information to components
const MyComponent = ({ data }) => {
  // Debug logging
  console.log('MyComponent render:', { data });
  
  // React DevTools profiling
  React.useEffect(() => {
    console.log('MyComponent mounted');
    return () => console.log('MyComponent unmounted');
  }, []);

  return <div>{/* component content */}</div>;
};
```

#### 2. API Debugging

```typescript
// lib/api.ts - Enhanced debugging
class ApiClient {
  constructor() {
    this.client.interceptors.request.use(
      (config) => {
        console.log('API Request:', {
          method: config.method,
          url: config.url,
          data: config.data,
          headers: config.headers
        });
        return config;
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', {
          status: response.status,
          data: response.data,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        console.error('API Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }
}
```

#### 3. WebSocket Debugging

```typescript
// lib/socket.ts - Debug WebSocket events
class SocketService {
  connect(token?: string): void {
    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Debug all events
    this.socket.onAny((event, ...args) => {
      console.log('WebSocket Event:', event, args);
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });
  }
}
```

#### 4. Performance Debugging

```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Measure Core Web Vitals
getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);

// Component performance
const MyComponent = React.memo(({ data }) => {
  const renderStart = performance.now();
  
  React.useEffect(() => {
    const renderEnd = performance.now();
    console.log(`MyComponent render time: ${renderEnd - renderStart}ms`);
  });

  return <div>{/* component content */}</div>;
});
```

### Debugging Tools

#### Browser DevTools

```javascript
// Console debugging helpers
window.debugApp = {
  // Clear all localStorage
  clearStorage: () => localStorage.clear(),
  
  // Get current user
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  
  // Get auth token
  getToken: () => localStorage.getItem('auth_token'),
  
  // Force re-render
  forceUpdate: () => window.location.reload(),
  
  // API client access
  api: apiClient
};
```

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

## Code Quality and Standards

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Git Workflow

### Branch Strategy

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch for features

# Feature branches
feature/user-authentication
feature/coaching-interface
feature/progress-tracking

# Release branches
release/v1.0.0
release/v1.1.0

# Hotfix branches
hotfix/critical-bug-fix
```

### Commit Convention

```bash
# Format: type(scope): description

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting, missing semicolons, etc.
refactor: # Code change that neither fixes a bug nor adds a feature
test:     # Adding missing tests
chore:    # Updating grunt tasks etc; no production code change

# Examples:
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(coaching): resolve WebSocket connection issues"
git commit -m "docs(api): update API integration documentation"
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npm run analyze

# Key metrics to monitor:
# - First Contentful Paint (FCP)
# - Largest Contentful Paint (LCP)
# - Cumulative Layout Shift (CLS)
# - First Input Delay (FID)
```

### Code Splitting

```typescript
// Dynamic imports for code splitting
const CoachingInterface = dynamic(
  () => import('@/components/CoachingInterface'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// Route-based splitting
const ProgressPage = dynamic(() => import('@/app/progress/page'));
```

### Image Optimization

```typescript
// next/image optimization
import Image from 'next/image';

const ProfileImage = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    width={100}
    height={100}
    priority={false}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);
```

### Caching Strategies

```typescript
// API response caching
const useCoachingData = (sessionId: string) => {
  return useSWR(
    `/api/coaching/${sessionId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // 30 seconds
    }
  );
};
```

This development guide provides comprehensive coverage of the development workflow, from initial setup through advanced debugging and optimization techniques. Use claude-flow commands to streamline your development process and maintain high code quality standards.