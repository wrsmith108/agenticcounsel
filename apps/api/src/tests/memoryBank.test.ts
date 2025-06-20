import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  CreateMemoryRequest,
  CreatePatternRequest,
  CreateInsightRequest,
  CreateContextRequest,
  MemoryBankConfig,
  MemorySearchQuery,
  UserMemoryBank,
  MemoryPattern,
  MemoryInsight,
  MemoryContext
} from '../types/memoryBank.js';

// Mock data for testing
const testUserId = 'test-user-123';

const defaultConfig: MemoryBankConfig = {
  max_memories_per_user: 10000,
  memory_retention_days: 365,
  pattern_strength_threshold: 0.3,
  insight_impact_threshold: 0.4,
  context_expiry_days: 30,
  embedding_model: 'text-embedding-ada-002',
  similarity_threshold: 0.7
};

describe('Memory Bank Types', () => {
  describe('CreateMemoryRequest', () => {
    it('should validate memory request structure', () => {
      const request: CreateMemoryRequest = {
        memory_type: 'insight',
        category: 'personal-growth',
        content: { insight: 'User prefers visual learning' },
        confidence_score: 0.8,
        importance_score: 0.7
      };

      expect(request.memory_type).toBe('insight');
      expect(request.category).toBe('personal-growth');
      expect(request.content).toEqual({ insight: 'User prefers visual learning' });
      expect(request.confidence_score).toBe(0.8);
      expect(request.importance_score).toBe(0.7);
    });

    it('should allow optional fields', () => {
      const request: CreateMemoryRequest = {
        memory_type: 'pattern',
        category: 'communication',
        content: { pattern: 'detailed responses' }
      };

      expect(request.confidence_score).toBeUndefined();
      expect(request.importance_score).toBeUndefined();
    });
  });

  describe('CreatePatternRequest', () => {
    it('should validate pattern request structure', () => {
      const request: CreatePatternRequest = {
        pattern_type: 'communication',
        pattern_data: {
          description: 'Tends to provide detailed responses',
          triggers: ['complex topics', 'emotional discussions'],
          responses: ['lengthy explanations', 'multiple examples'],
          context: {
            avg_message_length: 500,
            detail_preference: 'high'
          }
        },
        strength_score: 0.7
      };

      expect(request.pattern_type).toBe('communication');
      expect(request.pattern_data.description).toBe('Tends to provide detailed responses');
      expect(request.pattern_data.triggers).toHaveLength(2);
      expect(request.pattern_data.responses).toHaveLength(2);
      expect(request.strength_score).toBe(0.7);
    });
  });

  describe('CreateInsightRequest', () => {
    it('should validate insight request structure', () => {
      const request: CreateInsightRequest = {
        insight_type: 'breakthrough',
        title: 'Learning Style Discovery',
        description: 'User discovered they are a visual learner',
        conversation_id: 'conv-123',
        impact_score: 0.8,
        tags: ['learning', 'breakthrough', 'visual']
      };

      expect(request.insight_type).toBe('breakthrough');
      expect(request.title).toBe('Learning Style Discovery');
      expect(request.description).toBe('User discovered they are a visual learner');
      expect(request.conversation_id).toBe('conv-123');
      expect(request.impact_score).toBe(0.8);
      expect(request.tags).toHaveLength(3);
    });
  });

  describe('CreateContextRequest', () => {
    it('should validate context request structure', () => {
      const request: CreateContextRequest = {
        context_type: 'thread',
        title: 'Career Discussion',
        context_data: {
          summary: 'discussing career goals',
          key_points: ['goal setting', 'skill development'],
          action_items: ['update resume']
        },
        related_conversations: ['conv-1', 'conv-2'],
        expires_at: new Date('2024-12-31')
      };

      expect(request.context_type).toBe('thread');
      expect(request.title).toBe('Career Discussion');
      expect(request.context_data.summary).toBe('discussing career goals');
      expect(request.context_data.key_points).toHaveLength(2);
      expect(request.context_data.action_items).toHaveLength(1);
      expect(request.related_conversations).toHaveLength(2);
      expect(request.expires_at).toBeInstanceOf(Date);
    });
  });

  describe('MemorySearchQuery', () => {
    it('should validate search query structure', () => {
      const query: MemorySearchQuery = {
        query: 'learning style',
        memory_types: ['insight', 'pattern'],
        categories: ['learning', 'education'],
        min_confidence: 0.5,
        min_importance: 0.6,
        limit: 20,
        include_embeddings: true
      };

      expect(query.query).toBe('learning style');
      expect(query.memory_types).toHaveLength(2);
      expect(query.categories).toHaveLength(2);
      expect(query.min_confidence).toBe(0.5);
      expect(query.min_importance).toBe(0.6);
      expect(query.limit).toBe(20);
      expect(query.include_embeddings).toBe(true);
    });
  });
});

describe('Memory Bank Configuration', () => {
  it('should validate default configuration', () => {
    expect(defaultConfig.max_memories_per_user).toBe(10000);
    expect(defaultConfig.memory_retention_days).toBe(365);
    expect(defaultConfig.pattern_strength_threshold).toBe(0.3);
    expect(defaultConfig.insight_impact_threshold).toBe(0.4);
    expect(defaultConfig.context_expiry_days).toBe(30);
    expect(defaultConfig.embedding_model).toBe('text-embedding-ada-002');
    expect(defaultConfig.similarity_threshold).toBe(0.7);
  });

  it('should allow configuration customization', () => {
    const customConfig: MemoryBankConfig = {
      ...defaultConfig,
      max_memories_per_user: 5000,
      pattern_strength_threshold: 0.5
    };

    expect(customConfig.max_memories_per_user).toBe(5000);
    expect(customConfig.pattern_strength_threshold).toBe(0.5);
    expect(customConfig.memory_retention_days).toBe(365); // unchanged
  });
});

describe('Pattern Recognition Logic', () => {
  describe('Communication Pattern Detection', () => {
    it('should identify detailed communication pattern', () => {
      const messages = [
        'This is a very long message that contains a lot of detailed information about my situation.',
        'Another comprehensive response with extensive context and thorough explanation.',
        'I want to provide complete background so you understand exactly what I mean.'
      ];

      const avgLength = messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length;
      const isDetailedCommunicator = avgLength > 100;

      expect(isDetailedCommunicator).toBe(true);
      expect(avgLength).toBeGreaterThan(100);
    });

    it('should identify concise communication pattern', () => {
      const messages = [
        'Yes.',
        'No, thanks.',
        'Got it.',
        'Okay.'
      ];

      const avgLength = messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length;
      const isConciseCommunicator = avgLength < 20;

      expect(isConciseCommunicator).toBe(true);
      expect(avgLength).toBeLessThan(20);
    });

    it('should detect question-asking pattern', () => {
      const messages = [
        'What should I do?',
        'How does this work?',
        'Can you explain more?',
        'Why is that important?'
      ];

      const questionCount = messages.filter(msg => msg.includes('?')).length;
      const questionRatio = questionCount / messages.length;

      expect(questionRatio).toBe(1.0);
      expect(questionCount).toBe(4);
    });
  });

  describe('Decision-Making Pattern Detection', () => {
    it('should identify analytical decision-making style', () => {
      const messages = [
        'I need to analyze the pros and cons carefully.',
        'Let me compare all the options systematically.',
        'What data do we have to support this decision?'
      ];

      const analyticalKeywords = ['analyze', 'compare', 'data', 'pros', 'cons', 'systematic'];
      const analyticalCount = messages.filter(msg =>
        analyticalKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      ).length;

      expect(analyticalCount).toBeGreaterThan(0);
    });

    it('should identify intuitive decision-making style', () => {
      const messages = [
        'I have a gut feeling about this.',
        'Something just feels right.',
        'My instinct tells me to go with option A.'
      ];

      const intuitiveKeywords = ['feel', 'feeling', 'gut', 'instinct', 'intuition'];
      const intuitiveCount = messages.filter(msg =>
        intuitiveKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      ).length;

      expect(intuitiveCount).toBeGreaterThan(0);
    });
  });

  describe('Learning Style Pattern Detection', () => {
    it('should identify visual learning preference', () => {
      const messages = [
        'Can you show me an example?',
        'I need to see how this works.',
        'A diagram would be helpful.'
      ];

      const visualKeywords = ['show', 'see', 'diagram', 'visual', 'picture'];
      const visualCount = messages.filter(msg =>
        visualKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      ).length;

      expect(visualCount).toBeGreaterThan(0);
    });

    it('should identify kinesthetic learning preference', () => {
      const messages = [
        'I learn best by doing.',
        'Can I try this myself?',
        'I need hands-on experience.'
      ];

      const kinestheticKeywords = ['doing', 'try', 'hands-on', 'practice', 'experience'];
      const kinestheticCount = messages.filter(msg =>
        kinestheticKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      ).length;

      expect(kinestheticCount).toBeGreaterThan(0);
    });
  });

  describe('Emotional Growth Detection', () => {
    it('should identify growth indicators', () => {
      const messages = [
        'I learned something important about myself.',
        'I realized that I have been approaching this wrong.',
        'This breakthrough has given me clarity.'
      ];

      const growthKeywords = ['learned', 'realized', 'breakthrough', 'clarity', 'understand'];
      const growthCount = messages.filter(msg =>
        growthKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      ).length;

      expect(growthCount).toBeGreaterThan(0);
    });
  });
});

describe('Memory Bank Data Structures', () => {
  describe('UserMemoryBank', () => {
    it('should represent a complete memory record', () => {
      const memory: UserMemoryBank = {
        memory_id: 'mem-123',
        user_id: testUserId,
        memory_type: 'insight',
        category: 'learning',
        content: { insight: 'User prefers visual learning' },
        confidence_score: 0.8,
        importance_score: 0.7,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-02'),
        last_referenced: new Date('2024-01-03')
      };

      expect(memory.memory_id).toBe('mem-123');
      expect(memory.user_id).toBe(testUserId);
      expect(memory.memory_type).toBe('insight');
      expect(memory.category).toBe('learning');
      expect(memory.content.insight).toBe('User prefers visual learning');
      expect(memory.confidence_score).toBe(0.8);
      expect(memory.importance_score).toBe(0.7);
      expect(memory.created_at).toBeInstanceOf(Date);
      expect(memory.updated_at).toBeInstanceOf(Date);
      expect(memory.last_referenced).toBeInstanceOf(Date);
    });
  });

  describe('MemoryPattern', () => {
    it('should represent a behavioral pattern', () => {
      const pattern: MemoryPattern = {
        pattern_id: 'pat-123',
        user_id: testUserId,
        pattern_type: 'communication',
        pattern_data: {
          description: 'Detailed communication style',
          triggers: ['complex topics'],
          responses: ['lengthy explanations'],
          context: { avg_length: 300 }
        },
        frequency_count: 5,
        strength_score: 0.8,
        examples: [
          {
            conversation_id: 'conv-1',
            excerpt: 'Example of detailed response...',
            timestamp: new Date(),
            relevance_score: 0.9
          }
        ],
        created_at: new Date(),
        updated_at: new Date()
      };

      expect(pattern.pattern_id).toBe('pat-123');
      expect(pattern.pattern_type).toBe('communication');
      expect(pattern.pattern_data.description).toBe('Detailed communication style');
      expect(pattern.frequency_count).toBe(5);
      expect(pattern.strength_score).toBe(0.8);
      expect(pattern.examples).toHaveLength(1);
    });
  });

  describe('MemoryInsight', () => {
    it('should represent a user insight', () => {
      const insight: MemoryInsight = {
        insight_id: 'ins-123',
        user_id: testUserId,
        insight_type: 'breakthrough',
        title: 'Learning Style Discovery',
        description: 'User discovered visual learning preference',
        conversation_id: 'conv-123',
        impact_score: 0.9,
        tags: ['learning', 'visual', 'breakthrough'],
        created_at: new Date()
      };

      expect(insight.insight_id).toBe('ins-123');
      expect(insight.insight_type).toBe('breakthrough');
      expect(insight.title).toBe('Learning Style Discovery');
      expect(insight.description).toBe('User discovered visual learning preference');
      expect(insight.impact_score).toBe(0.9);
      expect(insight.tags).toHaveLength(3);
    });
  });

  describe('MemoryContext', () => {
    it('should represent conversation context', () => {
      const context: MemoryContext = {
        context_id: 'ctx-123',
        user_id: testUserId,
        context_type: 'thread',
        title: 'Career Planning',
        context_data: {
          summary: 'Discussion about career goals',
          key_points: ['skill development', 'networking'],
          action_items: ['update LinkedIn', 'schedule informational interviews']
        },
        related_conversations: ['conv-1', 'conv-2'],
        active: true,
        created_at: new Date(),
        expires_at: new Date('2024-12-31')
      };

      expect(context.context_id).toBe('ctx-123');
      expect(context.context_type).toBe('thread');
      expect(context.title).toBe('Career Planning');
      expect(context.context_data.summary).toBe('Discussion about career goals');
      expect(context.context_data.key_points).toHaveLength(2);
      expect(context.context_data.action_items).toHaveLength(2);
      expect(context.related_conversations).toHaveLength(2);
      expect(context.active).toBe(true);
    });
  });
});

describe('Memory Bank Utility Functions', () => {
  describe('Content Hash Generation', () => {
    it('should generate consistent hash for same content', () => {
      const content = 'test content';
      
      // Simple hash function for testing
      const generateHash = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const hash1 = generateHash(content);
      const hash2 = generateHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeTruthy();
    });

    it('should generate different hashes for different content', () => {
      const content1 = 'test content 1';
      const content2 = 'test content 2';
      
      const generateHash = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const hash1 = generateHash(content1);
      const hash2 = generateHash(content2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Score Calculations', () => {
    it('should calculate relevance scores correctly', () => {
      const calculateRelevance = (query: string, content: string): number => {
        const queryWords = query.toLowerCase().split(' ');
        const contentWords = content.toLowerCase().split(' ');
        
        const matches = queryWords.filter(word => 
          contentWords.some(contentWord => contentWord.includes(word))
        );
        
        return matches.length / queryWords.length;
      };

      const relevance1 = calculateRelevance('learning style', 'visual learning preferences');
      const relevance2 = calculateRelevance('learning style', 'cooking recipes');

      expect(relevance1).toBeGreaterThan(relevance2);
      expect(relevance1).toBe(0.5); // 'learning' matches
      expect(relevance2).toBe(0); // no matches
    });

    it('should normalize scores to valid ranges', () => {
      const normalizeScore = (score: number): number => {
        return Math.max(0, Math.min(1, score));
      };

      expect(normalizeScore(-0.5)).toBe(0);
      expect(normalizeScore(1.5)).toBe(1);
      expect(normalizeScore(0.7)).toBe(0.7);
    });
  });
});

describe('Memory Bank Integration Scenarios', () => {
  describe('Complete User Journey', () => {
    it('should handle a typical coaching session workflow', () => {
      // Simulate a coaching session where patterns are detected and insights generated
      const sessionData = {
        user_id: testUserId,
        conversation_id: 'conv-session-1',
        messages: [
          'I need help with a career decision.',
          'I want to analyze all my options carefully.',
          'Can you show me a framework for decision-making?',
          'I learned that I prefer visual tools for complex decisions.'
        ]
      };

      // Detect patterns
      const avgMessageLength = sessionData.messages.reduce((sum, msg) => sum + msg.length, 0) / sessionData.messages.length;
      const hasAnalyticalLanguage = sessionData.messages.some(msg => 
        msg.toLowerCase().includes('analyze') || msg.toLowerCase().includes('options')
      );
      const hasVisualPreference = sessionData.messages.some(msg => 
        msg.toLowerCase().includes('show') || msg.toLowerCase().includes('visual')
      );
      const hasLearningIndicators = sessionData.messages.some(msg => 
        msg.toLowerCase().includes('learned')
      );

      // Validate detected patterns
      expect(avgMessageLength).toBeGreaterThan(30);
      expect(hasAnalyticalLanguage).toBe(true);
      expect(hasVisualPreference).toBe(true);
      expect(hasLearningIndicators).toBe(true);

      // Generate insights based on patterns
      const insights: Array<{type: string; title: string; description: string}> = [];
      
      if (hasAnalyticalLanguage && hasVisualPreference) {
        insights.push({
          type: 'pattern_recognition',
          title: 'Analytical-Visual Decision Making Style',
          description: 'User combines analytical thinking with visual processing preferences'
        });
      }

      if (hasLearningIndicators) {
        insights.push({
          type: 'emotional_growth',
          title: 'Self-Awareness Growth',
          description: 'User demonstrated increased self-awareness about their preferences'
        });
      }

      expect(insights).toHaveLength(2);
      expect(insights[0].type).toBe('pattern_recognition');
      expect(insights[1].type).toBe('emotional_growth');
    });
  });

  describe('Pattern Evolution Tracking', () => {
    it('should track how patterns strengthen over time', () => {
      const initialPattern = {
        pattern_id: 'pat-1',
        strength_score: 0.3,
        frequency_count: 1
      };

      // Simulate pattern reinforcement
      const reinforcePattern = (pattern: typeof initialPattern, reinforcements: number) => {
        return {
          ...pattern,
          strength_score: Math.min(1.0, pattern.strength_score + (reinforcements * 0.1)),
          frequency_count: pattern.frequency_count + reinforcements
        };
      };

      const reinforcedPattern = reinforcePattern(initialPattern, 5);

      expect(reinforcedPattern.strength_score).toBe(0.8);
      expect(reinforcedPattern.frequency_count).toBe(6);
    });
  });

  describe('Context Continuity', () => {
    it('should maintain context across multiple conversations', () => {
      const context = {
        context_id: 'ctx-career',
        context_type: 'thread' as const,
        context_data: {
          summary: 'Career transition planning',
          key_points: ['skill assessment', 'industry research'],
          action_items: ['update resume']
        },
        related_conversations: ['conv-1'],
        active: true
      };

      // Simulate adding new conversation to context
      const updateContext = (ctx: typeof context, newConversationId: string, newKeyPoints: string[]) => {
        return {
          ...ctx,
          context_data: {
            ...ctx.context_data,
            key_points: [...ctx.context_data.key_points, ...newKeyPoints]
          },
          related_conversations: [...ctx.related_conversations, newConversationId]
        };
      };

      const updatedContext = updateContext(context, 'conv-2', ['networking strategy']);

      expect(updatedContext.context_data.key_points).toHaveLength(3);
      expect(updatedContext.related_conversations).toHaveLength(2);
      expect(updatedContext.context_data.key_points).toContain('networking strategy');
    });
  });
});