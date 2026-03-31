import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, validateBody('assetHandover'), asyncHandler(async (req, res) => {
  const { transactionId, assetId, fromOrganizationId, toOrganizationId, handoverDate, handoverNotes } = req.body;
  const handoverId = uuidv4();

  const result = await query(
    `INSERT INTO assets (asset_id, organization_id, asset_type, description, status)
     VALUES ($1, $2, 'building', $3, 'handed_over')
     ON CONFLICT (asset_id) DO UPDATE SET status = 'handed_over', updated_at = NOW()
     RETURNING *`,
    [assetId, toOrganizationId, handoverNotes]
  );

  res.status(201).json({
    success: true,
    data: {
      handoverId,
      transactionId,
      assetId,
      fromOrganizationId,
      toOrganizationId,
      handoverDate,
      notes: handoverNotes,
      status: 'completed',
    },
  });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      handoverId: id,
      status: 'completed',
    },
  });
}));

router.post('/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acceptanceNotes, conditionAssessment } = req.body;

  res.json({
    success: true,
    data: {
      handoverId: id,
      acceptedBy: req.user.organizationId,
      acceptedAt: new Date().toISOString(),
      notes: acceptanceNotes,
      condition: conditionAssessment,
      status: 'accepted',
    },
  });
}));

export default router;
