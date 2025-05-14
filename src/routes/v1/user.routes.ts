import express from 'express';
import { me, updateProfile, changePassword } from '../../controllers/user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { updateProfileSchema, changePasswordSchema } from '../../validators/user.validator';

const router = express.Router();

/**
 * @openapi
 * /api/v1/user/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Returns the profile of the currently authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile fetched
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, me);

/**
 * @openapi
 * /api/v1/user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the name, email, and company name of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               companyName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticate, validateRequest(updateProfileSchema), updateProfile);

/**
 * @openapi
 * /api/v1/user/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the password of the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or passwords don't match
 *       401:
 *         description: Unauthorized or incorrect current password
 */
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), changePassword);

export default router;
