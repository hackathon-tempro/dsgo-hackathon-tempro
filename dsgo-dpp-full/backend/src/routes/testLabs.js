import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
  const { name, eori, accreditationNumber, website, contactEmail } = req.body;

  const result = await query(
    `INSERT INTO test_labs (name, eori, accreditation_number, website, contact_email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, eori, accreditationNumber, website, contactEmail]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query('SELECT * FROM test_labs WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Test lab not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/requests', authMiddleware, validateBody('testRequest'), asyncHandler(async (req, res) => {
  const { dppId, testLabId, testType, testParameters, priority } = req.body;
  const requestId = uuidv4();

  const result = await query(
    `INSERT INTO tests (test_id, dpp_id, test_lab_id, test_type, test_parameters, status)
     VALUES ($1, $2, $3, $4, $5, 'requested')
     RETURNING *`,
    [requestId, dppId, testLabId, testType, JSON.stringify(testParameters || {})]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/requests/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM tests WHERE id = $1 OR test_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Test request not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/samples', authMiddleware, asyncHandler(async (req, res) => {
  const { testRequestId, sampleDescription, sampleType, collectionDate } = req.body;
  const sampleId = uuidv4();

  res.status(201).json({
    success: true,
    data: {
      sampleId,
      testRequestId,
      description: sampleDescription,
      type: sampleType,
      collectedAt: collectionDate,
      status: 'registered',
    },
  });
}));

router.get('/samples/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      sampleId: id,
      status: 'registered',
      description: 'Sample details',
    },
  });
}));

router.post('/results', authMiddleware, validateBody('testResult'), asyncHandler(async (req, res) => {
  const { testRequestId, results, status, certificateId } = req.body;

  const result = await query(
    `UPDATE tests 
     SET results = $1, status = $2, certificate_id = $3
     WHERE id = $4 OR test_id = $4
     RETURNING *`,
    [JSON.stringify(results), status, certificateId, testRequestId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Test request not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.get('/results', authMiddleware, asyncHandler(async (req, res) => {
  const { page = 0, limit = 50 } = req.query;
  const offset = page * limit;

  const result = await query(
    `SELECT * FROM tests 
     WHERE test_lab_id = $1 AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.organizationId, limit, offset]
  );

  res.json({ success: true, data: result.rows });
}));

export default router;
