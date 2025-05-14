import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import env from '../config/env';
import ErrorHandler from '../utils/errorHandler.util';
import { IUser, User } from '../models/user.model';
import { ISubscription } from '../models/subscription.model';
import { IPlan } from '../models/plan.model';
import { Session } from '../models/session.model';
import {
  HttpStatus,
  ErrorMessages,
  ErrorCodes,
} from '../constants/http.constants';
import logger from '../utils/logger.util';

// Type for the lean user with populated subscription and plan
type LeanUser = Omit<IUser, 'subscription'> & {
  _id: mongoose.Types.ObjectId;
  subscription?: ISubscription & { plan?: IPlan };
  __v?: number;
};

export interface AuthRequest extends Request {
  user?: LeanUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // First check cookie-based token (primary method)
  const cookieToken = req.cookies.accessToken;
  // Fallback to Authorization header if cookies are not present
  const headerToken = req.headers.authorization?.split(' ')[1];
  
  const token = cookieToken || headerToken;
  
  logger.debug(`Auth attempt - Cookie token: ${cookieToken ? 'Present' : 'Missing'}, Header token: ${headerToken ? 'Present' : 'Missing'}`);

  if (!token) {
    logger.warn('Authentication failed: No token provided');
    return next(
      new ErrorHandler(
        ErrorMessages.TOKEN_REQUIRED,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.TOKEN_REQUIRED,
      ),
    );
  }

  try {
    const decoded = jwt.verify(token, env.accessTokenSecret) as {
      userId: string;
      role: string;
    };
    
    logger.debug(`Token verified for user: ${decoded.userId}`);
    
    // Find active session
    const session = await Session.findOne({
      accessToken: token,
      userId: decoded.userId,
      accessTokenExpiresAt: { $gt: new Date() }  // Ensure token hasn't expired
    });
    
    if (!session) {
      logger.warn(`No active session found for user: ${decoded.userId}`);
      return next(
        new ErrorHandler(
          ErrorMessages.INVALID_TOKEN,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.INVALID_TOKEN,
        ),
      );
    }
    
    logger.debug(`Valid session found, expires: ${session.accessTokenExpiresAt}`);
    
    const user = await User.findById(decoded.userId)
      .populate<{
        subscription: ISubscription & { plan?: IPlan };
      }>({
        path: 'subscription',
        populate: { path: 'plan', model: 'Plan' },
      })
      .lean({ virtuals: true });
      
    if (!user) {
      logger.warn(`User not found: ${decoded.userId}`);
      return next(
        new ErrorHandler(
          ErrorMessages.USER_NOT_FOUND,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.USER_NOT_FOUND,
        ),
      );
    }
    
    if (!user.active) {
      logger.warn(`Inactive user attempted access: ${decoded.userId}`);
      return next(
        new ErrorHandler(
          ErrorMessages.ACCOUNT_INACTIVE,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.ACCOUNT_INACTIVE,
        ),
      );
    }
    
    logger.debug(`Authentication successful for user: ${decoded.userId}`);
    req.user = user as LeanUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Token expired: ${error.message}`);
      return next(
        new ErrorHandler(
          ErrorMessages.TOKEN_EXPIRED,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.TOKEN_EXPIRED,
        ),
      );
    }
    logger.error(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return next(
      new ErrorHandler(
        ErrorMessages.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.INVALID_TOKEN,
      ),
    );
  }
};

// Helper function to check roles
const checkRolePermissions = (
  user: LeanUser,
  roles: string[],
  next: NextFunction
): boolean => {
  if (roles.length && !roles.includes(user.role)) {
    next(
      new ErrorHandler(
        ErrorMessages.INSUFFICIENT_PERMISSIONS,
        HttpStatus.FORBIDDEN,
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
      ),
    );
    return false;
  }
  return true;
};

// Helper function to check subscription is active
const checkActiveSubscription = (
  subscription: ISubscription & { plan?: IPlan } | undefined,
  next: NextFunction
): boolean => {
  if (!subscription || !subscription.plan || subscription.status !== 'active') {
    next(
      new ErrorHandler(
        ErrorMessages.ACTIVE_SUBSCRIPTION_REQUIRED,
        HttpStatus.FORBIDDEN,
        ErrorCodes.ACTIVE_SUBSCRIPTION_REQUIRED,
      ),
    );
    return false;
  }
  return true;
};

// Helper function to check plan permissions
const checkPlanPermissions = (
  subscription: ISubscription & { plan: IPlan },
  planNames: string[],
  next: NextFunction
): boolean => {
  if (planNames.length && !planNames.includes(subscription.plan.name)) {
    next(
      new ErrorHandler(
        ErrorMessages.INSUFFICIENT_SUBSCRIPTION_PLAN,
        HttpStatus.FORBIDDEN,
        ErrorCodes.INSUFFICIENT_SUBSCRIPTION_PLAN,
      ),
    );
    return false;
  }
  return true;
};

// Helper function to check resource limits
const checkResourceLimits = (
  subscription: ISubscription & { plan: IPlan },
  resourceType: string,
  next: NextFunction
): boolean => {
  const resourceLimit = subscription.plan.resourceLimits[resourceType];
  const resourceUsage = subscription.resourceUsage[resourceType] || 0;
  
  if (resourceLimit === undefined) {
    next(
      new ErrorHandler(
        ErrorMessages.INVALID_RESOURCE_TYPE.replace(
          '{resourceType}',
          resourceType,
        ),
        HttpStatus.BAD_REQUEST,
        ErrorCodes.INVALID_RESOURCE_TYPE,
      ),
    );
    return false;
  }
  
  if (resourceUsage >= resourceLimit) {
    next(
      new ErrorHandler(
        ErrorMessages.RESOURCE_LIMIT_REACHED.replace(
          '{resourceType}',
          resourceType,
        ),
        HttpStatus.FORBIDDEN,
        ErrorCodes.RESOURCE_LIMIT_REACHED,
      ),
    );
    return false;
  }
  
  return true;
};

export const restrictAccess = (
  roles: string[] = [],
  planNames: string[] = [],
  resourceType?: string,
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const user = req.user;
    if (!user) {
      return next(
        new ErrorHandler(
          ErrorMessages.UNAUTHORIZED,
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.UNAUTHORIZED,
        ),
      );
    }

    // Check role permissions
    if (!checkRolePermissions(user, roles, next)) {
      return;
    }

    // Only check subscription-related restrictions if needed
    if (planNames.length || resourceType) {
      const subscription = user.subscription;
      
      // Check subscription is active
      if (!checkActiveSubscription(subscription, next)) {
        return;
      }
      
      // Verify plan name if specified
      if (!checkPlanPermissions(subscription as ISubscription & { plan: IPlan }, planNames, next)) {
        return;
      }
      
      // Check resource limit if specified
      if (resourceType && !checkResourceLimits(subscription as ISubscription & { plan: IPlan }, resourceType, next)) {
        return;
      }
    }

    next();
  };
};
