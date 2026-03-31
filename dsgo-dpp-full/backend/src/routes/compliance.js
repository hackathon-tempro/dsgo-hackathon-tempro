import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import verificationService from '../services/verificationService.js';

const router = Router();

router.get('/requirements', authMiddleware, asyncHandler(async (req, res) => {
  const { framework } = req.query;

  const requirements = [
    { id: 'REQ-001', name: 'Material Passport Required', type: 'credential', required: true },
    { id: 'REQ-002', name: 'LCA Assessment', type: 'credential', required: true },
    { id: 'REQ-003', name: 'Product Certificate', type: 'credential', required: false },
    { id: 'REQ-004', name: 'DPP Present', type: 'dpp', required: true },
  ];

  res.json({ success: true, data: requirements });
}));

router.post('/check', authMiddleware, validateBody('complianceCheck'), asyncHandler(async (req, res) => {
  const { organizationId, framework, requirements, portfolioAssets } = req.body;

  const complianceResult = await verificationService.performComplianceCheck(
    organizationId,
    'organization',
    organizationId
  );

  res.json({
    success: true,
    data: {
      checkId: uuidv4(),
      organizationId,
      framework,
      requirementsChecked: requirements.length,
      passed: complianceResult.isCompliant,
      score: complianceResult.complianceScore,
      checks: complianceResult.checks,
      checkedAt: new Date().toISOString(),
    },
  });
}));

router.get('/results/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      checkId: id,
      passed: true,
      score: 85,
      details: {},
    },
  });
}));

router.post('/presentations/collect', authMiddleware, asyncHandler(async (req, res) => {
  const { assetIds, requiredCredentialTypes } = req.body;

  res.json({
    success: true,
    data: {
      collectionId: uuidv4(),
      assetIds,
      requiredCredentialTypes,
      presentationsRequested: assetIds.length,
      collectedAt: new Date().toISOString(),
    },
  });
}));

export default router;
