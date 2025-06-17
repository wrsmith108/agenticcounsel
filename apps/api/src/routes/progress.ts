import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProgressData, Milestone, Achievement } from '../types';

const router = express.Router();

// Validation middleware
const milestoneValidation = [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('description').trim().isLength({ min: 1, max: 500 }),
  body('goal_category').trim().isLength({ min: 1, max: 100 }),
  body('target_date').optional().isISO8601().toDate(),
  body('metadata').optional().isObject()
];

// Get progress overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();

    // Get all progress tracking records for the user
    const progressResult = await db.query(`
      SELECT * FROM progress_tracking 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `, [req.user.user_id]);

    const progressRecords = progressResult.rows;

    // Get recent conversations for activity tracking
    const conversationsResult = await db.query(`
      SELECT c.*, COUNT(m.message_id) as message_count
      FROM coaching_conversations c
      LEFT JOIN coaching_messages m ON c.conversation_id = m.conversation_id
      WHERE c.user_id = $1 AND c.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.conversation_id
      ORDER BY c.created_at DESC
      LIMIT 10
    `, [req.user.user_id]);

    const recentActivity = conversationsResult.rows;

    // Calculate overall progress metrics
    const totalGoals = progressRecords.length;
    const completedMilestones = progressRecords.reduce((total: number, record: any) => {
      const milestones = record.milestones || [];
      return total + milestones.filter((m: Milestone) => m.completed).length;
    }, 0);

    const totalMilestones = progressRecords.reduce((total: number, record: any) => {
      const milestones = record.milestones || [];
      return total + milestones.length;
    }, 0);

    const averageProgress = progressRecords.length > 0
      ? progressRecords.reduce((total: number, record: any) => {
          const progress = record.current_progress?.completion_percentage || 0;
          return total + progress;
        }, 0) / progressRecords.length
      : 0;

    const overview = {
      total_goals: totalGoals,
      average_progress: Math.round(averageProgress),
      completed_milestones: completedMilestones,
      total_milestones: totalMilestones,
      milestone_completion_rate: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      recent_activity: recentActivity,
      progress_by_category: progressRecords.map((record: any) => ({
        goal_category: record.goal_category,
        completion_percentage: record.current_progress?.completion_percentage || 0,
        current_phase: record.current_progress?.current_phase || 'Not started',
        last_updated: record.updated_at
      }))
    };

    res.json({
      success: true,
      message: 'Progress overview retrieved successfully',
      data: overview
    });

  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving progress overview'
    });
  }
});

// Get progress by goal category
router.get('/goals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const category = req.query['category'] as string;
    const db = DatabaseService.getInstance();

    let query = `
      SELECT * FROM progress_tracking 
      WHERE user_id = $1
    `;
    let params = [req.user.user_id];

    if (category) {
      query += ` AND goal_category = $2`;
      params.push(category);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await db.query(query, params);
    const progressRecords = result.rows;

    // Get user's current coaching goals for context
    const user = await db.findUserById(req.user.user_id);
    const coachingGoals = user?.coaching_goals || [];

    res.json({
      success: true,
      message: 'Goal progress retrieved successfully',
      data: {
        coaching_goals: coachingGoals,
        progress_records: progressRecords,
        filtered_by_category: category || null
      }
    });

  } catch (error) {
    console.error('Get goal progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving goal progress'
    });
  }
});

// Record milestone achievement
router.post('/milestone', milestoneValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const { title, description, goal_category, target_date, metadata } = req.body;
    const db = DatabaseService.getInstance();

    // Check if progress tracking record exists for this goal category
    let progressRecord = await db.query(`
      SELECT * FROM progress_tracking 
      WHERE user_id = $1 AND goal_category = $2
    `, [req.user.user_id, goal_category]);

    if (progressRecord.rows.length === 0) {
      // Create new progress tracking record
      const newProgressData: ProgressData = {
        completion_percentage: 0,
        current_phase: 'Getting Started',
        achievements: [],
        challenges: []
      };

      progressRecord = await db.query(`
        INSERT INTO progress_tracking (
          user_id, goal_category, current_progress, milestones, personality_aligned_metrics
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        req.user.user_id,
        goal_category,
        JSON.stringify(newProgressData),
        JSON.stringify([]),
        JSON.stringify({})
      ]);
    }

    const currentRecord = progressRecord.rows[0];
    const currentMilestones = currentRecord.milestones || [];

    // Create new milestone
    const newMilestone: Milestone = {
      milestone_id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      ...(target_date && { target_date: new Date(target_date) }),
      completed: false
    };

    const updatedMilestones = [...currentMilestones, newMilestone];

    // Update progress record
    await db.query(`
      UPDATE progress_tracking 
      SET milestones = $1, updated_at = NOW()
      WHERE tracking_id = $2
    `, [JSON.stringify(updatedMilestones), currentRecord.tracking_id]);

    // Create achievement record
    const achievement: Achievement = {
      achievement_id: `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Milestone Set: ${title}`,
      description: `Set a new milestone for ${goal_category}: ${description}`,
      earned_at: new Date()
    };

    // Update current progress with new achievement
    const currentProgress = currentRecord.current_progress || { completion_percentage: 0, current_phase: 'Getting Started', achievements: [], challenges: [] };
    currentProgress.achievements = [...(currentProgress.achievements || []), achievement];

    await db.query(`
      UPDATE progress_tracking 
      SET current_progress = $1, updated_at = NOW()
      WHERE tracking_id = $2
    `, [JSON.stringify(currentProgress), currentRecord.tracking_id]);

    res.status(201).json({
      success: true,
      message: 'Milestone recorded successfully',
      data: {
        milestone: newMilestone,
        achievement: achievement,
        goal_category: goal_category
      }
    });

  } catch (error) {
    console.error('Record milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while recording milestone'
    });
  }
});

// Get progress insights and recommendations
router.get('/insights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();

    // Get user data including personality profile
    const user = await db.findUserById(req.user.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get progress records
    const progressResult = await db.query(`
      SELECT * FROM progress_tracking 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `, [req.user.user_id]);

    const progressRecords = progressResult.rows;

    // Get recent coaching conversations for context
    const conversationsResult = await db.query(`
      SELECT c.*, COUNT(m.message_id) as message_count,
             MAX(m.created_at) as last_message_at
      FROM coaching_conversations c
      LEFT JOIN coaching_messages m ON c.conversation_id = m.conversation_id
      WHERE c.user_id = $1 AND c.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.conversation_id
      ORDER BY c.created_at DESC
    `, [req.user.user_id]);

    const recentConversations = conversationsResult.rows;

    // Generate insights based on progress patterns
    const insights = generateProgressInsights(progressRecords, recentConversations, user);

    // Generate personality-aligned recommendations
    const recommendations = generatePersonalityRecommendations(user, progressRecords);

    res.json({
      success: true,
      message: 'Progress insights retrieved successfully',
      data: {
        insights: insights,
        recommendations: recommendations,
        progress_summary: {
          total_goals: progressRecords.length,
          active_goals: progressRecords.filter((r: any) => (r.current_progress?.completion_percentage || 0) < 100).length,
          recent_activity_count: recentConversations.length
        }
      }
    });

  } catch (error) {
    console.error('Get progress insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving progress insights'
    });
  }
});

// Helper function to generate progress insights
function generateProgressInsights(progressRecords: any[], recentConversations: any[], user: any): any[] {
  const insights = [];

  // Analyze progress patterns
  if (progressRecords.length > 0) {
    const averageProgress = progressRecords.reduce((total, record) => {
      return total + (record.current_progress?.completion_percentage || 0);
    }, 0) / progressRecords.length;

    if (averageProgress > 70) {
      insights.push({
        type: 'positive_trend',
        title: 'Strong Progress Momentum',
        description: `You're maintaining excellent progress across your goals with an average completion of ${Math.round(averageProgress)}%.`,
        action_suggestion: 'Consider setting more challenging milestones to maintain growth momentum.'
      });
    } else if (averageProgress < 30) {
      insights.push({
        type: 'improvement_opportunity',
        title: 'Progress Acceleration Opportunity',
        description: 'Your current progress suggests there may be opportunities to break down goals into smaller, more achievable steps.',
        action_suggestion: 'Focus on one primary goal and create weekly micro-milestones.'
      });
    }
  }

  // Analyze coaching engagement
  if (recentConversations.length > 5) {
    insights.push({
      type: 'engagement_positive',
      title: 'High Coaching Engagement',
      description: `You've had ${recentConversations.length} coaching conversations this month, showing strong commitment to growth.`,
      action_suggestion: 'Leverage this momentum by setting specific action items from your coaching sessions.'
    });
  } else if (recentConversations.length < 2) {
    insights.push({
      type: 'engagement_opportunity',
      title: 'Coaching Engagement Opportunity',
      description: 'Regular coaching conversations can significantly accelerate your progress.',
      action_suggestion: 'Schedule weekly check-ins to maintain accountability and momentum.'
    });
  }

  return insights;
}

// Helper function to generate personality-aligned recommendations
function generatePersonalityRecommendations(user: any, progressRecords: any[]): any[] {
  const recommendations = [];

  if (!user.personality_profile) {
    recommendations.push({
      type: 'setup',
      title: 'Complete Personality Profile',
      description: 'Complete your personality profile to receive personalized progress recommendations.',
      priority: 'high'
    });
    return recommendations;
  }

  const personality = typeof user.personality_profile === 'string' 
    ? JSON.parse(user.personality_profile) 
    : user.personality_profile;

  const traits = personality.psychological_traits;

  // Decision-making pattern recommendations
  if (traits.decision_making_pattern?.includes('quick')) {
    recommendations.push({
      type: 'strategy',
      title: 'Leverage Your Quick Decision-Making',
      description: 'Your natural quick decision-making style can accelerate progress. Set daily micro-decisions to maintain momentum.',
      priority: 'medium'
    });
  } else if (traits.decision_making_pattern?.includes('deliberate')) {
    recommendations.push({
      type: 'strategy',
      title: 'Honor Your Thoughtful Approach',
      description: 'Your deliberate decision-making style ensures quality outcomes. Allow extra time for goal planning and milestone setting.',
      priority: 'medium'
    });
  }

  // Communication style recommendations
  if (traits.communication_style?.includes('direct')) {
    recommendations.push({
      type: 'coaching',
      title: 'Direct Progress Check-ins',
      description: 'Your direct communication style works well with structured, goal-focused coaching sessions.',
      priority: 'low'
    });
  }

  return recommendations;
}

// Get progress history for charts and trends
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔍 PROGRESS HISTORY: Request received', {
      user: req.user?.user_id,
      timeRange: req.query['timeRange'],
      timestamp: new Date().toISOString()
    });

    if (!req.user) {
      console.log('❌ PROGRESS HISTORY: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const timeRange = req.query['timeRange'] as string || 'month';
    console.log('📊 PROGRESS HISTORY: Processing request for timeRange:', timeRange);

    const db = DatabaseService.getInstance();

    // Calculate date range based on timeRange parameter
    let dateFilter = '';
    switch (timeRange) {
      case 'week':
        dateFilter = "AND updated_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'quarter':
        dateFilter = "AND updated_at >= NOW() - INTERVAL '3 months'";
        break;
      case 'month':
      default:
        dateFilter = "AND updated_at >= NOW() - INTERVAL '1 month'";
        break;
    }

    // Get progress tracking history for the user
    const historyResult = await db.query(`
      SELECT
        tracking_id,
        goal_category,
        current_progress,
        updated_at as recorded_at
      FROM progress_tracking
      WHERE user_id = $1 ${dateFilter}
      ORDER BY updated_at DESC
    `, [req.user.user_id]);

    // Transform the data for frontend consumption
    const historyData = historyResult.rows.map((record: any) => {
      const currentProgress = record.current_progress || {};
      return {
        recorded_at: record.recorded_at,
        progress_percentage: currentProgress.completion_percentage || 0,
        goal_category: record.goal_category,
        current_phase: currentProgress.current_phase || 'Not started'
      };
    });

    console.log('✅ PROGRESS HISTORY: Returning data:', historyData.length, 'entries for timeRange:', timeRange);

    res.json({
      success: true,
      message: 'Progress history retrieved successfully',
      data: historyData
    });

  } catch (error) {
    console.error('❌ PROGRESS HISTORY: Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving progress history'
    });
  }
});

export default router;