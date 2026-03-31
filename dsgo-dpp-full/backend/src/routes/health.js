import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../database.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { dbHealthCheck } = await import('../database.js');
  const dbHealth = await dbHealthCheck();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status,
      },
    },
  });
}));

router.get('/audit-log', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 0, limit = 100 } = req.query;
  const offset = page * limit;

  let whereClause = '';
  const params = [req.user.organizationId];
  let paramIndex = 2;

  if (req.user.role !== 'admin') {
    whereClause = 'WHERE organization_id = $1';
  }

  const result = await query(
    `SELECT * FROM audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  res.json({ success: true, data: result.rows });
}));

export default router;
