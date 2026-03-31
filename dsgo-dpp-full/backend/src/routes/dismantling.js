import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from '../services/dppService.js';

const router = Router();

router.post('/intake', authMiddleware, validateBody('dismantling'), asyncHandler(async (req, res) => {
  const { dppId, facilityId, dismantlingDate, outcome, components } = req.body;
  const dismantlingId = uuidv4();

  await dppService.appendToDPP({
    dppId,
    organizationId: req.user.organizationId,
    eventType: 'DISMANTLING',
    eventData: {
      dismantlingId,
      facilityId,
      dismantlingDate,
      outcome,
      components,
      processedBy: req.user.organizationId,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      dismantlingId,
      dppId,
      facilityId,
      dismantlingDate,
      outcome,
      components,
      status: 'intake_completed',
      receivedAt: new Date().toISOString(),
    },
  });
}));

router.post('/outcomes', authMiddleware, asyncHandler(async (req, res) => {
  const { dismantlingId, recoveredComponents, materialWeights, recyclingDetails } = req.body;

  res.json({
    success: true,
    data: {
      outcomeId: uuidv4(),
      dismantlingId,
      recoveredComponents,
      materialWeights,
      recyclingDetails,
      recordedAt: new Date().toISOString(),
    },
  });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      dismantlingId: id,
      status: 'completed',
      outcome: 'RECYCLED',
    },
  });
}));

export default router;
