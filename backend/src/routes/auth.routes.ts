import { Router } from 'express';
import {
  googleAuth,
  googleCallback,
  logout,
  getCurrentUser,
  refreshToken
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Google OAuth routes
router.post('/google', googleAuth);
router.post('/google/callback', googleCallback);

// Token refresh
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', authenticate, logout);

// Get current user
router.get('/me', authenticate, getCurrentUser);

export default router;
