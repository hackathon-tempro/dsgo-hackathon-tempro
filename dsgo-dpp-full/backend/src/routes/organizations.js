import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, validateQuery, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, validateQuery('pagination'), asyncHandler(async (req, res) => {
  const { page = 0, limit = 50 } = req.query;
  const offset = page * limit;

  const result = await query(
    `SELECT id, name, eori, website, address, contact_email, phone, status, verified, created_at
     FROM organizations
     ORDER BY name ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await query('SELECT COUNT(*) as total FROM organizations');

  res.json({
    success: true,
    data: {
      organizations: result.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    },
  });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT o.*, 
            (SELECT COUNT(*) FROM users WHERE organization_id = o.id) as user_count,
            (SELECT COUNT(*) FROM credentials WHERE organization_id = o.id) as credential_count,
            (SELECT COUNT(*) FROM digital_product_passports WHERE organization_id = o.id) as dpp_count
     FROM organizations o
     WHERE o.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Organization not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/', authMiddleware, validateBody('organization'), asyncHandler(async (req, res) => {
  const { name, eori, website, address, contactEmail, phone } = req.body;

  const result = await query(
    `INSERT INTO organizations (name, eori, website, address, contact_email, phone, status, verified)
     VALUES ($1, $2, $3, $4, $5, $6, 'active', false)
     RETURNING *`,
    [name, eori, website, address, contactEmail, phone]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.organizationId !== id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const { name, website, address, contactEmail, phone } = req.body;

  const result = await query(
    `UPDATE organizations 
     SET name = COALESCE($1, name),
         website = COALESCE($2, website),
         address = COALESCE($3, address),
         contact_email = COALESCE($4, contact_email),
         phone = COALESCE($5, phone),
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [name, website, address, contactEmail, phone, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Organization not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/:id/users', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT id, email, first_name, last_name, role, status, last_login, created_at
     FROM users
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [id]
  );

  res.json({ success: true, data: result.rows });
}));

export default router;
