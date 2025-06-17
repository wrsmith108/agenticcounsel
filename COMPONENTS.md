# Component Library Documentation

This guide provides comprehensive documentation for all reusable components in the Agentic Counsel frontend application, including usage examples, props interfaces, and best practices.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Core Components](#core-components)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Form Components](#form-components)
- [Data Visualization Components](#data-visualization-components)
- [Utility Components](#utility-components)
- [Component Development Guidelines](#component-development-guidelines)
- [Testing Components](#testing-components)

## Component Architecture

### Design Principles

1. **Reusability**: Components are designed to be reused across different parts of the application
2. **Composability**: Components can be combined to create more complex UI patterns
3. **Accessibility**: All components follow WCAG guidelines and include proper ARIA attributes
4. **Type Safety**: Full TypeScript support with comprehensive prop interfaces
5. **Performance**: Optimized for performance with proper memoization and lazy loading
6. **Consistency**: Consistent design system using Tailwind CSS classes

### Component Structure

```typescript
// Standard component template
'use client'; // For client components

import React from 'react';
import { ComponentProps } from '@/types';

interface MyComponentProps {
  // Required props
  title: string;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  
  // Event handlers
  onClick?: () => void;
  
  // Children and composition
  children?: React.ReactNode;
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  onClick,
  children
}) => {
  return (
    <div className={`component-base ${variant} ${size}`}>
      {/* Component implementation */}
    </div>
  );
};

export default MyComponent;
```

## Core Components

### CoachingCard

A comprehensive card component for displaying coaching session information with interactive elements.

#### Props Interface

```typescript
interface CoachingCardProps {
  session: CoachingSession;
  showActions?: boolean;
  compact?: boolean;
  onStartSession?: (sessionType: string) => void;
}
```

#### Usage Examples

```typescript
// Full coaching card with actions
<CoachingCard 
  session={coachingSession}
  showActions={true}
  onStartSession={(type) => handleStartSession(type)}
/>

// Compact version for lists
<CoachingCard 
  session={coachingSession}
  compact={true}
  showActions={false}
/>
```

#### Features

- **Session Type Icons**: Dynamic icons based on session type (coaching, progress review, goal setting, etc.)
- **Status Indicators**: Visual status badges (active, completed, cancelled)
- **Interactive Actions**: Continue session, view session, start similar session
- **Responsive Design**: Adapts to different screen sizes
- **Accessibility**: Full keyboard navigation and screen reader support

#### Styling Variants

```typescript
// Session type colors
const sessionColors = {
  'coaching_conversation': 'text-purple-600 bg-purple-50',
  'progress_review': 'text-green-600 bg-green-50',
  'goal_setting': 'text-blue-600 bg-blue-50',
  'action_planning': 'text-orange-600 bg-orange-50',
  'initial_insights': 'text-indigo-600 bg-indigo-50'
};
```

### PersonalityDisplay

A sophisticated component for displaying user personality profiles with astrological and psychological insights.

#### Props Interface

```typescript
interface PersonalityDisplayProps {
  profile: PersonalityProfile;
  compact?: boolean;
}
```

#### Usage Examples

```typescript
// Full personality profile display
<PersonalityDisplay profile={userPersonalityProfile} />

// Compact version for dashboard
<PersonalityDisplay 
  profile={userPersonalityProfile} 
  compact={true} 
/>
```

#### Features

- **Primary Type Display**: Prominent display of personality type with description
- **Key Traits**: Visual trait badges with icons and colors
- **Strengths & Growth Areas**: Organized lists with appropriate icons
- **Coaching Recommendations**: Actionable insights for coaching sessions
- **Confidence Score**: Visual indicator of profile accuracy
- **Responsive Layout**: Adapts content based on available space

#### Trait Icons and Colors

```typescript
const traitMapping = {
  'leadership': { icon: Users, color: 'text-blue-600 bg-blue-50' },
  'creativity': { icon: Lightbulb, color: 'text-purple-600 bg-purple-50' },
  'analytical': { icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  'goal-oriented': { icon: Target, color: 'text-orange-600 bg-orange-50' }
};
```

## UI Components

### LoadingSpinner

A versatile loading component with multiple variants and skeleton loading patterns.

#### Props Interface

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'branded';
}
```

#### Usage Examples

```typescript
// Basic spinner
<LoadingSpinner />

// Large spinner with text
<LoadingSpinner 
  size="lg" 
  text="Loading your coaching session..." 
/>

// Full screen loading overlay
<LoadingSpinner 
  size="xl" 
  text="Preparing your dashboard..." 
  fullScreen={true}
  variant="branded"
/>

// Skeleton loading for cards
<SkeletonCard />

// Skeleton loading for lists
<SkeletonList count={5} />

// Skeleton loading for charts
<SkeletonChart />

// Loading button
<LoadingButton loading={isSubmitting}>
  Save Changes
</LoadingButton>
```

#### Skeleton Components

```typescript
// Available skeleton components
<SkeletonCard />        // Card-like loading placeholder
<SkeletonList />        // List item loading placeholders
<SkeletonChart />       // Chart loading placeholder
<SkeletonStats />       // Statistics grid loading placeholder
```

#### Page Loader Wrapper

```typescript
<PageLoader loading={isLoading}>
  <YourPageContent />
</PageLoader>
```

### ErrorBoundary

A comprehensive error handling component with development and production modes.

#### Props Interface

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
```

#### Usage Examples

```typescript
// Wrap entire application
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Wrap specific components with custom fallback
<ErrorBoundary fallback={<CustomErrorUI />}>
  <RiskyComponent />
</ErrorBoundary>

// Higher-order component usage
const SafeComponent = withErrorBoundary(MyComponent);

// Hook for error handling in functional components
const handleError = useErrorHandler();
```

#### Features

- **Development Mode**: Shows detailed error information and component stack
- **Production Mode**: User-friendly error message with recovery options
- **Recovery Actions**: Try again, reload page, go home
- **Error Logging**: Automatic error reporting to console and external services
- **Custom Fallbacks**: Support for custom error UI components

## Data Visualization Components

### ProgressCharts

A comprehensive charting component using Recharts for progress visualization.

#### Props Interface

```typescript
interface ProgressChartsProps {
  progressData?: ProgressData[];
  categoryData?: CategoryData[];
  timeRange?: string;
  showTrend?: boolean;
}

interface ProgressData {
  date: string;
  progress: number;
  goal?: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}
```

#### Usage Examples

```typescript
// Progress over time chart
<ProgressCharts 
  progressData={progressHistory}
  timeRange="month"
  showTrend={true}
/>

// Category distribution charts
<ProgressCharts 
  categoryData={categoryProgress}
  showTrend={false}
/>

// Combined progress visualization
<ProgressCharts 
  progressData={progressHistory}
  categoryData={categoryProgress}
  timeRange="quarter"
/>
```

#### Chart Types

1. **Line Chart**: Progress over time with trend analysis
2. **Pie Chart**: Category distribution with interactive tooltips
3. **Bar Chart**: Category comparison with responsive design
4. **Combined Views**: Multiple chart types in coordinated layouts

#### Features

- **Responsive Design**: Charts adapt to container size
- **Interactive Tooltips**: Detailed information on hover
- **Custom Styling**: Consistent color scheme and typography
- **Empty States**: Graceful handling of missing data
- **Accessibility**: Screen reader compatible with proper labels

#### Color Palette

```typescript
const CHART_COLORS = [
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6'  // Blue
];
```

## Layout Components

### Navigation Components

#### Header Navigation

```typescript
interface HeaderProps {
  user?: User;
  onLogout?: () => void;
  showNotifications?: boolean;
}

<Header 
  user={currentUser}
  onLogout={handleLogout}
  showNotifications={true}
/>
```

#### Sidebar Navigation

```typescript
interface SidebarProps {
  currentPath: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

<Sidebar 
  currentPath="/dashboard"
  collapsed={isSidebarCollapsed}
  onToggle={toggleSidebar}
/>
```

### Layout Wrappers

#### Dashboard Layout

```typescript
<DashboardLayout>
  <DashboardContent />
</DashboardLayout>
```

#### Auth Layout

```typescript
<AuthLayout title="Sign In">
  <LoginForm />
</AuthLayout>
```

## Form Components

### Input Components

#### TextInput

```typescript
interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password';
}

<TextInput
  label="Email Address"
  value={email}
  onChange={setEmail}
  error={emailError}
  type="email"
  required
/>
```

#### SelectInput

```typescript
interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

<SelectInput
  label="Session Type"
  value={sessionType}
  onChange={setSessionType}
  options={sessionTypeOptions}
  placeholder="Choose a session type"
/>
```

#### DateInput

```typescript
<DateInput
  label="Birth Date"
  value={birthDate}
  onChange={setBirthDate}
  error={birthDateError}
  required
/>
```

### Form Validation

#### Form Wrapper

```typescript
<FormWrapper onSubmit={handleSubmit} validation={validationSchema}>
  <TextInput name="email" label="Email" />
  <TextInput name="password" label="Password" type="password" />
  <SubmitButton loading={isSubmitting}>
    Sign In
  </SubmitButton>
</FormWrapper>
```

## Utility Components

### Modal Components

#### Modal

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

<Modal
  isOpen={isModalOpen}
  onClose={closeModal}
  title="Confirm Action"
  size="md"
>
  <ModalContent />
</Modal>
```

#### ConfirmDialog

```typescript
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleConfirm}
  title="Delete Session"
  message="Are you sure you want to delete this coaching session?"
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
/>
```

### Notification Components

#### Toast

```typescript
// Toast hook usage
const { showToast } = useToast();

showToast({
  type: 'success',
  title: 'Session Started',
  message: 'Your coaching session has begun successfully.',
  duration: 5000
});

// Toast types: 'success', 'error', 'warning', 'info'
```

#### Alert

```typescript
<Alert
  type="warning"
  title="Session Ending Soon"
  message="Your coaching session will end in 5 minutes."
  onDismiss={dismissAlert}
  actions={[
    { label: 'Extend Session', onClick: extendSession },
    { label: 'End Now', onClick: endSession }
  ]}
/>
```

### Data Display Components

#### StatCard

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

<StatCard
  title="Total Sessions"
  value={totalSessions}
  change={12}
  trend="up"
  icon={<MessageCircle />}
/>
```

#### InfoCard

```typescript
<InfoCard
  title="Next Session"
  subtitle="Goal Setting Session"
  content="Scheduled for tomorrow at 2:00 PM"
  actions={[
    { label: 'Reschedule', onClick: reschedule },
    { label: 'Cancel', onClick: cancel }
  ]}
/>
```

## Component Development Guidelines

### Best Practices

#### 1. Component Structure

```typescript
// ✅ Good: Clear prop interface
interface ComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

// ❌ Bad: Unclear prop types
interface ComponentProps {
  data: any;
  config: object;
}
```

#### 2. Default Props

```typescript
// ✅ Good: Use default parameters
const MyComponent: React.FC<Props> = ({
  variant = 'primary',
  size = 'md',
  disabled = false
}) => {
  // Component logic
};

// ❌ Bad: Use defaultProps (deprecated in function components)
MyComponent.defaultProps = {
  variant: 'primary'
};
```

#### 3. Event Handling

```typescript
// ✅ Good: Specific event handlers
interface Props {
  onSubmit?: (data: FormData) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

// ❌ Bad: Generic event handlers
interface Props {
  onAction?: (type: string, data: any) => void;
}
```

#### 4. Conditional Rendering

```typescript
// ✅ Good: Clear conditional logic
{showHeader && (
  <Header title={title} />
)}

{error ? (
  <ErrorMessage error={error} />
) : (
  <Content data={data} />
)}

// ❌ Bad: Complex nested conditionals
{showHeader ? (
  error ? (
    <ErrorHeader />
  ) : (
    <Header />
  )
) : null}
```

#### 5. Accessibility

```typescript
// ✅ Good: Proper accessibility attributes
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={onClose}
>
  <X className="h-4 w-4" />
</button>

// ❌ Bad: Missing accessibility
<button onClick={onClose}>
  <X />
</button>
```

### Performance Optimization

#### 1. React.memo

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  // Expensive rendering logic
  return <ComplexVisualization data={data} />;
});

// Custom comparison function
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id && 
         prevProps.lastUpdated === nextProps.lastUpdated;
});
```

#### 2. useMemo and useCallback

```typescript
const MyComponent: React.FC<Props> = ({ data, onSelect }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => processItem(item));
  }, [data]);

  // Memoize event handlers
  const handleSelect = useCallback((item: Item) => {
    onSelect?.(item);
  }, [onSelect]);

  return (
    <List data={processedData} onSelect={handleSelect} />
  );
};
```

#### 3. Lazy Loading

```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

const Dashboard = () => (
  <Suspense fallback={<SkeletonChart />}>
    <HeavyChart data={chartData} />
  </Suspense>
);
```

### Styling Guidelines

#### 1. Tailwind CSS Classes

```typescript
// ✅ Good: Semantic class grouping
const buttonClasses = [
  // Layout
  'flex items-center justify-center',
  // Spacing
  'px-4 py-2',
  // Typography
  'text-sm font-medium',
  // Colors
  'bg-purple-600 text-white',
  // States
  'hover:bg-purple-700 focus:ring-2 focus:ring-purple-500',
  // Transitions
  'transition-colors duration-200'
].join(' ');
```

#### 2. Dynamic Classes

```typescript
// ✅ Good: Clear conditional classes
const getButtonClasses = (variant: string, size: string) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors';
  
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
};
```

## Testing Components

### Unit Testing

#### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CoachingCard } from '@/components/CoachingCard';

describe('CoachingCard', () => {
  const mockSession = {
    conversation_id: '123',
    session_type: 'coaching_conversation',
    status: 'active',
    created_at: new Date()
  };

  it('renders session information correctly', () => {
    render(<CoachingCard session={mockSession} />);
    
    expect(screen.getByText('Coaching Conversation')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnStart = jest.fn();
    render(
      <CoachingCard 
        session={mockSession} 
        onStartSession={mockOnStart} 
      />
    );
    
    fireEvent.click(screen.getByText('Continue Session'));
    expect(mockOnStart).toHaveBeenCalledWith('coaching_conversation');
  });
});
```

#### Testing with Context

```typescript
import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthenticatedComponent', () => {
  it('renders when user is authenticated', () => {
    renderWithAuth(<AuthenticatedComponent />);
    // Test assertions
  });
});
```

### Visual Testing

#### Storybook Stories

```typescript
// CoachingCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { CoachingCard } from './CoachingCard';

const meta: Meta<typeof CoachingCard> = {
  title: 'Components/CoachingCard',
  component: CoachingCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    session: {
      conversation_id: '123',
      session_type: 'coaching_conversation',
      status: 'active',
      created_at: new Date()
    },
    showActions: true
  },
};

export const Completed: Story = {
  args: {
    ...Active.args,
    session: {
      ...Active.args.session,
      status: 'completed',
      ended_at: new Date()
    }
  },
};

export const Compact: Story = {
  args: {
    ...Active.args,
    compact: true,
    showActions: false
  },
};
```

### Accessibility Testing

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Component Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Component Templates

### Claude-Flow Component Generation

The project includes automated component generation using claude-flow:

```bash
# Generate a new component
npm run cf:component ComponentName "Component description"
```

#### Component Template

```typescript
// templates/components/component.template.tsx
'use client';

import React from 'react';

interface {{ComponentName}}Props {
  // Define props here
}

const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({
  // Destructure props here
}) => {
  return (
    <div className="{{component-name}}">
      {/* Component implementation */}
    </div>
  );
};

export default {{ComponentName}};
```

#### Test Template

```typescript
// templates/components/test.template.tsx
import { render, screen } from '@testing-library/react';
import { {{ComponentName}} } from './{{ComponentName}}';

describe('{{ComponentName}}', () => {
  it('renders correctly', () => {
    render(<{{ComponentName}} />);
    // Add test assertions
  });
});
```

This comprehensive component library documentation provides everything needed to understand, use, and extend the Agentic Counsel frontend components. Each component is designed with reusability, accessibility, and performance in mind, following modern React and TypeScript best practices.