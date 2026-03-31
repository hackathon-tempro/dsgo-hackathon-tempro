import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../database.js';
import verificationService from '../services/verificationService.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { credentialId, verificationType } = req.body;

  let result;
  if (verificationType === 'organization') {
    result = await verificationService.verifyOrganization(credentialId);
  } else if (verificationType === 'product') {
    result = await verificationService.verifyProduct(credentialId);
  } else {
    result = await verificationService.verifyCredential(credentialId, req.user.organizationId);
  }

  res.json({ success: true, data: result });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM verifications WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Verification not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/history/:resourceType/:resourceId', authMiddleware, asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;
  const { limit = 50 } = req.query;

  const history = await verificationService.getVerificationHistory(resourceType, resourceId, limit);
  res.json({ success: true, data: history });
}));

router.get('/statistics', authMiddleware, asyncHandler(async (req, res) => {
  const { daysBack = 30 } = req.query;

  const stats = await verificationService.getVerificationStatistics(req.user.organizationId, parseInt(daysBack));
  res.json({ success: true, data: stats });
}));

router.post('/batch', authMiddleware, asyncHandler(async (req, res) => {
  const { credentialIds } = req.body;

  const result = await verificationService.batchVerifyCredentials(credentialIds, req.user.organizationId);
  res.json({ success: true, data: result });
}));

export default router;
