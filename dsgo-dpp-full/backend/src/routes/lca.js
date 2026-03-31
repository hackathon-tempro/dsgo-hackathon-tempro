import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/projects', authMiddleware, validateBody('lcaProject'), asyncHandler(async (req, res) => {
  const { dppId, methodology, scope, boundary } = req.body;
  const projectId = uuidv4();

  const result = await query(
    `INSERT INTO lca_assessments (lca_id, dpp_id, organization_id, methodology, assessment_date)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [projectId, dppId, req.user.organizationId, methodology]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/projects/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM lca_assessments WHERE id = $1 OR lca_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'LCA project not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/results', authMiddleware, validateBody('lcaResult'), asyncHandler(async (req, res) => {
  const { projectId, carbonFootprint, waterFootprint, wasteGenerated, renewableEnergyPercentage, assessmentDate, validUntil } = req.body;

  const result = await query(
    `UPDATE lca_assessments 
     SET carbon_footprint = $1, water_footprint = $2, waste_generated = $3,
         renewable_energy_percentage = $4, assessment_date = $5, valid_until = $6
     WHERE id = $7 OR lca_id = $7
     RETURNING *`,
    [carbonFootprint, waterFootprint, wasteGenerated, renewableEnergyPercentage, assessmentDate, validUntil, projectId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'LCA project not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/results/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM lca_assessments WHERE id = $1 OR lca_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'LCA result not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/documents', authMiddleware, asyncHandler(async (req, res) => {
  const { projectId, documentType, documentUrl, description } = req.body;

  res.json({
    success: true,
    data: {
      documentId: uuidv4(),
      projectId,
      type: documentType,
      url: documentUrl,
      description,
      uploadedAt: new Date().toISOString(),
    },
  });
}));

router.get('/pending-review', authMiddleware, asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT * FROM lca_assessments 
     WHERE organization_id = $1 AND valid_until IS NULL
     ORDER BY created_at DESC`,
    [req.user.organizationId]
  );

  res.json({ success: true, data: result.rows });
}));

router.post('/:id/approve', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `UPDATE lca_assessments 
     SET valid_until = NOW() + INTERVAL '1 year'
     WHERE id = $1 OR lca_id = $1
     RETURNING *`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'LCA project not found' });
  }

  res.json({ success: true, data: result.rows[0], message: 'LCA approved for certification' });
}));

export default router;
