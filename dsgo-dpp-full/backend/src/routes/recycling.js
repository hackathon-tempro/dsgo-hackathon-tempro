import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from '../services/dppService.js';

const router = Router();

router.post('/intake', authMiddleware, validateBody('recycling'), asyncHandler(async (req, res) => {
  const { lotId, facilityId, processType, weight, recyclingPercentage } = req.body;
  const recyclingId = uuidv4();

  res.status(201).json({
    success: true,
    data: {
      recyclingId,
      lotId,
      facilityId,
      processType,
      weight,
      recyclingPercentage,
      status: 'intake_received',
      receivedAt: new Date().toISOString(),
    },
  });
}));

router.post('/events', authMiddleware, asyncHandler(async (req, res) => {
  const { lotId, eventType, location, timestamp, processingDetails } = req.body;

  const lot = await query('SELECT * FROM materials WHERE id = $1', [lotId]);

  res.json({
    success: true,
    data: {
      eventId: uuidv4(),
      lotId,
      eventType,
      location,
      timestamp: timestamp || new Date().toISOString(),
      processingDetails,
      recordedAt: new Date().toISOString(),
    },
  });
}));

router.get('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      recyclingId: id,
      status: 'completed',
      recyclingPercentage: 0.85,
      finalMaterial: 'recycled_aluminum',
    },
  });
}));

export default router;
