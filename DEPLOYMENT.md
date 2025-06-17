# Deployment Guide

This guide covers production deployment of the Agentic Counsel frontend application, including environment configuration, build optimization, and security considerations.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Build Optimization](#build-optimization)
- [Deployment Options](#deployment-options)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)
- [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code review completed
- [ ] Security audit completed (`npm run cf:review`)

### Environment Setup
- [ ] Production environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured (if applicable)
- [ ] Monitoring tools configured

### Performance
- [ ] Bundle size optimized
- [ ] Images compressed and optimized
- [ ] Lazy loading implemented
- [ ] Caching strategies configured
- [ ] Performance testing completed

### Security
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] API endpoints secured
- [ ] Authentication flow tested
- [ ] CORS policies configured

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file with the following variables:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com

# Authentication
NEXTAUTH_SECRET=your-super-secure-secret-here
NEXTAUTH_URL=https://your-domain.com

# Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# CDN and Assets
NEXT_PUBLIC_CDN_URL=https://cdn.your-domain.com
NEXT_PUBLIC_ASSETS_URL=https://assets.your-domain.com
```

### Backend Environment Variables

Ensure your backend has these production variables:

```env
# Database
DATABASE_URL=postgresql://user:password@prod-db-host:5432/agentic_counsel
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://prod-redis-host:6379
REDIS_TLS=true

# Security
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# API
PORT=3001
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-backend-sentry-dsn
```

## Build Optimization

### Next.js Configuration

Update `next.config.ts` for production:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // Compression
  compress: true,

  // Image optimization
  images: {
    domains: ['your-domain.com', 'cdn.your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
};

module.exports = nextConfig;
```

### Build Commands

```bash
# Install production dependencies only
npm ci --only=production

# Build the application
npm run build

# Analyze bundle size
ANALYZE=true npm run build

# Start production server
npm start
```

## Deployment Options

### 1. Vercel Deployment (Recommended)

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**vercel.json configuration:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_WS_URL": "@ws-url",
    "NEXTAUTH_SECRET": "@nextauth-secret"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 2. Docker Deployment

**Dockerfile:**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com
      - NEXT_PUBLIC_WS_URL=wss://api.your-domain.com
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    # Backend service configuration
    ports:
      - "3001:3001"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### 3. AWS Deployment

**Using AWS Amplify:**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

**Using AWS ECS with Fargate:**
```json
{
  "family": "agentic-counsel-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/agentic-counsel-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.your-domain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agentic-counsel-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Security Considerations

### Content Security Policy

Add to `next.config.ts`:

```typescript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-analytics.com;
  child-src *.youtube.com *.google.com *.vimeo.com;
  style-src 'self' 'unsafe-inline' *.googleapis.com;
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
  font-src 'self' *.googleapis.com *.gstatic.com;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];
```

### Environment Security

- Use environment-specific secrets management
- Rotate JWT secrets regularly
- Implement proper CORS policies
- Use HTTPS everywhere
- Enable security headers
- Implement rate limiting
- Use secure session management

### API Security

```typescript
// API client security configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true, // Include cookies for CSRF protection
});

// Request interceptor for security
apiClient.interceptors.request.use((config) => {
  // Add CSRF token if available
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  return config;
});
```

## Performance Optimization

### Bundle Optimization

```bash
# Analyze bundle size
npm run build
npm run analyze

# Key optimizations:
# 1. Code splitting
# 2. Tree shaking
# 3. Dynamic imports
# 4. Image optimization
# 5. Font optimization
```

### Caching Strategy

```typescript
// next.config.ts
module.exports = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Database Optimization

- Use connection pooling
- Implement query optimization
- Add proper indexes
- Use read replicas for scaling
- Implement caching layers (Redis)

## Monitoring and Logging

### Error Tracking with Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: false,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/your-domain\.com/,
      ],
    }),
  ],
});
```

### Performance Monitoring

```typescript
// lib/analytics.ts
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path: url,
    });
  }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

### Health Checks

```typescript
// pages/api/health.ts
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  };

  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
}
```

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Docker Rollback

```bash
# Tag current version
docker tag current-image:latest current-image:backup

# Pull previous version
docker pull your-registry/app:previous-tag

# Update and restart
docker-compose up -d
```

### Database Rollback

```bash
# Backup current state
pg_dump -h localhost -U username -d agentic_counsel > backup_$(date +%Y%m%d_%H%M%S).sql

# Rollback migration
npm run db:rollback

# Restore from backup if needed
psql -h localhost -U username -d agentic_counsel < backup_file.sql
```

## Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Monitoring configured

### During Deployment
- [ ] Maintenance mode enabled (if applicable)
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Smoke tests completed
- [ ] Monitoring alerts configured

### Post-Deployment
- [ ] Application accessible
- [ ] All features working
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team notified
- [ ] Maintenance mode disabled

## Troubleshooting

### Common Deployment Issues

**Build failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Environment variable issues:**
```bash
# Verify environment variables
printenv | grep NEXT_PUBLIC
```

**Database connection issues:**
```bash
# Test database connection
npm run db:test-connection
```

**Performance issues:**
```bash
# Analyze bundle
npm run analyze

# Check memory usage
node --inspect server.js
```

For additional support, refer to the [troubleshooting section in README.md](./README.md#troubleshooting) or contact the development team.