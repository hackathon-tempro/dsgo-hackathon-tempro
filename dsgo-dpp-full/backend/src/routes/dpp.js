import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import dppService from '../services/dppService.js';
import credentialService from '../services/credentialService.js';

const router = Router();

router.post('/create', authMiddleware, validateBody('dpp'), asyncHandler(async (req, res) => {
  const {
    productId,
    productName,
    productType,
    batchId,
    manufacturingDate,
    productData,
    materialComposition,
    certifications,
  } = req.body;

  const result = await dppService.createDPP({
    organizationId: req.user.organizationId,
    productId,
    productName,
    productType,
    batchId,
    manufacturingDate,
    productData,
    materialComposition,
    certifications,
  });

  res.status(201).json({ success: true, data: result });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const dpp = await dppService.getDPP(id);
  res.json({ success: true, data: dpp });
}));

router.get('/:id/credentials', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT * FROM credentials 
     WHERE subject_did LIKE $1
     ORDER BY issued_at DESC`,
    [`%${id}%`]
  );

  res.json({ success: true, data: result.rows });
}));

router.post('/:id/assemble', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { componentCredentials, assemblyData } = req.body;

  const result = await dppService.appendToDPP({
    dppId: id,
    organizationId: req.user.organizationId,
    eventType: 'ASSEMBLY_COMPLETED',
    eventData: {
      componentCredentials,
      assemblyData,
      assembledBy: req.user.id,
      assembledAt: new Date().toISOString(),
    },
  });

  res.json({ success: true, data: result });
}));

router.post('/:id/transfer', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { toOrganizationId, transferReason } = req.body;

  const result = await dppService.appendToDPP({
    dppId: id,
    organizationId: req.user.organizationId,
    eventType: 'TRANSFER',
    eventData: {
      fromOrganizationId: req.user.organizationId,
      toOrganizationId,
      transferReason,
      transferredBy: req.user.id,
      transferredAt: new Date().toISOString(),
    },
  });

  res.json({ success: true, data: result });
}));

router.post('/:id/append', authMiddleware, validateBody('dppAppend'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { eventType, eventData, attachments, relatedProducts } = req.body;

  const result = await dppService.appendToDPP({
    dppId: id,
    organizationId: req.user.organizationId,
    eventType,
    eventData,
    attachments,
    relatedProducts,
  });

  res.json({ success: true, data: result });
}));

router.get('/:id/versions', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT * FROM dpp_versions 
     WHERE dpp_id = $1 
     ORDER BY version_number DESC`,
    [id]
  );

  res.json({ success: true, data: result.rows });
}));

router.get('/:id/history', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT * FROM dpp_event_logs 
     WHERE dpp_id = $1 
     ORDER BY sequence_number ASC`,
    [id]
  );

  res.json({ success: true, data: result.rows });
}));

router.post('/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acceptanceNotes } = req.body;

  const result = await dppService.appendToDPP({
    dppId: id,
    organizationId: req.user.organizationId,
    eventType: 'ACCEPTED',
    eventData: {
      acceptedBy: req.user.id,
      acceptedAt: new Date().toISOString(),
      notes: acceptanceNotes,
    },
  });

  res.json({ success: true, data: result });
}));

export default router;
