import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '@/types';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/redis.log' })
  ]
});

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;
  private config: RedisConfig;

  private constructor(config: RedisConfig) {
    this.config = config;
    
    const redisUrl = `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}/${config.db || 0}`;
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    // Handle Redis events
    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
    });
  }

  static getInstance(config?: RedisConfig): RedisService {
    if (!RedisService.instance) {
      if (!config) {
        throw new Error('RedisService config is required for first initialization');
      }
      RedisService.instance = new RedisService(config);
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      throw error;
    }
  }

  // Session management
  async setSession(sessionId: string, sessionData: any, expirationSeconds: number = 3600): Promise<void> {
    try {
      await this.client.setEx(`session:${sessionId}`, expirationSeconds, JSON.stringify(sessionData));
    } catch (error) {
      logger.error('Error setting session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    try {
      const sessionData = await this.client.get(`session:${sessionId}`);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.client.del(`session:${sessionId}`);
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }

  // User session management (aliases for session methods used in auth routes)
  async setUserSession(userId: string, sessionData: any, expirationSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
    console.log('🔄 REDIS: Setting user session:', {
      userId,
      expirationSeconds,
      sessionData: { ...sessionData, login_time: sessionData.login_time?.toISOString() }
    });
    
    // Set session expiration to 7 days to match JWT token expiration
    const sevenDaysInSeconds = 7 * 24 * 60 * 60; // 604800 seconds
    const actualExpiration = expirationSeconds === 3600 ? sevenDaysInSeconds : expirationSeconds;
    
    if (expirationSeconds === 3600) {
      console.log('⚠️  REDIS: Adjusting session expiration from 1 hour to 7 days to match JWT token expiration');
    }
    
    console.log('✅ REDIS: Session will expire in', actualExpiration, 'seconds (', Math.round(actualExpiration / (24 * 60 * 60)), 'days)');
    
    return this.setSession(userId, sessionData, actualExpiration);
  }

  async getUserSession(userId: string): Promise<any | null> {
    console.log('🔍 REDIS: Getting user session for:', userId);
    const session = await this.getSession(userId);
    console.log('📋 REDIS: Session result:', session ? 'FOUND' : 'NOT_FOUND', session ? { expires_at: session.expires_at } : null);
    return session;
  }

  async deleteUserSession(userId: string): Promise<void> {
    console.log('🗑️  REDIS: Deleting user session for:', userId);
    return this.deleteSession(userId);
  }

  // Refresh token management
  async setRefreshToken(userId: string, token: string, expirationSeconds: number = 604800): Promise<void> {
    try {
      await this.client.setEx(`refresh_token:${userId}`, expirationSeconds, token);
    } catch (error) {
      logger.error('Error setting refresh token:', error);
      throw error;
    }
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    try {
      return await this.client.get(`refresh_token:${userId}`);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      throw error;
    }
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    try {
      await this.client.del(`refresh_token:${userId}`);
    } catch (error) {
      logger.error('Error deleting refresh token:', error);
      throw error;
    }
  }

  // Personality insights caching
  async cachePersonalityInsights(userId: string, insights: any[], expirationSeconds: number = 1800): Promise<void> {
    try {
      await this.client.setEx(`personality:${userId}`, expirationSeconds, JSON.stringify(insights));
    } catch (error) {
      logger.error('Error caching personality insights:', error);
      throw error;
    }
  }

  async getCachedPersonalityInsights(userId: string): Promise<any[] | null> {
    try {
      const insights = await this.client.get(`personality:${userId}`);
      return insights ? JSON.parse(insights) : null;
    } catch (error) {
      logger.error('Error getting cached personality insights:', error);
      throw error;
    }
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.client.incr(`rate_limit:${key}`);
      
      if (current === 1) {
        await this.client.expire(`rate_limit:${key}`, windowSeconds);
      }

      const ttl = await this.client.ttl(`rate_limit:${key}`);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      throw error;
    }
  }

  // Conversation state management
  async setConversationState(conversationId: string, state: any, expirationSeconds: number = 7200): Promise<void> {
    try {
      await this.client.setEx(`conversation:${conversationId}`, expirationSeconds, JSON.stringify(state));
    } catch (error) {
      logger.error('Error setting conversation state:', error);
      throw error;
    }
  }

  async getConversationState(conversationId: string): Promise<any | null> {
    try {
      const state = await this.client.get(`conversation:${conversationId}`);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      logger.error('Error getting conversation state:', error);
      throw error;
    }
  }

  async deleteConversationState(conversationId: string): Promise<void> {
    try {
      await this.client.del(`conversation:${conversationId}`);
    } catch (error) {
      logger.error('Error deleting conversation state:', error);
      throw error;
    }
  }

  // Generic cache operations
  async set(key: string, value: any, expirationSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (expirationSeconds) {
        await this.client.setEx(key, expirationSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Error setting cache value:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Error getting cache value:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Error deleting cache value:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking key existence:', error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Error setting key expiration:', error);
      throw error;
    }
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.client.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Error publishing message:', error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const subscriber = this.client.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Error parsing subscribed message:', error);
        }
      });
    } catch (error) {
      logger.error('Error subscribing to channel:', error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis ping failed:', error);
      throw error;
    }
  }

  // Get client info
  async getInfo(): Promise<any> {
    try {
      const info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Error getting Redis info:', error);
      throw error;
    }
  }
}