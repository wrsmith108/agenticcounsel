import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../services/database';
import { RedisService } from '../services/redis';
import { PersonalityService } from '../services/personalityService';
// import { User } from '../types'; // Unused for now

const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('first_name').trim().isLength({ min: 1, max: 50 }),
  body('last_name').trim().isLength({ min: 1, max: 50 }),
  body('birth_date').isISO8601().toDate(),
  body('birth_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('birth_location').trim().isLength({ min: 1, max: 100 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register endpoint
router.post('/register', registerValidation, async (req: Request, res: Response) => {
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

    const {
      email,
      password,
      first_name,
      last_name,
      birth_date,
      birth_time,
      birth_location
    } = req.body;

    // Get database service instance (will need to be initialized elsewhere)
    const db = DatabaseService.getInstance();

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate personality profile
    const personalityService = new PersonalityService(db);
    const personality_profile = await personalityService.generatePersonalityProfile({
      birth_date: birth_date,
      birth_time,
      birth_location
    });

    // Create user
    const result = await db.query(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, 
        birth_date, birth_time, birth_location, personality_profile
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING user_id, email, first_name, last_name, birth_date, 
                birth_time, birth_location, personality_profile, 
                coaching_goals, onboarding_completed, created_at`,
      [
        email,
        password_hash,
        first_name,
        last_name,
        birth_date,
        birth_time,
        birth_location,
        JSON.stringify(personality_profile)
      ]
    );

    const user = result.rows[0];

    // Generate JWT token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Store session in Redis
    const redis = RedisService.getInstance();
    await redis.setUserSession(user.user_id, {
      user_id: user.user_id,
      email: user.email,
      login_time: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_location: user.birth_location,
          personality_profile: user.personality_profile,
          coaching_goals: user.coaching_goals,
          onboarding_completed: user.onboarding_completed,
          created_at: user.created_at
        },
        token,
        expires_in: '7d'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  console.log('🔐 LOGIN ATTEMPT:', {
    email: req.body.email,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ LOGIN VALIDATION FAILED:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const db = DatabaseService.getInstance();

    console.log('🔍 SEARCHING FOR USER:', email);

    // Find user
    const result = await db.query(
      `SELECT user_id, email, password_hash, first_name, last_name,
              birth_date, birth_time, birth_location, personality_profile,
              coaching_goals, onboarding_completed, created_at, updated_at
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ USER NOT FOUND:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];
    console.log('✅ USER FOUND:', {
      user_id: user.user_id,
      email: user.email,
      onboarding_completed: user.onboarding_completed,
      created_at: user.created_at
    });

    // Verify password
    console.log('🔑 VERIFYING PASSWORD...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ PASSWORD VERIFICATION FAILED for user:', user.user_id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ PASSWORD VERIFIED for user:', user.user_id);

    // Generate JWT token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      console.log('❌ JWT_SECRET NOT CONFIGURED');
      throw new Error('JWT_SECRET not configured');
    }

    console.log('🎫 GENERATING JWT TOKEN...');
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('✅ JWT TOKEN GENERATED:', {
      user_id: user.user_id,
      token_length: token.length,
      expires_in: '7d'
    });

    // Store session in Redis
    console.log('💾 STORING SESSION IN REDIS...');
    const redis = RedisService.getInstance();
    const sessionData = {
      user_id: user.user_id,
      email: user.email,
      login_time: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    await redis.setUserSession(user.user_id, sessionData);
    console.log('✅ SESSION STORED IN REDIS:', {
      user_id: user.user_id,
      session_expires_at: sessionData.expires_at
    });

    // Update last login
    console.log('📝 UPDATING LAST LOGIN...');
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    console.log('🎉 LOGIN SUCCESSFUL for user:', user.user_id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_location: user.birth_location,
          personality_profile: user.personality_profile,
          coaching_goals: user.coaching_goals,
          onboarding_completed: user.onboarding_completed,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token,
        expires_in: '7d'
      }
    });

  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.user_id;

    // Remove session from Redis
    const redis = RedisService.getInstance();
    await redis.deleteUserSession(userId);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.user_id;

    // Check if session exists in Redis
    const redis = RedisService.getInstance();
    const session = await redis.getUserSession(userId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    // Get fresh user data
    const db = DatabaseService.getInstance();
    const result = await db.query(
      `SELECT user_id, email, first_name, last_name, 
              birth_date, birth_time, birth_location, personality_profile, 
              coaching_goals, onboarding_completed, created_at, updated_at
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    // Generate new token
    const newToken = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Update session in Redis
    await redis.setUserSession(userId, {
      user_id: userId,
      email: user.email,
      login_time: session.login_time,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_location: user.birth_location,
          personality_profile: user.personality_profile,
          coaching_goals: user.coaching_goals,
          onboarding_completed: user.onboarding_completed,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token: newToken,
        expires_in: '7d'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.user_id;

    // Check if session exists in Redis
    const redis = RedisService.getInstance();
    const session = await redis.getUserSession(userId);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired'
      });
    }

    // Get user data
    const db = DatabaseService.getInstance();
    const result = await db.query(
      `SELECT user_id, email, first_name, last_name, 
              birth_date, birth_time, birth_location, personality_profile, 
              coaching_goals, onboarding_completed, created_at, updated_at
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          user_id: user.user_id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_location: user.birth_location,
          personality_profile: user.personality_profile,
          coaching_goals: user.coaching_goals,
          onboarding_completed: user.onboarding_completed,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

export default router;