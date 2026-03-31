import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, validateBody('transaction'), asyncHandler(async (req, res) => {
  const { fromOrganizationId, toOrganizationId, productId, quantity, transactionType, amount, metadata } = req.body;
  const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8)}`;

  const result = await query(
    `INSERT INTO transactions (transaction_id, organization_id, transaction_type, amount, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [transactionId, req.user.organizationId, transactionType, amount, JSON.stringify(metadata || {})]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM transactions WHERE id = $1 OR transaction_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Transaction not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.put('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'disputed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const result = await query(
    `UPDATE transactions 
     SET status = $1
     WHERE id = $2 OR transaction_id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Transaction not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

export default router;
