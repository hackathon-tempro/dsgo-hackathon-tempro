import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../database.js';
import { AuthenticationError, AuthorizationError } from './errorHandler.js';
import ishareService from '../services/ishareService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided', 'AUTH_REQUIRED');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token has expired', 'AUTH_TOKEN_EXPIRED');
      }
      throw new AuthenticationError('Invalid token', 'AUTH_INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          organizationId: decoded.organizationId,
          role: decoded.role,
          permissions: decoded.permissions || [],
        };
      } catch (error) {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
    }

    const hasPermission = permissions.every(p => req.user.permissions.includes(p));
    if (!hasPermission) {
      return next(new AuthorizationError('Missing required permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export const requireOrgAccess = (getResourceOrgId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required', 'AUTH_REQUIRED');
      }

      const resourceOrgId = await getResourceOrgId(req);

      if (req.user.organizationId !== resourceOrgId && req.user.role !== 'admin') {
        throw new AuthorizationError('Organization access denied', 'ORG_ACCESS_DENIED');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const ishareDelegationMiddleware = async (req, res, next) => {
  try {
    const delegationEvidence = req.headers['x-delegation-evidence'];

    if (!delegationEvidence) {
      req.delegationVerified = false;
      return next();
    }

    try {
      const delegatorId = req.headers['x-delegator-id'];
      if (!delegatorId) {
        throw new AuthorizationError('Missing delegator ID for delegation verification');
      }

      const verification = await ishareService.verifyDelegationEvidence(delegationEvidence, delegatorId);
      req.delegationVerified = verification.isValid;
      req.delegationEvidence = verification.delegationEvidence;
      next();
    } catch (error) {
      console.warn('Delegation verification failed:', error.message);
      req.delegationVerified = false;
      next();
    }
  } catch (error) {
    next(error);
  }
};

export const requireDelegation = (action, resource) => {
  return async (req, res, next) => {
    if (process.env.ISHARE_SIMULATION_MODE === 'true') {
      return next();
    }

    if (!req.user) {
      return next(new AuthenticationError('Authentication required', 'AUTH_REQUIRED'));
    }

    const delegationEvidence = req.headers['x-delegation-evidence'];
    const delegatorId = req.headers['x-delegator-id'];

    if (!delegationEvidence || !delegatorId) {
      return next(new AuthorizationError('Delegation evidence required for cross-org access'));
    }

    try {
      const verification = await ishareService.verifyDelegationEvidence(delegationEvidence, delegatorId);

      if (!verification.isValid) {
        throw new AuthorizationError('Invalid delegation evidence');
      }

      const delegation = verification.delegationEvidence;
      const hasPermission = delegation.policySets?.some(policySet =>
        policySet.policies?.some(policy =>
          policy.rules?.some(rule =>
            rule.effect === 'Permit' &&
            rule.action?.names?.includes(action) &&
            rule.resource?.values?.includes(resource)
          )
        )
      );

      if (!hasPermission) {
        throw new AuthorizationError('Delegation does not grant required permission');
      }

      req.delegationVerified = true;
      req.delegationEvidence = verification.delegationEvidence;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const login = async (email, password) => {
  const result = await query(
    `SELECT u.*, o.name as organization_name, o.eori, o.id as org_id
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.email = $1 AND u.status = 'active'`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AuthenticationError('Invalid credentials');
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid credentials');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      orgId: user.org_id,
      role: user.role,
      permissions: user.permissions || [],
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  await query(
    'UPDATE users SET last_login = $1 WHERE id = $2',
    [new Date(), user.id]
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organization: {
        id: user.org_id,
        name: user.organization_name,
        eori: user.eori,
      },
    },
  };
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
};

export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export default {
  authMiddleware,
  optionalAuth,
  requireRole,
  requirePermission,
  requireOrgAccess,
  ishareDelegationMiddleware,
  requireDelegation,
  login,
  hashPassword,
  verifyPassword,
};
