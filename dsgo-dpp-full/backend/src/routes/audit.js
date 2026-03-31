import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import auditService from '../services/auditService.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all audit requests
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

// Get audit requests
router.get('/requests', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.post('/requests', authMiddleware, validateBody('auditRequest'), asyncHandler(async (req, res) => {
  const { organizationId, auditorId, scope, startDate, endDate, resources } = req.body;
  const requestId = uuidv4();

  const result = await query(
    `INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details)
     VALUES ($1, $2, 'AUDIT_REQUEST', 'audit_request', $3, $4)`,
    [auditorId, organizationId, requestId, JSON.stringify({ scope, startDate, endDate, resources })]
  );

  res.status(201).json({
    success: true,
    data: {
      requestId,
      organizationId,
      auditorId,
      scope,
      startDate,
      endDate,
      resources,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
}));

router.get('/requests/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      requestId: id,
      status: 'pending',
    },
  });
}));

router.post('/approve', authMiddleware, asyncHandler(async (req, res) => {
  const { auditRequestId, accessGrant } = req.body;

  res.json({
    success: true,
    data: {
      requestId: auditRequestId,
      status: 'approved',
      accessGranted: accessGrant || true,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}));

router.post('/submit', authMiddleware, validateBody('auditSubmission'), asyncHandler(async (req, res) => {
  const { auditRequestId, credentials } = req.body;

  res.json({
    success: true,
    data: {
      submissionId: uuidv4(),
      auditRequestId,
      credentialsCount: credentials.length,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    },
  });
}));

router.post('/records', authMiddleware, asyncHandler(async (req, res) => {
  const { auditRequestId, findings, recommendations } = req.body;

  const result = await auditService.createAuditEntry({
    userId: req.user.id,
    organizationId: req.user.organizationId,
    action: 'AUDIT_RECORD',
    resourceType: 'audit_record',
    resourceId: uuidv4(),
    status: 'completed',
    details: {
      auditRequestId,
      findings,
      recommendations,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.get('/records/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const logs = await auditService.getResourceAuditTrail('audit_record', id);

  res.json({ success: true, data: logs });
}));

export default router;
