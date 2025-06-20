import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

import { AppConfig } from './types';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import coachingRoutes from './routes/coaching';
import progressRoutes from './routes/progress';
import astrologyRoutes from './routes/astrology';
import userEnhancementRoutes from './routes/user-enhancement';

// Import services
import { DatabaseService } from './services/database';
import { RedisService } from './services/redis';
import { SocketService } from './services/socket';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agentic-counsel-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Application configuration
const config: AppConfig = {
  port: parseInt(process.env['PORT'] || '3001'),
  jwt_secret: process.env['JWT_SECRET'] || 'your-secret-key',
  jwt_expires_in: process.env['JWT_EXPIRES_IN'] || '1h',
  refresh_token_expires_in: process.env['REFRESH_TOKEN_EXPIRES_IN'] || '7d',
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    database: process.env['DB_NAME'] || 'agenticcounsel',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
    ssl: process.env['DB_SSL'] === 'true'
  },
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0')
  },
  openai: {
    api_key: process.env['OPENAI_API_KEY'] || '',
    model: process.env['OPENAI_MODEL'] || 'gpt-4',
    max_tokens: parseInt(process.env['OPENAI_MAX_TOKENS'] || '1000'),
    temperature: parseFloat(process.env['OPENAI_TEMPERATURE'] || '0.7')
  },
  cors_origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  rate_limit: {
    window_ms: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    max_requests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100')
  }
};

class AgenticCounselServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private databaseService: DatabaseService;
  private redisService: RedisService;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors_origin,
        methods: ['GET', 'POST']
      }
    });

    this.databaseService = DatabaseService.getInstance(config.database);
    this.redisService = RedisService.getInstance(config.redis);
    this.socketService = new SocketService(this.io);
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:"]
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors_origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rate_limit.window_ms,
      max: config.rate_limit.max_requests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.'
        },
        timestamp: new Date()
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          version: process.env['npm_package_version'] || '1.0.0'
        }
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/user', authMiddleware, userRoutes);
    this.app.use('/api/coaching', authMiddleware, coachingRoutes);
    this.app.use('/api/progress', authMiddleware, progressRoutes);
    this.app.use('/api/astrology', authMiddleware, astrologyRoutes);
    this.app.use('/api/user-enhancement', authMiddleware, userEnhancementRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.'
        },
        timestamp: new Date()
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  private async initializeServices(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.connect();
      logger.info('Database service initialized');

      // Initialize Redis connection
      await this.redisService.connect();
      logger.info('Redis service initialized');
      
      // Initialize socket service
      this.socketService.initialize();
      logger.info('Socket service initialized');

    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Close server
      this.server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connection
          await this.databaseService.disconnect();
          logger.info('Database connection closed');

          // Close Redis connection
          await this.redisService.disconnect();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public async start(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();

      // Setup middleware and routes
      this.setupMiddleware();
      this.setupRoutes();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`Agentic Counsel server started on port ${config.port}`);
        logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
        logger.info(`CORS origin: ${config.cors_origin}`);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
if (require.main === module) {
  const server = new AgenticCounselServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default AgenticCounselServer;