import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { PersonalityService } from '../services/personalityService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation middleware
const updateProfileValidation = [
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }),
  body('birth_date').optional().isISO8601().toDate(),
  body('birth_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('birth_location').optional().trim().isLength({ min: 1, max: 100 })
];

const onboardingValidation = [
  body('coaching_goals').isArray({ min: 1, max: 5 }),
  body('coaching_goals.*').trim().isLength({ min: 1, max: 100 }),
  body('personality_insights_reviewed').isBoolean(),
  body('initial_session_preferences').optional().isObject()
];

const coachingGoalsValidation = [
  body('coaching_goals').isArray({ min: 1, max: 5 }),
  body('coaching_goals.*').trim().isLength({ min: 1, max: 100 })
];

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();
    const user = await db.findUserById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = user;

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving profile'
    });
  }
});

// Update user profile
router.put('/profile', updateProfileValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const db = DatabaseService.getInstance();
    const updates = req.body;

    // If birth data is being updated, regenerate personality profile
    if (updates.birth_date || updates.birth_time || updates.birth_location) {
      const currentUser = await db.findUserById(req.user.user_id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const birthData = {
        birth_date: updates.birth_date || currentUser.birth_date,
        birth_time: updates.birth_time || currentUser.birth_time,
        birth_location: updates.birth_location || currentUser.birth_location
      };

      if (birthData.birth_date && birthData.birth_location) {
        const personalityService = new PersonalityService(db);
        const personality_profile = await personalityService.generatePersonalityProfile(birthData);
        updates.personality_profile = JSON.stringify(personality_profile);
      }
    }

    const updatedUser = await db.updateUser(req.user.user_id, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile'
    });
  }
});

// Complete onboarding process
router.post('/onboarding', onboardingValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const { coaching_goals, personality_insights_reviewed, initial_session_preferences } = req.body;
    const db = DatabaseService.getInstance();

    // Update user with onboarding completion
    const updates = {
      coaching_goals,
      onboarding_completed: true,
      initial_session_preferences: initial_session_preferences ? JSON.stringify(initial_session_preferences) : null
    };

    const updatedUser = await db.updateUser(req.user.user_id, updates);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate initial personality insights if personality profile exists
    if (updatedUser.personality_profile && personality_insights_reviewed) {
      try {
        const personalityService = new PersonalityService(db);
        await personalityService.generateInitialInsights(
          req.user.user_id, 
          typeof updatedUser.personality_profile === 'string' 
            ? JSON.parse(updatedUser.personality_profile)
            : updatedUser.personality_profile
        );
      } catch (insightError) {
        console.error('Error generating initial insights:', insightError);
        // Don't fail the onboarding if insights generation fails
      }
    }

    // Remove sensitive data
    const { password_hash, ...userProfile } = updatedUser;

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during onboarding completion'
    });
  }
});

// Get personality profile
router.get('/personality', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();
    const user = await db.findUserById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.personality_profile) {
      return res.status(404).json({
        success: false,
        message: 'Personality profile not available. Please complete your birth information.'
      });
    }

    // Get personality insights
    const insights = await db.getUserInsights(req.user.user_id);

    res.json({
      success: true,
      message: 'Personality profile retrieved successfully',
      data: {
        personality_profile: typeof user.personality_profile === 'string' 
          ? JSON.parse(user.personality_profile)
          : user.personality_profile,
        insights: insights
      }
    });

  } catch (error) {
    console.error('Get personality profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving personality profile'
    });
  }
});

// Update coaching goals
router.put('/coaching-goals', coachingGoalsValidation, async (req: AuthenticatedRequest, res: Response) => {
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

    const { coaching_goals } = req.body;
    const db = DatabaseService.getInstance();

    const updatedUser = await db.updateUser(req.user.user_id, { coaching_goals });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Coaching goals updated successfully',
      data: {
        coaching_goals: updatedUser.coaching_goals
      }
    });

  } catch (error) {
    console.error('Update coaching goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating coaching goals'
    });
  }
});

export default router;