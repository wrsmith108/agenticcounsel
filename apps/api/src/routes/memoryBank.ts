import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { MemoryBankService } from '../services/memoryBankService.js';
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
  CreatePatternRequest,
  CreateInsightRequest,
  CreateContextRequest,
  MemorySearchQuery,
  MemoryBankConfig
} from '../types/memoryBank.js';

const router = Router();

// Default configuration - should be moved to environment variables
const defaultConfig: MemoryBankConfig = {
  max_memories_per_user: 10000,
  memory_retention_days: 365,
  pattern_strength_threshold: 0.3,
  insight_impact_threshold: 0.4,
  context_expiry_days: 30,
  embedding_model: 'text-embedding-ada-002',
  similarity_threshold: 0.7
};

// Initialize memory bank service
const initMemoryBankService = (db: Pool): MemoryBankService => {
  return new MemoryBankService(db, defaultConfig);
};

// Middleware to extract user ID from request
const extractUserId = (req: Request): string => {
  // TODO: Extract from JWT token or session
  // For now, use a header or query parameter
  const userId = req.headers['x-user-id'] as string || req.query['userId'] as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Memory CRUD operations
router.post('/memories', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const memoryRequest: CreateMemoryRequest = req.body;
    
    // Validate request
    if (!memoryRequest.memory_type || !memoryRequest.category || !memoryRequest.content) {
      return res.status(400).json({ 
        error: 'Missing required fields: memory_type, category, content' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const memory = await memoryService.createMemory(userId, memoryRequest);
    
    res.status(201).json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ 
      error: 'Failed to create memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/memories/:memoryId', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }
    
    const memory = await memoryService.getMemory(memoryId);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error getting memory:', error);
    res.status(500).json({ 
      error: 'Failed to get memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/memories/:memoryId', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const updateRequest: UpdateMemoryRequest = req.body;
    
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }
    
    const memory = await memoryService.updateMemory(memoryId, updateRequest);
    
    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ 
      error: 'Failed to update memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/memories/:memoryId', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    if (!memoryId) {
      return res.status(400).json({ error: 'Memory ID is required' });
    }
    
    const deleted = await memoryService.deleteMemory(memoryId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ 
      error: 'Failed to delete memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/memories', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const limit = parseInt(req.query['limit'] as string) || 50;
    const offset = parseInt(req.query['offset'] as string) || 0;
    
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const memories = await memoryService.getUserMemories(userId, limit, offset);
    
    res.json({
      success: true,
      data: memories,
      pagination: {
        limit,
        offset,
        count: memories.length
      }
    });
  } catch (error) {
    console.error('Error getting user memories:', error);
    res.status(500).json({ 
      error: 'Failed to get memories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Pattern operations
router.post('/patterns', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const patternRequest: CreatePatternRequest = req.body;
    
    if (!patternRequest.pattern_type || !patternRequest.pattern_data) {
      return res.status(400).json({ 
        error: 'Missing required fields: pattern_type, pattern_data' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const pattern = await memoryService.createPattern(userId, patternRequest);
    
    res.status(201).json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error creating pattern:', error);
    res.status(500).json({ 
      error: 'Failed to create pattern',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/patterns', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const patterns = await memoryService.getUserPatterns(userId);
    
    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error getting patterns:', error);
    res.status(500).json({ 
      error: 'Failed to get patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/patterns/:patternId/strength', async (req: Request, res: Response) => {
  try {
    const { patternId } = req.params;
    const { strengthDelta } = req.body;
    
    if (typeof strengthDelta !== 'number') {
      return res.status(400).json({ 
        error: 'strengthDelta must be a number' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    if (!patternId) {
      return res.status(400).json({ error: 'Pattern ID is required' });
    }
    
    const pattern = await memoryService.updatePatternStrength(patternId, strengthDelta);
    
    res.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error updating pattern strength:', error);
    res.status(500).json({ 
      error: 'Failed to update pattern strength',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Insight operations
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const insightRequest: CreateInsightRequest = req.body;
    
    if (!insightRequest.insight_type || !insightRequest.title || !insightRequest.description) {
      return res.status(400).json({ 
        error: 'Missing required fields: insight_type, title, description' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const insight = await memoryService.createInsight(userId, insightRequest);
    
    res.status(201).json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(500).json({ 
      error: 'Failed to create insight',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/insights', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const limit = parseInt(req.query['limit'] as string) || 20;
    
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const insights = await memoryService.getUserInsights(userId, limit);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ 
      error: 'Failed to get insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Context operations
router.post('/contexts', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const contextRequest: CreateContextRequest = req.body;
    
    if (!contextRequest.context_type || !contextRequest.context_data) {
      return res.status(400).json({ 
        error: 'Missing required fields: context_type, context_data' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const context = await memoryService.createContext(userId, contextRequest);
    
    res.status(201).json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error('Error creating context:', error);
    res.status(500).json({ 
      error: 'Failed to create context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/contexts/active', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const contexts = await memoryService.getActiveContexts(userId);
    
    res.json({
      success: true,
      data: contexts
    });
  } catch (error) {
    console.error('Error getting active contexts:', error);
    res.status(500).json({ 
      error: 'Failed to get active contexts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/contexts/:contextId/deactivate', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    if (!contextId) {
      return res.status(400).json({ error: 'Context ID is required' });
    }
    
    const deactivated = await memoryService.deactivateContext(contextId);
    
    if (!deactivated) {
      return res.status(404).json({ error: 'Context not found' });
    }
    
    res.json({
      success: true,
      message: 'Context deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating context:', error);
    res.status(500).json({ 
      error: 'Failed to deactivate context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Search and analytics
router.post('/search', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const searchQuery: MemorySearchQuery = req.body;
    
    if (!searchQuery.query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const results = await memoryService.searchMemories(userId, searchQuery);
    
    res.json({
      success: true,
      data: results,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({ 
      error: 'Failed to search memories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = extractUserId(req);
    const db = req.app.get('db') as Pool;
    const memoryService = initMemoryBankService(db);
    
    const summary = await memoryService.getMemoryBankSummary(userId);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting memory bank summary:', error);
    res.status(500).json({ 
      error: 'Failed to get memory bank summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const db = req.app.get('db') as Pool;
    
    // Test database connection
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      config: {
        max_memories_per_user: defaultConfig.max_memories_per_user,
        memory_retention_days: defaultConfig.memory_retention_days,
        embedding_model: defaultConfig.embedding_model
      }
    });
  } catch (error) {
    console.error('Memory bank health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;