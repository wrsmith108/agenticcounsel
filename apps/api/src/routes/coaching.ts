import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { AICoachingService } from '../services/aiCoachingService';
import { PersonalityService } from '../services/personalityService';
import { AuthenticatedRequest } from '../middleware/auth';
import { CoachingContext, SessionType } from '../types';

const router = express.Router();

// Validation middleware
const startSessionValidation = [
  body('session_type').isIn(['initial_insights', 'goal_setting', 'coaching_conversation', 'progress_review', 'action_planning']),
  body('initial_message').optional().trim().isLength({ min: 1, max: 1000 })
];

const sendMessageValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }),
  body('metadata').optional().isObject()
];

const conversationIdValidation = [
  param('id').isUUID()
];

// Start new coaching conversation
router.post('/start-session', startSessionValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { session_type, initial_message } = req.body;
    const db = DatabaseService.getInstance();

    // Get user data for coaching context
    const user = await db.findUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new conversation
    const conversation = await db.createConversation({
      user_id: req.user.user_id,
      session_type: session_type
    });

    let response_data: any = {
      conversation: conversation
    };

    // If there's an initial message, process it with AI coaching
    if (initial_message) {
      try {
        // Initialize AI coaching service with Anthropic
        const aiCoachingService = new AICoachingService({
          api_key: process.env['ANTHROPIC_API_KEY'] || '',
          model: process.env['ANTHROPIC_MODEL'] || 'claude-3-sonnet-20240229',
          max_tokens: parseInt(process.env['ANTHROPIC_MAX_TOKENS'] || '1000'),
          temperature: parseFloat(process.env['ANTHROPIC_TEMPERATURE'] || '0.7')
        });

        // Add user message to conversation
        const userMessage = await db.addMessage({
          conversation_id: conversation.conversation_id,
          sender_type: 'user',
          content: initial_message,
          metadata: null
        });

        // Build coaching context
        const coachingContext: CoachingContext = {
          user_personality: user.personality_profile ? 
            (typeof user.personality_profile === 'string' ? JSON.parse(user.personality_profile) : user.personality_profile) : 
            undefined,
          conversation_history: [],
          current_message: initial_message,
          session_type: session_type as SessionType,
          coaching_goals: user.coaching_goals || [],
          aha_moments_delivered: []
        };

        // Generate AI response
        const coachingResponse = await aiCoachingService.generateCoachingResponse(coachingContext);

        // Add coach response to conversation
        const coachMessage = await db.addMessage({
          conversation_id: conversation.conversation_id,
          sender_type: 'coach',
          content: coachingResponse.content,
          metadata: coachingResponse.metadata
        });

        response_data.messages = [userMessage, coachMessage];
        response_data.initial_response = coachingResponse;

      } catch (aiError) {
        console.error('AI coaching error:', aiError);
        // Continue without AI response if there's an error
        const userMessage = await db.addMessage({
          conversation_id: conversation.conversation_id,
          sender_type: 'user',
          content: initial_message,
          metadata: null
        });
        response_data.messages = [userMessage];
      }
    }

    res.status(201).json({
      success: true,
      message: 'Coaching session started successfully',
      data: response_data
    });

  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while starting coaching session'
    });
  }
});

// Get user's coaching conversations
router.get('/conversations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();
    const limit = parseInt(req.query['limit'] as string) || 20;
    const offset = parseInt(req.query['offset'] as string) || 0;

    const result = await db.query(`
      SELECT c.*,
             COUNT(m.message_id) as message_count,
             MAX(m.created_at) as last_message_at
      FROM coaching_conversations c
      LEFT JOIN coaching_messages m ON c.conversation_id = m.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.conversation_id
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.user_id, limit, offset]);

    const conversations = result.rows;

    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: {
        conversations: conversations,
        pagination: {
          limit: limit,
          offset: offset,
          total: conversations.length
        }
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving conversations'
    });
  }
});

// Get specific conversation
router.get('/conversations/:id', conversationIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const conversationId = req.params['id'];
    const db = DatabaseService.getInstance();

    // Get conversation and verify ownership
    const conversationResult = await db.query(`
      SELECT * FROM coaching_conversations
      WHERE conversation_id = $1 AND user_id = $2
    `, [conversationId, req.user.user_id]);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const conversation = conversationResult.rows[0];

    // Get conversation messages
    const messages = await db.getConversationHistory(conversationId!);

    res.json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: {
        conversation: conversation,
        messages: messages
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving conversation'
    });
  }
});

// Send message in conversation
router.post('/conversations/:id/messages', [...conversationIdValidation, ...sendMessageValidation], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const conversationId = req.params['id'];
    const { content, metadata } = req.body;
    const db = DatabaseService.getInstance();

    // Verify conversation ownership
    const conversationResult = await db.query(`
      SELECT * FROM coaching_conversations
      WHERE conversation_id = $1 AND user_id = $2 AND status = 'active'
    `, [conversationId, req.user.user_id]);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active conversation not found'
      });
    }

    const conversation = conversationResult.rows[0];

    // Add user message
    const userMessage = await db.addMessage({
      conversation_id: conversationId,
      sender_type: 'user',
      content: content,
      metadata: metadata
    });

    // Generate AI coaching response
    try {
      // Get user data for coaching context
      const user = await db.findUserById(req.user.user_id);
      
      // Get conversation history
      const conversationHistory = await db.getConversationHistory(conversationId!);
      
      // Initialize AI coaching service with Anthropic
      const aiCoachingService = new AICoachingService({
        api_key: process.env['ANTHROPIC_API_KEY'] || '',
        model: process.env['ANTHROPIC_MODEL'] || 'claude-3-sonnet-20240229',
        max_tokens: parseInt(process.env['ANTHROPIC_MAX_TOKENS'] || '1000'),
        temperature: parseFloat(process.env['ANTHROPIC_TEMPERATURE'] || '0.7')
      });

      // Build coaching context
      const coachingContext: CoachingContext = {
        user_personality: user?.personality_profile ? 
          (typeof user.personality_profile === 'string' ? JSON.parse(user.personality_profile) : user.personality_profile) : 
          undefined,
        conversation_history: conversationHistory.slice(0, -1), // Exclude the message we just added
        current_message: content,
        session_type: conversation.session_type as SessionType,
        coaching_goals: user?.coaching_goals || [],
        aha_moments_delivered: []
      };

      // Generate AI response
      const coachingResponse = await aiCoachingService.generateCoachingResponse(coachingContext);

      // Add coach response to conversation
      const coachMessage = await db.addMessage({
        conversation_id: conversationId,
        sender_type: 'coach',
        content: coachingResponse.content,
        metadata: coachingResponse.metadata
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: {
          user_message: userMessage,
          coach_response: coachMessage,
          coaching_metadata: coachingResponse.metadata
        }
      });

    } catch (aiError) {
      console.error('AI coaching error:', aiError);
      
      // Return user message even if AI fails
      res.status(201).json({
        success: true,
        message: 'Message sent successfully (AI response unavailable)',
        data: {
          user_message: userMessage,
          coach_response: null,
          error: 'AI coaching service temporarily unavailable'
        }
      });
    }

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending message'
    });
  }
});

// Get conversation messages
router.get('/conversations/:id/messages', conversationIdValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const conversationId = req.params['id'];
    const db = DatabaseService.getInstance();

    // Verify conversation ownership
    const conversationResult = await db.query(`
      SELECT * FROM coaching_conversations
      WHERE conversation_id = $1 AND user_id = $2
    `, [conversationId, req.user.user_id]);

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get messages with pagination
    const limit = parseInt(req.query['limit'] as string) || 50;
    const offset = parseInt(req.query['offset'] as string) || 0;

    const messagesResult = await db.query(`
      SELECT * FROM coaching_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    const messages = messagesResult.rows;

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages: messages,
        pagination: {
          limit: limit,
          offset: offset,
          total: messages.length
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving messages'
    });
  }
});

export default router;