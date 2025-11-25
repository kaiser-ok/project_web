import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (userId: number, email: string, role: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { id: userId, email, role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId: number): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(
    { id: userId, type: 'refresh' },
    jwtSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};

// Google OAuth - Verify token
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      throw new AppError('Credential is required', 400);
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token', 401);
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = await User.create({
        username: email.split('@')[0],
        email,
        fullName: name || undefined,
        googleId,
        avatar: picture || undefined,
        role: 'member',
        isActive: true
      });
    } else {
      // Update existing user
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Generate tokens
    const accessToken = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Google auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
};

// Google OAuth callback (for traditional OAuth flow)
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    // This would handle the OAuth callback if using redirect flow
    // For now, we're using the credential flow from frontend
    res.json({ message: 'Use POST /api/auth/google with credential' });
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Refresh access token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtSecret) as {
      id: number;
      type: string;
    };

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    // Get user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new access token
    const accessToken = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid refresh token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Refresh token expired' });
    } else if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }
};

// Logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // In a production app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Get current user
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
};
