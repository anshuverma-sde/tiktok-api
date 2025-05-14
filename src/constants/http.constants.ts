export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export const SuccessMessages = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  VERIFIED: 'Email verified successfully',
  LOGIN: 'Login successful',
  REFRESHED: 'Token refreshed',
  RESET_PASSWORD_SENT: 'Password reset email sent',
  RESET_PASSWORD: 'Password reset successful',
  LOGGED_OUT: 'Logged out successfully',
  ALL_LOGGED_OUT: 'All sessions logged out',
  VERIFICATION_EMAIL_SENT: 'Verification email sent',
  PASSWORD_RESET_LINK_SENT: 'If an account exists with this email, you will receive a password reset link',

  // user profile
  PROFILE_FETCHED: 'Profile loaded successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

const errorList = {
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  UNPROCESSABLE_ENTITY: 'Unprocessable entity',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  INVALID_INPUT: 'Invalid input provided',
  EMAIL_REQUIRED: 'Email required',
  EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
  INVALID_EMAIL_PASSWORD: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already exists',
  EMAIL_NOT_VERIFIED: 'Please verify your email first',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Access token expired',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
  TOKEN_REQUIRED: 'Token required',
  REFRESH_TOKEN_REQUIRED: 'Refresh token required',
  TOKEN_PASSWORD_REQUIRED: 'Token and password required',
  USER_NOT_FOUND: 'User not found',
  SESSION_EXPIRED: 'User session has expired. Please log in again',
  INVALID_USER_ID: 'Valid user ID required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  EMAIL_FAILED: 'Failed to send email',
  VERIFICATION_EMAIL_ALREADY_SENT:
    'A verification email was already sent. Please check your inbox or try again after the token expires.',
  ACTIVE_SUBSCRIPTION_REQUIRED: 'Active subscription required',
  INSUFFICIENT_SUBSCRIPTION_PLAN: 'Insufficient subscription plan',
  INVALID_RESOURCE_TYPE: 'Invalid resource type: {resourceType}',
  RESOURCE_LIMIT_REACHED: '{resourceType} limit reached for your plan',
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again after 15 minutes.',
} as const;

// Export ErrorMessages normally
export const ErrorMessages = errorList;

// Create ErrorCodes by mapping keys
export const ErrorCodes = Object.fromEntries(
  Object.keys(errorList).map((key) => [key, key])
) as { [K in keyof typeof errorList]: K };
