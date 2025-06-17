import { Pool, PoolClient } from 'pg';
import { DatabaseConfig } from '@/types';
import { DatabaseSetup } from '../database/setup';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;
  private config: DatabaseConfig;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  static getInstance(config?: DatabaseConfig): DatabaseService {
    if (!DatabaseService.instance) {
      if (!config) {
        throw new Error('DatabaseService config is required for first initialization');
      }
      DatabaseService.instance = new DatabaseService(config);
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('Database connection established successfully');
      
      // Run database migrations
      await this.runMigrations();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      const databaseSetup = new DatabaseSetup(this.config);
      await databaseSetup.initialize();
      await databaseSetup.close();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Failed to run database migrations:', error);
      throw error;
    }
  }

  // Helper methods for common operations
  async findUserByEmail(email: string): Promise<any> {
    const result = await this.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async findUserById(userId: string): Promise<any> {
    const result = await this.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    return result.rows[0];
  }

  async createUser(userData: any): Promise<any> {
    const {
      email,
      password_hash,
      first_name,
      last_name,
      birth_date,
      birth_time,
      birth_location,
      personality_profile,
      coaching_goals
    } = userData;

    const result = await this.query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, birth_date, 
        birth_time, birth_location, personality_profile, coaching_goals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      email, password_hash, first_name, last_name, birth_date,
      birth_time, birth_location, personality_profile, coaching_goals
    ]);

    return result.rows[0];
  }

  async updateUser(userId: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await this.query(`
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `, [userId, ...values]);

    return result.rows[0];
  }

  async createConversation(conversationData: any): Promise<any> {
    const { user_id, session_type, title } = conversationData;
    
    const result = await this.query(`
      INSERT INTO coaching_conversations (user_id, session_type, title)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [user_id, session_type, title || 'New Coaching Session']);

    return result.rows[0];
  }

  async addMessage(messageData: any): Promise<any> {
    const { conversation_id, sender_type, content, metadata } = messageData;
    
    const result = await this.query(`
      INSERT INTO coaching_messages (conversation_id, sender_type, content, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [conversation_id, sender_type, content, metadata]);

    return result.rows[0];
  }

  async getConversationHistory(conversationId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM coaching_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `, [conversationId]);

    return result.rows;
  }

  async createPersonalityInsight(insightData: any): Promise<any> {
    const {
      user_id,
      category,
      astrological_basis,
      coaching_language,
      accuracy_rating
    } = insightData;

    const result = await this.query(`
      INSERT INTO personality_insights (
        user_id, category, astrological_basis, coaching_language, accuracy_rating
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user_id, category, astrological_basis, coaching_language, accuracy_rating]);

    return result.rows[0];
  }

  async getUserInsights(userId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM personality_insights 
      WHERE user_id = $1 
      ORDER BY created_at ASC
    `, [userId]);

    return result.rows;
  }

  // Progress tracking methods
  async createProgressTracking(progressData: any): Promise<any> {
    const {
      user_id,
      goal_category,
      milestone_type,
      current_progress,
      target_progress,
      current_progress_data,
      milestones,
      personality_aligned_metrics
    } = progressData;

    const result = await this.query(`
      INSERT INTO progress_tracking (
        user_id, goal_category, milestone_type, current_progress, target_progress,
        current_progress_data, milestones, personality_aligned_metrics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      user_id, goal_category, milestone_type, current_progress, target_progress,
      current_progress_data, milestones, personality_aligned_metrics
    ]);

    return result.rows[0];
  }

  async getUserProgress(userId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM progress_tracking
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows;
  }

  async updateProgress(progressId: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await this.query(`
      UPDATE progress_tracking
      SET ${setClause}, updated_at = NOW()
      WHERE progress_id = $1
      RETURNING *
    `, [progressId, ...values]);

    return result.rows[0];
  }

  // Conversation management methods
  async getUserConversations(userId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM coaching_conversations
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows;
  }

  async updateConversation(conversationId: string, updates: any): Promise<any> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await this.query(`
      UPDATE coaching_conversations
      SET ${setClause}, updated_at = NOW()
      WHERE conversation_id = $1
      RETURNING *
    `, [conversationId, ...values]);

    return result.rows[0];
  }
}