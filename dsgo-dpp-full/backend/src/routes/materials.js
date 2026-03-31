import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { materialName, materialType, unit, originCountry, specifications } = req.body;
  const materialId = uuidv4();

  const result = await query(
    `INSERT INTO products (organization_id, product_id, name, description, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.organizationId, `MAT-${materialId.substring(0, 8)}`, materialName, specifications, materialType]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM products WHERE id = $1 OR product_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Material not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/lots', authMiddleware, validateBody('lot'), asyncHandler(async (req, res) => {
  const { materialId, quantity, batchNumber, manufacturingDate, expiryDate, certifications } = req.body;
  const lotId = uuidv4();

  const result = await query(
    `INSERT INTO materials (dpp_id, material_name, material_type, percentage, quantity, unit, supplier_name, origin_country, certifications)
     VALUES ($1, (SELECT name FROM products WHERE id = $2), $3, $4, $5, $6, (SELECT name FROM organizations WHERE id = $7), $8, $9)
     RETURNING *`,
    [materialId, materialId, null, null, quantity, 'units', req.user.organizationId, null, JSON.stringify(certifications || [])]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/lots/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM materials WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Lot not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/lots/:id/recyclability', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM materials WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Lot not found' });
  }

  const material = result.rows[0];

  res.json({
    success: true,
    data: {
      lotId: id,
      materialName: material.material_name,
      materialType: material.material_type,
      originCountry: material.origin_country,
      certifications: material.certifications,
      recyclabilityInfo: {
        recyclable: true,
        recyclingCode: material.material_type === 'Metal' ? '41' : '70',
        estimatedRecyclingRate: 0.85,
      },
    },
  });
}));

export default router;
