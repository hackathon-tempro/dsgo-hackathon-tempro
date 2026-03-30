/**
 * Centralized Error Handling Middleware
 * Processes and formats all errors consistently
 */

import { logAction } from './auditLog.js';

/**
 * Error codes and HTTP status mappings
 */
const ERROR_CODES = {
  // 400 - Bad Request
  INVALID_INPUT: { status: 400, message: 'Invalid input provided' },
  VALIDATION_ERROR: { status: 400, message: 'Validation failed' },
  MISSING_REQUIRED_FIELD: { status: 400, message: 'Missing required field' },
  INVALID_FORMAT: { status: 400, message: 'Invalid format' },
  INVALID_UUID: { status: 400, message: 'Invalid UUID format' },
  INVALID_EORI: { status: 400, message: 'Invalid EORI format' },

  // 401 - Unauthorized
  UNAUTHORIZED: { status: 401, message: 'Unauthorized access' },
  AUTH_REQUIRED: { status: 401, message: 'Authentication required' },
  AUTH_INVALID_TOKEN: { status: 401, message: 'Invalid authentication token' },
  AUTH_TOKEN_EXPIRED: { status: 401, message: 'Authentication token expired' },
  AUTH_FAILED: { status: 401, message: 'Authentication failed' },

  // 403 - Forbidden
  FORBIDDEN: { status: 403, message: 'Access denied' },
  INSUFFICIENT_PERMISSIONS: { status: 403, message: 'Insufficient permissions' },
  ORG_ACCESS_DENIED: { status: 403, message: 'Organization access denied' },
  RESOURCE_OWNERSHIP_ERROR: { status: 403, message: 'You do not own this resource' },

  // 404 - Not Found
  NOT_FOUND: { status: 404, message: 'Resource not found' },
  USER_NOT_FOUND: { status: 404, message: 'User not found' },
  ORGANIZATION_NOT_FOUND: { status: 404, message: 'Organization not found' },
  PRODUCT_NOT_FOUND: { status: 404, message: 'Product not found' },
  CREDENTIAL_NOT_FOUND: { status: 404, message: 'Credential not found' },
  DPP_NOT_FOUND: { status: 404, message: 'Digital Product Passport not found' },

  // 409 - Conflict
  DUPLICATE_EMAIL: { status: 409, message: 'Email already registered' },
  DUPLICATE_EORI: { status: 409, message: 'EORI already registered' },
  RESOURCE_CONFLICT: { status: 409, message: 'Resource conflict' },
  DPP_IMMUTABLE: { status: 409, message: 'DPP is immutable - cannot modify' },

  // 422 - Unprocessable Entity
  BUSINESS_LOGIC_ERROR: { status: 422, message: 'Business logic validation failed' },
  INVALID_STATE_TRANSITION: { status: 422, message: 'Invalid state transition' },
  CREDENTIAL_ISSUANCE_FAILED: { status: 422, message: 'Credential issuance failed' },
  ISHARE_AUTH_FAILED: { status: 422, message: 'iSHARE authentication failed' },
  CREDENCO_SERVICE_ERROR: { status: 422, message: 'Credenco service error' },

  // 429 - Too Many Requests
  RATE_LIMITED: { status: 429, message: 'Too many requests. Please try again later' },

  // 500 - Internal Server Error
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' },
  DATABASE_ERROR: { status: 500, message: 'Database error' },
  SERVICE_UNAVAILABLE: { status: 503, message: 'Service temporarily unavailable' },
  EXTERNAL_SERVICE_ERROR: { status: 502, message: 'External service error' },
};

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(code, message = null, statusCode = null, details = null) {
    super(message || ERROR_CODES[code]?.message || code);
    this.code = code;
    this.statusCode = statusCode || ERROR_CODES[code]?.status || 500;
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super('VALIDATION_ERROR', message, 400);
    this.errors = errors;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTH_FAILED') {
    super(code, message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN') {
    super(code, message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resourceType = 'Resource', code = 'NOT_FOUND') {
    super(code, `${resourceType} not found`, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message, code = 'RESOURCE_CONFLICT') {
    super(code, message, 409);
  }
}

/**
 * Main error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Set default error properties
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = null;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // Log authorization errors
    if (statusCode === 403 || statusCode === 401) {
      console.warn(`[${code}] ${message} | User: ${req.user?.email || 'anonymous'}`);
    }
  }
  // Handle validation errors
  else if (err.name === 'ValidationError' || err.isJoi) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.details || err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'AUTH_INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  // Handle token expiration
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle database errors
  else if (err.name === 'DatabaseError' || err.code === 'ECONNREFUSED') {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database connection error';
    console.error('Database error:', err.message);
  }
  // Handle duplicate key errors
  else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'This record already exists';
  }
  // Handle foreign key constraint errors
  else if (err.code === '23503') {
    statusCode = 422;
    code = 'BUSINESS_LOGIC_ERROR';
    message = 'Invalid reference to related resource';
  }
  // Handle generic errors
  else {
    statusCode = err.statusCode || 500;
    code = err.code || 'INTERNAL_ERROR';
    message = err.message || 'An unexpected error occurred';

    // Log unexpected errors
    console.error(`[${code}] ${message}`);
    console.error('Stack:', err.stack);
  }

  // Log critical errors
  if (statusCode >= 500) {
    console.error(`🔴 CRITICAL ERROR [${code}]:`, {
      message,
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.id || null,
      organizationId: req.user?.organizationId || null,
      timestamp: new Date().toISOString(),
    });
  }

  // Log to audit trail for significant errors
  if (req.user && (statusCode === 401 || statusCode === 403 || statusCode >= 500)) {
    logAction(
      req.user.id,
      req.user.organizationId,
      'ERROR',
      req.path.split('/')[1] || 'unknown',
      null,
      {
        errorCode: code,
        errorMessage: message,
        statusCode,
      }
    ).catch((auditErr) => {
      console.error('Failed to log error to audit trail:', auditErr.message);
    });
  }

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || req.headers['x-request-id'] || 'unknown',
  };

  // Include details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = details || err.message;
    if (err.stack) {
      errorResponse.error.stack = err.stack;
    }
  }

  // Include validation errors
  if (err.errors) {
    errorResponse.error.validationErrors = err.errors;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  const error = new NotFoundError('Endpoint', 'ENDPOINT_NOT_FOUND');
  res.status(404).json({
    success: false,
    error: {
      code: error.code,
      message: `The endpoint ${req.method} ${req.path} does not exist`,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Input validation error formatter
 */
export const formatValidationErrors = (validationResult) => {
  if (validationResult.isEmpty()) {
    return null;
  }

  const errors = validationResult.array().map((err) => ({
    field: err.param,
    message: err.msg,
    value: err.value,
    location: err.location,
  }));

  return errors;
};

/**
 * Safe response formatter
 * Ensures all responses follow consistent structure
 */
export const formatResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Error recovery middleware
 * Attempts to recover from specific error types
 */
export const errorRecovery = (err, req, res, next) => {
  // Retry logic for transient errors
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.message?.includes('ECONNRESET')
  ) {
    console.log('🔄 Attempting to recover from transient error...');
    // Could implement retry logic here
  }

  next(err);
};

export default errorHandler;
