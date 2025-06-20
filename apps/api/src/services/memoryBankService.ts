import { Pool } from 'pg';
import {
  UserMemoryBank,
  MemoryPattern,
  MemoryInsight,
  MemoryContext,
  MemoryEmbedding,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  CreatePatternRequest,
  CreateInsightRequest,
  CreateContextRequest,
  MemorySearchQuery,
  MemorySearchResult,
  PatternAnalysisResult,
  MemoryBankSummary,
  MemoryBankConfig,
  MemoryAnalytics
} from '../types/memoryBank.js';
// import { logger } from '../utils/logger.js';
// Temporary logger implementation until we have the actual logger
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args)
};

export class MemoryBankService {
  private db: Pool;
  private config: MemoryBankConfig;

  constructor(db: Pool, config: MemoryBankConfig) {
    this.db = db;
    this.config = config;
  }

  // Core Memory Operations
  async createMemory(userId: string, request: CreateMemoryRequest): Promise<UserMemoryBank> {
    const client = await this.db.connect();
    try {
      const query = `
        INSERT INTO user_memory_bank (
          user_id, memory_type, category, content, confidence_score, importance_score
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userId,
        request.memory_type,
        request.category,
        JSON.stringify(request.content),
        request.confidence_score || 0.7,
        request.importance_score || 0.5
      ];

      const result = await client.query(query, values);
      const memory = this.mapRowToMemory(result.rows[0]);

      // Generate embedding for semantic search
      await this.generateEmbedding(memory.memory_id, request.content);

      logger.info(`Created memory ${memory.memory_id} for user ${userId}`);
      return memory;
    } catch (error) {
      logger.error('Error creating memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateMemory(memoryId: string, request: UpdateMemoryRequest): Promise<UserMemoryBank> {
    const client = await this.db.connect();
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (request.content !== undefined) {
        setParts.push(`content = $${paramIndex++}`);
        values.push(JSON.stringify(request.content));
      }
      if (request.confidence_score !== undefined) {
        setParts.push(`confidence_score = $${paramIndex++}`);
        values.push(request.confidence_score);
      }
      if (request.importance_score !== undefined) {
        setParts.push(`importance_score = $${paramIndex++}`);
        values.push(request.importance_score);
      }
      if (request.category !== undefined) {
        setParts.push(`category = $${paramIndex++}`);
        values.push(request.category);
      }

      setParts.push(`updated_at = NOW()`);
      values.push(memoryId);

      const query = `
        UPDATE user_memory_bank 
        SET ${setParts.join(', ')}
        WHERE memory_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      if (result.rows.length === 0) {
        throw new Error(`Memory ${memoryId} not found`);
      }

      const memory = this.mapRowToMemory(result.rows[0]);

      // Regenerate embedding if content changed
      if (request.content !== undefined) {
        await this.generateEmbedding(memory.memory_id, request.content);
      }

      return memory;
    } catch (error) {
      logger.error('Error updating memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getMemory(memoryId: string): Promise<UserMemoryBank | null> {
    const client = await this.db.connect();
    try {
      const query = `
        UPDATE user_memory_bank 
        SET last_referenced = NOW() 
        WHERE memory_id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [memoryId]);
      return result.rows.length > 0 ? this.mapRowToMemory(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error getting memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserMemories(userId: string, limit = 50, offset = 0): Promise<UserMemoryBank[]> {
    const client = await this.db.connect();
    try {
      const query = `
        SELECT * FROM user_memory_bank 
        WHERE user_id = $1 
        ORDER BY importance_score DESC, last_referenced DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await client.query(query, [userId, limit, offset]);
      return result.rows.map(row => this.mapRowToMemory(row));
    } catch (error) {
      logger.error('Error getting user memories:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    const client = await this.db.connect();
    try {
      const query = 'DELETE FROM user_memory_bank WHERE memory_id = $1';
      const result = await client.query(query, [memoryId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting memory:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Pattern Operations
  async createPattern(userId: string, request: CreatePatternRequest): Promise<MemoryPattern> {
    const client = await this.db.connect();
    try {
      const query = `
        INSERT INTO memory_patterns (
          user_id, pattern_type, pattern_data, strength_score
        ) VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const values = [
        userId,
        request.pattern_type,
        JSON.stringify(request.pattern_data),
        request.strength_score || 0.5
      ];

      const result = await client.query(query, values);
      const pattern = this.mapRowToPattern(result.rows[0]);

      logger.info(`Created pattern ${pattern.pattern_id} for user ${userId}`);
      return pattern;
    } catch (error) {
      logger.error('Error creating pattern:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePatternStrength(patternId: string, strengthDelta: number): Promise<MemoryPattern> {
    const client = await this.db.connect();
    try {
      const query = `
        UPDATE memory_patterns 
        SET 
          strength_score = LEAST(1.0, GREATEST(0.0, strength_score + $2)),
          frequency_count = frequency_count + 1,
          updated_at = NOW()
        WHERE pattern_id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [patternId, strengthDelta]);
      if (result.rows.length === 0) {
        throw new Error(`Pattern ${patternId} not found`);
      }

      return this.mapRowToPattern(result.rows[0]);
    } catch (error) {
      logger.error('Error updating pattern strength:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserPatterns(userId: string): Promise<MemoryPattern[]> {
    const client = await this.db.connect();
    try {
      const query = `
        SELECT * FROM memory_patterns 
        WHERE user_id = $1 
        ORDER BY strength_score DESC, frequency_count DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => this.mapRowToPattern(row));
    } catch (error) {
      logger.error('Error getting user patterns:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Insight Operations
  async createInsight(userId: string, request: CreateInsightRequest): Promise<MemoryInsight> {
    const client = await this.db.connect();
    try {
      const query = `
        INSERT INTO memory_insights (
          user_id, insight_type, title, description, conversation_id, impact_score, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        userId,
        request.insight_type,
        request.title,
        request.description,
        request.conversation_id || null,
        request.impact_score || 0.5,
        request.tags || []
      ];

      const result = await client.query(query, values);
      const insight = this.mapRowToInsight(result.rows[0]);

      logger.info(`Created insight ${insight.insight_id} for user ${userId}`);
      return insight;
    } catch (error) {
      logger.error('Error creating insight:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserInsights(userId: string, limit = 20): Promise<MemoryInsight[]> {
    const client = await this.db.connect();
    try {
      const query = `
        SELECT * FROM memory_insights 
        WHERE user_id = $1 
        ORDER BY impact_score DESC, created_at DESC
        LIMIT $2
      `;
      
      const result = await client.query(query, [userId, limit]);
      return result.rows.map(row => this.mapRowToInsight(row));
    } catch (error) {
      logger.error('Error getting user insights:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Context Operations
  async createContext(userId: string, request: CreateContextRequest): Promise<MemoryContext> {
    const client = await this.db.connect();
    try {
      const query = `
        INSERT INTO memory_context (
          user_id, context_type, title, context_data, related_conversations, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const values = [
        userId,
        request.context_type,
        request.title || null,
        JSON.stringify(request.context_data),
        request.related_conversations || [],
        request.expires_at || null
      ];

      const result = await client.query(query, values);
      const context = this.mapRowToContext(result.rows[0]);

      logger.info(`Created context ${context.context_id} for user ${userId}`);
      return context;
    } catch (error) {
      logger.error('Error creating context:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveContexts(userId: string): Promise<MemoryContext[]> {
    const client = await this.db.connect();
    try {
      const query = `
        SELECT * FROM memory_context 
        WHERE user_id = $1 AND active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query, [userId]);
      return result.rows.map(row => this.mapRowToContext(row));
    } catch (error) {
      logger.error('Error getting active contexts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deactivateContext(contextId: string): Promise<boolean> {
    const client = await this.db.connect();
    try {
      const query = 'UPDATE memory_context SET active = false WHERE context_id = $1';
      const result = await client.query(query, [contextId]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deactivating context:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Search and Analytics
  async searchMemories(userId: string, searchQuery: MemorySearchQuery): Promise<MemorySearchResult[]> {
    const client = await this.db.connect();
    try {
      let query = `
        SELECT m.*, e.embedding_vector, e.content_hash
        FROM user_memory_bank m
        LEFT JOIN memory_embeddings e ON m.memory_id = e.memory_id
        WHERE m.user_id = $1
      `;
      
      const values: any[] = [userId];
      let paramIndex = 2;

      if (searchQuery.memory_types && searchQuery.memory_types.length > 0) {
        query += ` AND m.memory_type = ANY($${paramIndex++})`;
        values.push(searchQuery.memory_types);
      }

      if (searchQuery.categories && searchQuery.categories.length > 0) {
        query += ` AND m.category = ANY($${paramIndex++})`;
        values.push(searchQuery.categories);
      }

      if (searchQuery.min_confidence) {
        query += ` AND m.confidence_score >= $${paramIndex++}`;
        values.push(searchQuery.min_confidence);
      }

      if (searchQuery.min_importance) {
        query += ` AND m.importance_score >= $${paramIndex++}`;
        values.push(searchQuery.min_importance);
      }

      // Simple text search in content
      if (searchQuery.query) {
        query += ` AND (m.content::text ILIKE $${paramIndex++} OR m.category ILIKE $${paramIndex++})`;
        values.push(`%${searchQuery.query}%`, `%${searchQuery.query}%`);
      }

      query += ` ORDER BY m.importance_score DESC, m.last_referenced DESC`;
      
      if (searchQuery.limit) {
        query += ` LIMIT $${paramIndex++}`;
        values.push(searchQuery.limit);
      }

      const result = await client.query(query, values);
      
      return result.rows.map(row => ({
        memory: this.mapRowToMemory(row),
        relevance_score: 1.0, // TODO: Implement proper relevance scoring
        ...(row.embedding_vector && {
          embedding: {
            embedding_id: row.embedding_id,
            memory_id: row.memory_id,
            embedding_vector: row.embedding_vector,
            content_hash: row.content_hash,
            created_at: new Date(row.created_at)
          } as MemoryEmbedding
        })
      }));
    } catch (error) {
      logger.error('Error searching memories:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getMemoryBankSummary(userId: string): Promise<MemoryBankSummary> {
    const client = await this.db.connect();
    try {
      // Get total memories and breakdown by type
      const memoryStatsQuery = `
        SELECT 
          COUNT(*) as total_memories,
          memory_type,
          COUNT(*) as type_count
        FROM user_memory_bank 
        WHERE user_id = $1 
        GROUP BY memory_type
      `;
      
      const memoryStats = await client.query(memoryStatsQuery, [userId]);
      
      const totalMemories = memoryStats.rows.reduce((sum, row) => sum + parseInt(row.type_count), 0);
      const memoriesByType = memoryStats.rows.reduce((acc, row) => {
        acc[row.memory_type] = parseInt(row.type_count);
        return acc;
      }, {} as Record<string, number>);

      // Get top patterns
      const topPatterns = await this.getUserPatterns(userId);
      
      // Get recent insights
      const recentInsights = await this.getUserInsights(userId, 5);
      
      // Get active contexts
      const activeContexts = await this.getActiveContexts(userId);
      
      // Calculate memory health score (simplified)
      const healthScore = Math.min(1.0, (totalMemories * 0.1 + topPatterns.length * 0.2 + recentInsights.length * 0.3) / 10);

      return {
        total_memories: totalMemories,
        memories_by_type: memoriesByType,
        top_patterns: topPatterns.slice(0, 5),
        recent_insights: recentInsights,
        active_contexts: activeContexts,
        memory_health_score: healthScore
      };
    } catch (error) {
      logger.error('Error getting memory bank summary:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Private helper methods
  private async generateEmbedding(memoryId: string, content: Record<string, any>): Promise<void> {
    try {
      // TODO: Implement actual embedding generation using OpenAI or similar
      // For now, create a placeholder embedding
      const contentString = JSON.stringify(content);
      const contentHash = this.generateContentHash(contentString);
      
      // Placeholder embedding (in real implementation, use actual embedding model)
      const embeddingVector = new Array(1536).fill(0).map(() => Math.random());
      
      const client = await this.db.connect();
      try {
        const query = `
          INSERT INTO memory_embeddings (memory_id, embedding_vector, content_hash)
          VALUES ($1, $2, $3)
          ON CONFLICT (memory_id) DO UPDATE SET
            embedding_vector = EXCLUDED.embedding_vector,
            content_hash = EXCLUDED.content_hash,
            created_at = NOW()
        `;
        
        await client.query(query, [memoryId, embeddingVector, contentHash]);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error generating embedding:', error);
      // Don't throw - embedding generation is not critical
    }
  }

  private generateContentHash(content: string): string {
    // Simple hash function - in production, use crypto.createHash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private mapRowToMemory(row: any): UserMemoryBank {
    return {
      memory_id: row.memory_id,
      user_id: row.user_id,
      memory_type: row.memory_type,
      category: row.category,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
      confidence_score: parseFloat(row.confidence_score),
      importance_score: parseFloat(row.importance_score),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      last_referenced: new Date(row.last_referenced)
    };
  }

  private mapRowToPattern(row: any): MemoryPattern {
    return {
      pattern_id: row.pattern_id,
      user_id: row.user_id,
      pattern_type: row.pattern_type,
      pattern_data: typeof row.pattern_data === 'string' ? JSON.parse(row.pattern_data) : row.pattern_data,
      frequency_count: parseInt(row.frequency_count),
      strength_score: parseFloat(row.strength_score),
      examples: row.examples || [],
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  private mapRowToInsight(row: any): MemoryInsight {
    return {
      insight_id: row.insight_id,
      user_id: row.user_id,
      insight_type: row.insight_type,
      title: row.title,
      description: row.description,
      conversation_id: row.conversation_id,
      impact_score: parseFloat(row.impact_score),
      tags: row.tags || [],
      created_at: new Date(row.created_at)
    };
  }

  private mapRowToContext(row: any): MemoryContext {
    return {
      context_id: row.context_id,
      user_id: row.user_id,
      context_type: row.context_type,
      title: row.title,
      context_data: typeof row.context_data === 'string' ? JSON.parse(row.context_data) : row.context_data,
      related_conversations: row.related_conversations || [],
      active: row.active,
      created_at: new Date(row.created_at),
      ...(row.expires_at && { expires_at: new Date(row.expires_at) })
    };
  }
}