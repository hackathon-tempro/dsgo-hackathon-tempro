import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import credencoService from '../services/credencoService.js';

const router = Router();

const MOCK_CREDENTIALS = [
  {
    id: 'cred-001',
    credential_id: 'urn:vc:material-passport:001',
    organization_id: 'org-supplier',
    type: 'MaterialPassportCredential',
    status: 'issued',
    issuer: 'did:web:acme-supplier.nl',
    subject_did: 'urn:lot:LOT-2026-03-00182',
    issued_at: new Date('2026-03-25').toISOString(),
    expires_at: new Date('2031-03-25').toISOString(),
    subject_data: {
      materialId: 'MAT-AL-7075',
      batchNumber: 'BATCH-77421',
      composition: [
        { substance: 'Aluminium', percent: 89.5 },
        { substance: 'Zinc', percent: 5.6 },
      ],
      recycledContentPercent: 22.0,
      countryOfOrigin: 'DE',
      carbonFootprintKgCO2e: 3100.0,
    },
  },
  {
    id: 'cred-002',
    credential_id: 'urn:vc:test-report:001',
    organization_id: 'org-test_lab',
    type: 'TestReportCredential',
    status: 'issued',
    issuer: 'did:web:eurotest.fr',
    subject_did: 'urn:lot:LOT-2026-03-00182',
    issued_at: new Date('2026-03-29').toISOString(),
    expires_at: new Date('2031-03-29').toISOString(),
    subject_data: {
      sampleId: 'SAMPLE-991',
      tests: [{ type: 'tensile_strength', value: 540, unit: 'MPa', method: 'ISO 6892-1' }],
      conclusion: 'compliant',
      accreditation: 'ISO/IEC 17025',
    },
  },
];

router.get('/', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  res.json({ success: true, data: MOCK_CREDENTIALS });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const cred = MOCK_CREDENTIALS.find((c) => c.id === req.params.id);
  if (!cred) {
    return res.status(404).json({ success: false, error: 'Credential not found' });
  }
  res.json({ success: true, data: cred });
}));

router.post('/material-passport', asyncHandler(async (req, res) => {
  const { lotId, materialData } = req.body;
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:material-passport:${Date.now()}`,
    type: 'MaterialPassportCredential',
    status: 'issued',
    issued_at: new Date().toISOString(),
    subject_did: `urn:lot:${lotId}`,
    subject_data: materialData,
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/test-report', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:test-report:${Date.now()}`,
    type: 'TestReportCredential',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/lca', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:lca:${Date.now()}`,
    type: 'ProductEnvironmentalCredential',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/certificate', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:certificate:${Date.now()}`,
    type: 'ProductCertificate',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/dpp', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:dpp:${Date.now()}`,
    type: 'DigitalProductPassport',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/handover', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:handover:${Date.now()}`,
    type: 'AssetHandoverCredential',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

router.post('/repair', asyncHandler(async (req, res) => {
  const newCred = {
    id: uuidv4(),
    credential_id: `urn:vc:repair:${Date.now()}`,
    type: 'RepairCredential',
    status: 'issued',
    issued_at: new Date().toISOString(),
  };
  res.status(201).json({ success: true, data: newCred });
}));

/**
 * POST /api/v1/credentials/issue
 * Issue a credential via OID4VCI flow and return a QR code + offer URI.
 * The user scans the QR code with the Credenco wallet app to receive the credential.
 *
 * Body: { template_id, claims }
 * Example: { "template_id": "alkondor_co2", "claims": { "CO2-uitstoot": "12.5 kg CO2e" } }
 */
router.post('/issue', asyncHandler(async (req, res) => {
  const { template_id, claims } = req.body;

  if (!template_id) {
    return res.status(400).json({ success: false, error: 'template_id is required' });
  }

  const offer = await credencoService.issueToWallet({ template_id, claims: claims || {} });
  const qrCodeDataUrl = await QRCode.toDataURL(offer.request_uri, { width: 300 });

  res.json({
    success: true,
    data: {
      correlation_id: offer.correlation_id,
      request_uri: offer.request_uri,
      status_uri: offer.status_uri,
      qr_code: qrCodeDataUrl,
      instructions: 'Scan de QR code met de Credenco wallet app om het credential te ontvangen.',
    },
  });
}));

/**
 * GET /api/v1/credentials/issue/:correlationId/status
 * Poll the status of a credential offer.
 */
router.get('/issue/:correlationId/status', asyncHandler(async (req, res) => {
  const status = await credencoService.getOfferStatus(req.params.correlationId);
  res.json({ success: true, data: status });
}));

router.post('/verify', asyncHandler(async (req, res) => {
  const { credentialId } = req.body;
  res.json({
    success: true,
    data: {
      verified: true,
      credentialId,
      signatureValid: true,
      issuerTrusted: true,
      statusValid: true,
      schemaValid: true,
    },
  });
}));

export default router;
