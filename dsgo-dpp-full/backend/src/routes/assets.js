import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { assetId, assetType, description, metadata } = req.body;

  const result = await query(
    `INSERT INTO assets (asset_id, organization_id, asset_type, description, status, metadata)
     VALUES ($1, $2, $3, $4, 'active', $5)
     RETURNING *`,
    [assetId, req.user.organizationId, assetType || 'building', description, JSON.stringify(metadata || {})]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM assets WHERE id = $1 OR asset_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Asset not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/:id/dpps', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT d.* FROM digital_product_passports d
     JOIN assets a ON d.product_id = a.asset_id OR d.batch_id = a.asset_id
     WHERE a.id = $1 OR a.asset_id = $1`,
    [id]
  );

  res.json({ success: true, data: result.rows });
}));

router.post('/:id/update', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, metadata } = req.body;

  const result = await query(
    `UPDATE assets 
     SET description = COALESCE($1, description),
         metadata = COALESCE($2, metadata),
         updated_at = NOW()
     WHERE id = $3 OR asset_id = $3
     RETURNING *`,
    [description, JSON.stringify(metadata || {}), id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Asset not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

export default router;
