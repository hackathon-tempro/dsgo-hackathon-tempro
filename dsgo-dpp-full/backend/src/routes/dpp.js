import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const MOCK_DPPS = [
  {
    id: 'dpp-001',
    dpp_id: 'dpp-001',
    product_name: 'Aluminium Facade Panel',
    product_type: 'Construction Materials',
    batch_id: 'BATCH-2024-001',
    organization_id: 'org-manufacturer',
    status: 'active',
    version: 1,
    is_immutable: true,
    created_at: new Date('2026-03-27').toISOString(),
    product_data: { serialNumber: 'SN-88271', manufacturer: 'BuildCorp' },
    material_composition: { materials: ['Aluminium 89.5%', 'Zinc 5.6%'] },
    hash: 'sha256-demo-hash-12345',
  },
  {
    id: 'dpp-002',
    dpp_id: 'dpp-002',
    product_name: 'Steel Reinforcement Bar',
    product_type: 'Steel Products',
    batch_id: 'BATCH-2024-002',
    organization_id: 'org-manufacturer',
    status: 'active',
    version: 1,
    is_immutable: true,
    created_at: new Date('2026-03-28').toISOString(),
    product_data: { serialNumber: 'SN-88272', manufacturer: 'BuildCorp' },
    material_composition: { materials: ['Steel 100%'] },
    hash: 'sha256-demo-hash-67890',
  },
];

const MOCK_HISTORY = [
  { id: '1', event_type: 'CREATED', timestamp: new Date('2026-03-27').toISOString(), actor_organization_id: 'org-manufacturer', changes: {} },
  { id: '2', event_type: 'MATERIAL_CERTIFIED', timestamp: new Date('2026-03-28').toISOString(), actor_organization_id: 'org-supplier', changes: { materialId: 'MAT-AL-7075' } },
  { id: '3', event_type: 'TEST_REPORT_ISSUED', timestamp: new Date('2026-03-29').toISOString(), actor_organization_id: 'org-test_lab', changes: { testType: 'tensile_strength' } },
];

// Get all DPPs
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: MOCK_DPPS });
}));

router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  const { productId, productName, productType, batchId } = req.body;
  const newDpp = {
    id: uuidv4(),
    dpp_id: uuidv4(),
    product_name: productName,
    product_type: productType,
    batch_id: batchId,
    organization_id: 'org-manufacturer',
    status: 'active',
    is_immutable: true,
    created_at: new Date().toISOString(),
    hash: `sha256-${Date.now()}`,
  };
  res.status(201).json({ success: true, data: { dpp: newDpp, dppId: newDpp.dpp_id } });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const dpp = MOCK_DPPS.find((d) => d.id === req.params.id || d.dpp_id === req.params.id);
  if (!dpp) {
    return res.status(404).json({ success: false, error: 'DPP not found' });
  }
  res.json({ success: true, data: dpp });
}));

router.get('/:id/credentials', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

router.post('/:id/assemble', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { eventId: uuidv4(), message: 'Assembly completed' } });
}));

router.post('/:id/transfer', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { eventId: uuidv4(), message: 'Transfer completed' } });
}));

router.post('/:id/append', authMiddleware, asyncHandler(async (req, res) => {
  const { eventType, eventData } = req.body;
  res.json({
    success: true,
    data: {
      dppId: req.params.id,
      eventId: uuidv4(),
      event: { event_type: eventType, changes: eventData },
    },
  });
}));

router.get('/:id/history', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: MOCK_HISTORY });
}));

router.post('/:id/accept', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { message: 'Accepted' } });
}));

// Transfer DPP to another organization
router.post('/transfer', authMiddleware, asyncHandler(async (req, res) => {
  const { dppId, toOrganization, transferType } = req.body;
  res.json({ 
    success: true, 
    data: { 
      transferId: uuidv4(), 
      dppId, 
      fromOrganization: req.user.organizationId,
      toOrganization,
      transferType,
      status: 'completed',
      timestamp: new Date().toISOString()
    } 
  });
}));

export default router;
