import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from '../services/dppService.js';

const router = Router();

router.post('/', authMiddleware, validateBody('product'), asyncHandler(async (req, res) => {
  const { name, description, category, sku, epcCode } = req.body;
  const productId = uuidv4();

  const result = await query(
    `INSERT INTO products (organization_id, product_id, name, description, category, sku, epc_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.user.organizationId, productId, name, description, category, sku, epcCode]
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
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/:id/bom', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { components } = req.body;

  const product = await query(
    'SELECT * FROM products WHERE id = $1 OR product_id = $1',
    [id]
  );

  if (product.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const bomData = {
    productId: id,
    components: components || [],
    createdBy: req.user.organizationId,
    createdAt: new Date().toISOString(),
  };

  res.json({ success: true, data: bomData });
}));

router.get('/:id/bom', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      productId: id,
      components: [],
      message: 'BOM not yet defined',
    },
  });
}));

router.post('/instances', authMiddleware, asyncHandler(async (req, res) => {
  const { productId, serialNumber, manufacturingDate, batchId } = req.body;

  const dpp = await dppService.createDPP({
    organizationId: req.user.organizationId,
    productId,
    productName: 'Product Instance',
    productType: 'manufactured',
    batchId: batchId || `BATCH-${Date.now()}`,
    manufacturingDate: manufacturingDate || new Date(),
  });

  res.status(201).json({ success: true, data: dpp });
}));

router.get('/instances/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const dpp = await dppService.getDPP(id);
  res.json({ success: true, data: dpp });
}));

export default router;
