import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import credentialService from '../services/credentialService.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { status, type, page = 0, limit = 50 } = req.query;
  const offset = page * limit;

  let whereClause = 'WHERE organization_id = $1';
  const params = [req.user.organizationId];
  let paramIndex = 2;

  if (status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (type) {
    whereClause += ` AND type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  const result = await query(
    `SELECT * FROM credentials
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  res.json({ success: true, data: result.rows });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const credential = await credentialService.getCredential(id);
  res.json({ success: true, data: credential });
}));

router.post('/material-passport', authMiddleware, asyncHandler(async (req, res) => {
  const { lotId, materialData, expirationDate, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'MaterialPassportCredential',
    subjectDid: `urn:lot:${lotId}`,
    subjectData: {
      lotId,
      ...materialData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    expirationDate,
    metadata: {
      issuedBy: req.user.id,
      organizationId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/test-report', authMiddleware, asyncHandler(async (req, res) => {
  const { testResultId, dppId, testData, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'TestReportCredential',
    subjectDid: `urn:lot:${testResultId}`,
    subjectData: {
      testResultId,
      dppId,
      ...testData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      testLabId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/lca', authMiddleware, asyncHandler(async (req, res) => {
  const { lcaResultId, dppId, lcaData, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'ProductEnvironmentalCredential',
    subjectDid: `urn:product:${dppId}`,
    subjectData: {
      lcaResultId,
      dppId,
      ...lcaData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      lcaOrganizationId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/certificate', authMiddleware, asyncHandler(async (req, res) => {
  const { certificateId, dppId, certificationData, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'ProductCertificate',
    subjectDid: `did:example:product:${dppId}`,
    subjectData: {
      certificateId,
      dppId,
      ...certificationData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      certificationBodyId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/dpp', authMiddleware, asyncHandler(async (req, res) => {
  const { dppId, productData, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'DigitalProductPassport',
    subjectDid: `did:example:product:${dppId}`,
    subjectData: {
      dppId,
      ...productData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      manufacturerId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/handover', authMiddleware, asyncHandler(async (req, res) => {
  const { handoverId, assetId, handoverData, from, to, includedDPPs, handoverDate, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'AssetHandoverCredential',
    subjectDid: `did:example:asset:${assetId}`,
    subjectData: {
      handoverId,
      assetId,
      from,
      to,
      includedDPPs,
      handoverDate,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      constructionCompanyId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/repair', authMiddleware, asyncHandler(async (req, res) => {
  const { repairId, dppId, repairData, authorisedBy } = req.body;

  const result = await credentialService.issueCredential({
    organizationId: req.user.organizationId,
    credentialType: 'RepairCredential',
    subjectDid: `did:example:product:${dppId}`,
    subjectData: {
      repairId,
      dppId,
      ...repairData,
      authorisedBy: authorisedBy || {
        userId: req.user.id,
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        role: req.user.role,
      },
    },
    metadata: {
      issuedBy: req.user.id,
      maintenanceCompanyId: req.user.organizationId,
    },
  });

  res.status(201).json({ success: true, data: result });
}));

router.post('/:id/revoke', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await credentialService.revokeCredential(
    id,
    req.user.organizationId,
    reason || 'Revocation requested'
  );

  res.json({ success: true, data: result });
}));

router.post('/verify', authMiddleware, asyncHandler(async (req, res) => {
  const { credentialId } = req.body;

  const result = await credentialService.verifyCredential(credentialId, req.user.organizationId);

  res.json({ success: true, data: result });
}));

export default router;
