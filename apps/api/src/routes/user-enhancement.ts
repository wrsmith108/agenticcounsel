import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { PersonalityService } from '../services/personalityService';
import { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Validation middleware for birth data updates
const birthDateValidation = [
  body('birth_date').isISO8601().toDate()
];

const birthTimeValidation = [
  body('birth_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
];

const birthLocationValidation = [
  body('birth_location').trim().isLength({ min: 1, max: 100 })
];

const completeEnhancementValidation = [
  body('birth_date').isISO8601().toDate(),
  body('birth_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('birth_location').trim().isLength({ min: 1, max: 100 })
];

// Add birth date only (Tier 1 → Tier 2)
router.patch('/add-birth-date', birthDateValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    const { birth_date } = req.body;
    const db = DatabaseService.getInstance();

    // Get current user data
    const userResult = await db.query(
      'SELECT * FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = userResult.rows[0];
    
    // Regenerate personality profile with birth date
    const personalityService = new PersonalityService(db);
    const enhancedProfile = await personalityService.generatePersonalityProfile({
      birth_date: birth_date,
      birth_time: currentUser.birth_time,
      birth_location: currentUser.birth_location
    });

    // Update user record
    const updateResult = await db.query(
      `UPDATE users SET 
        birth_date = $1,
        personality_profile = $2,
        profile_completeness_tier = $3,
        birth_data_added_at = COALESCE(birth_data_added_at, NOW()),
        updated_at = NOW()
      WHERE user_id = $4
      RETURNING user_id, birth_date, profile_completeness_tier`,
      [
        birth_date,
        JSON.stringify(enhancedProfile),
        2, // Tier 2: birth date added
        req.user.user_id
      ]
    );

    const updatedUser = updateResult.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Birth date added successfully',
      data: {
        user: updatedUser,
        personality_profile: enhancedProfile,
        enhancement_unlocked: {
          tier_upgrade: '1 → 2',
          new_features: ['Sun Sign Analysis', 'Moon Sign Insights'],
          accuracy_improvement: '30% → 60%'
        }
      }
    });

  } catch (error) {
    console.error('Error adding birth date:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add complete birth data (Tier 1/2 → Tier 3)
router.patch('/complete-profile', completeEnhancementValidation, async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    const { birth_date, birth_time, birth_location } = req.body;
    const db = DatabaseService.getInstance();

    // Get current user data
    const userResult = await db.query(
      'SELECT profile_completeness_tier FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentTier = userResult.rows[0].profile_completeness_tier;
    
    // Regenerate personality profile with complete data
    const personalityService = new PersonalityService(db);
    const completeProfile = await personalityService.generatePersonalityProfile({
      birth_date: birth_date,
      birth_time: birth_time,
      birth_location: birth_location
    });

    // Update user record with complete data
    const updateResult = await db.query(
      `UPDATE users SET 
        birth_date = $1,
        birth_time = $2,
        birth_location = $3,
        personality_profile = $4,
        profile_completeness_tier = $5,
        birth_data_added_at = COALESCE(birth_data_added_at, NOW()),
        updated_at = NOW()
      WHERE user_id = $6
      RETURNING user_id, birth_date, birth_time, birth_location, profile_completeness_tier`,
      [
        birth_date,
        birth_time,
        birth_location,
        JSON.stringify(completeProfile),
        3, // Tier 3: complete profile
        req.user.user_id
      ]
    );

    const updatedUser = updateResult.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        user: updatedUser,
        personality_profile: completeProfile,
        enhancement_unlocked: {
          tier_upgrade: `${currentTier} → 3`,
          new_features: ['Rising Sign', 'Complete Houses', 'Aspects', 'Full Chart'],
          accuracy_improvement: `${currentTier === 1 ? '30%' : '60%'} → 85%`
        }
      }
    });

  } catch (error) {
    console.error('Error completing profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get profile completion status
router.get('/completion-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const db = DatabaseService.getInstance();
    const userResult = await db.query(
      `SELECT 
        profile_completeness_tier,
        birth_date,
        birth_time,
        birth_location,
        birth_data_added_at,
        last_enhancement_prompt_at
      FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const tier = user.profile_completeness_tier;

    // Calculate what's missing and available
    const status = {
      current_tier: tier,
      completion_percentage: tier === 1 ? 33 : tier === 2 ? 66 : 100,
      available_components: getAvailableComponents(tier),
      missing_components: getMissingComponents(user),
      next_upgrade: getNextUpgrade(tier),
      enhancement_benefits: getEnhancementBenefits(tier)
    };

    return res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting completion status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper methods for completion status
function getAvailableComponents(tier: number): string[] {
  const components = {
    1: ['Basic Personality Analysis'],
    2: ['Sun Sign', 'Moon Sign', 'Basic Astrological Insights'],
    3: ['Complete Birth Chart', 'Rising Sign', 'Houses', 'Aspects', 'Full Astrological Analysis']
  };
  return components[tier as keyof typeof components] || [];
}

function getMissingComponents(user: any): string[] {
  const missing: string[] = [];
  if (!user.birth_date) missing.push('Birth Date');
  if (!user.birth_time) missing.push('Birth Time');
  if (!user.birth_location) missing.push('Birth Location');
  return missing;
}

function getNextUpgrade(tier: number): string | null {
  const upgrades = {
    1: 'Add birth date to unlock Sun and Moon sign insights',
    2: 'Add birth time and location to unlock complete astrological chart',
    3: null // Already complete
  };
  return upgrades[tier as keyof typeof upgrades] || null;
}

function getEnhancementBenefits(tier: number): string[] {
  const benefits = {
    1: [
      'Unlock Sun and Moon sign analysis',
      'Increase accuracy from 30% to 60%',
      'Access astrological personality insights'
    ],
    2: [
      'Unlock rising sign and complete chart',
      'Access house placements and aspects',
      'Increase accuracy from 60% to 85%',
      'Full cosmic personality blueprint'
    ],
    3: [] // Already has all benefits
  };
  return benefits[tier as keyof typeof benefits] || [];
}

export default router;