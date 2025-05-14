import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

export default router;
