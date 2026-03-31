import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all certifications (with optional status filter)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { status } = req.query;
  let queryText = 'SELECT * FROM certifications WHERE issuer = $1';
  const params = [req.user.organizationId];

  if (status === 'pending') {
    queryText += ' AND is_revoked = false AND issue_date IS NULL';
  } else if (status === 'issued') {
    queryText += ' AND is_revoked = false AND issue_date IS NOT NULL';
  } else if (status === 'active') {
    queryText += ' AND is_revoked = false AND expiration_date > NOW()';
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  res.json({ success: true, data: result.rows });
}));

router.get('/pending', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT * FROM certifications 
     WHERE issuer = $1 AND is_revoked = false
     ORDER BY created_at DESC`,
    [req.user.organizationId]
  );

  res.json({ success: true, data: result.rows });
}));

router.post('/:id/approve', authMiddleware, validateBody('certification'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dppId, certificateType, issuer, issueDate, expirationDate, standard } = req.body;
  const certificateId = uuidv4();

  const result = await query(
    `INSERT INTO certifications (
      certificate_id, organization_id, dpp_id, certificate_type, 
      issuer, issue_date, expiration_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [certificateId, req.user.organizationId, dppId, certificateType, issuer, issueDate, expirationDate]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM certifications WHERE id = $1 OR certificate_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Certificate not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/:id/revoke', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await query(
    `UPDATE certifications 
     SET is_revoked = true, revocation_reason = $1
     WHERE id = $2 OR certificate_id = $2
     RETURNING *`,
    [reason, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Certificate not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

export default router;
