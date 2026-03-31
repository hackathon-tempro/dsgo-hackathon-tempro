import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const DEMO_USERS = [
  { email: 'supplier@acme-supplier.nl', name: 'Supplier User', role: 'supplier', org: 'Acme Aluminium Supplier', organizationId: 'org-supplier' },
  { email: 'manufacturer@buildcorp.de', name: 'Manufacturer User', role: 'manufacturer', org: 'BuildCorp Manufacturers', organizationId: 'org-manufacturer' },
  { email: 'tester@eurotest.fr', name: 'Test Lab User', role: 'test_lab', org: 'EuroTest Lab', organizationId: 'org-test_lab' },
  { email: 'lca@greenlife.nl', name: 'LCA User', role: 'lca_org', org: 'GreenLife LCA', organizationId: 'org-lca_org' },
  { email: 'certifier@certifyeu.be', name: 'Certifier User', role: 'certification_body', org: 'CertifyEU', organizationId: 'org-certification_body' },
  { email: 'constructor@constructa.nl', name: 'Constructor User', role: 'construction_company', org: 'Constructa BV', organizationId: 'org-construction_company' },
  { email: 'owner@propinvest.de', name: 'Owner User', role: 'building_owner', org: 'PropInvest Real Estate', organizationId: 'org-building_owner' },
  { email: 'maintenance@maintainpro.at', name: 'Maintenance User', role: 'maintenance_company', org: 'MaintainPro Services', organizationId: 'org-maintenance_company' },
  { email: 'auditor@eu-authority.eu', name: 'Auditor User', role: 'regulatory_authority', org: 'EU Regulatory Authority', organizationId: 'org-regulatory_authority' },
  { email: 'dismantler@dismantletech.nl', name: 'Dismantler User', role: 'dismantling_company', org: 'DismantleTech', organizationId: 'org-dismantling_company' },
  { email: 'recycler@recyclecircle.de', name: 'Recycler User', role: 'recycler', org: 'RecycleCircle', organizationId: 'org-recycler' },
];

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = DEMO_USERS.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found' });
  }

  const token = jwt.sign(
    {
      userId: user.organizationId,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.organizationId,
        email: user.email,
        name: user.name,
        role: user.role,
        org: user.org,
        organizationId: user.organizationId,
      },
    },
  });
}));

router.post('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      data: {
        valid: true,
        user: decoded,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}));

router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = DEMO_USERS.find((u) => u.email === decoded.email);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.organizationId,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organizationId,
          name: user.org,
        },
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}));

router.post('/logout', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

export default router;
