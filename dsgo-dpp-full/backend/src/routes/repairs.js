import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from '../services/dppService.js';

const router = Router();

router.post('/', authMiddleware, validateBody('repair'), asyncHandler(async (req, res) => {
  const { dppId, repairType, description, repairDate, repairedBy, parts, cost } = req.body;
  const repairId = uuidv4();

  const result = await query(
    `INSERT INTO repairs (repair_id, dpp_id, organization_id, repair_type, description, repair_date, repaired_by, parts, cost)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [repairId, dppId, req.user.organizationId, repairType, description, repairDate, repairedBy, JSON.stringify(parts || []), cost]
  );

  await dppService.appendToDPP({
    dppId,
    organizationId: req.user.organizationId,
    eventType: 'REPAIR',
    eventData: {
      repairId,
      repairType,
      description,
      repairDate,
      repairedBy,
      parts,
      cost,
    },
  });

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM repairs WHERE id = $1 OR repair_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Repair record not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/access-grants', authMiddleware, validateBody('accessGrant'), asyncHandler(async (req, res) => {
  const { resourceOwnerId, requesterId, resourceType, resourceId, accessLevel, expiresAt, purpose } = req.body;

  res.status(201).json({
    success: true,
    data: {
      grantId: uuidv4(),
      resourceOwnerId,
      requesterId,
      resourceType,
      resourceId,
      accessLevel: accessLevel || 'READ',
      expiresAt,
      purpose,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
}));

router.get('/access-grants/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      grantId: id,
      status: 'active',
    },
  });
}));

export default router;
