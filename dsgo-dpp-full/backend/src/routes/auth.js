import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, login, hashPassword } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

router.post('/login', validateBody('user'), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await login(email, password);
  res.json({ success: true, data: result });
}));

router.post('/register', validateBody('user'), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, organizationId } = req.body;

  const passwordHash = await hashPassword(password);

  const result = await query(
    `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'active')
     RETURNING id, email, first_name, last_name, role, organization_id`,
    [organizationId, email, passwordHash, firstName, lastName, role || 'user']
  );

  const user = result.rows[0];
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '24h' }
  );

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
    },
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const token = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );

    res.json({ success: true, data: { token } });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
}));

router.post('/verify', authMiddleware, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
}));

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.organization_id,
            o.name as organization_name, o.eori
     FROM users u
     JOIN organizations o ON u.organization_id = o.id
     WHERE u.id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const user = result.rows[0];
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organization: {
        id: user.organization_id,
        name: user.organization_name,
        eori: user.eori,
      },
    },
  });
}));

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

export default router;
