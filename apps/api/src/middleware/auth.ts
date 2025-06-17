import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { User } from '../types';

interface AuthenticatedRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new AppError('Server configuration error', 500, 'CONFIG_ERROR');
    }

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.user_id) {
      throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN');
    }

    // In a real implementation, you would fetch the user from the database
    // For now, we'll use the decoded token data
    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      birth_date: decoded.birth_date,
      birth_time: decoded.birth_time,
      birth_location: decoded.birth_location,
      personality_profile: decoded.personality_profile,
      coaching_goals: decoded.coaching_goals,
      onboarding_completed: decoded.onboarding_completed,
      created_at: decoded.created_at,
      updated_at: decoded.updated_at
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Authentication token has expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (decoded.user_id) {
      req.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        birth_date: decoded.birth_date,
        birth_time: decoded.birth_time,
        birth_location: decoded.birth_location,
        personality_profile: decoded.personality_profile,
        coaching_goals: decoded.coaching_goals,
        onboarding_completed: decoded.onboarding_completed,
        created_at: decoded.created_at,
        updated_at: decoded.updated_at
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

export const generateToken = (user: Omit<User, 'password_hash'>): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  const expiresIn: string = process.env['JWT_EXPIRES_IN'] || '1h';
  
  if (!jwtSecret) {
    throw new AppError('Server configuration error', 500, 'CONFIG_ERROR');
  }

  const options = { expiresIn } as SignOptions;
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      onboarding_completed: user.onboarding_completed
    },
    jwtSecret,
    options
  );
};

export const generateRefreshToken = (userId: string): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  const expiresIn: string = process.env['REFRESH_TOKEN_EXPIRES_IN'] || '7d';
  
  if (!jwtSecret) {
    throw new AppError('Server configuration error', 500, 'CONFIG_ERROR');
  }

  const options = { expiresIn } as SignOptions;
  return jwt.sign(
    { user_id: userId, type: 'refresh' },
    jwtSecret,
    options
  );
};

export { AuthenticatedRequest };