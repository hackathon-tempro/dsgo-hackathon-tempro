import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import dppService from '../services/dppService.js';

const router = Router();

router.post('/', authMiddleware, validateBody('shipment'), asyncHandler(async (req, res) => {
  const {
    fromOrganizationId,
    toOrganizationId,
    fromLocation,
    toLocation,
    carrierName,
    transportMode,
    departureDate,
    estimatedArrival,
    containerIds,
    trackingNumber,
    dppId,
  } = req.body;

  const shipmentId = `SHP-${Date.now()}-${uuidv4().substring(0, 8)}`;

  const result = await query(
    `INSERT INTO shipments (
      shipment_id, organization_id, dpp_id, from_location, to_location,
      from_organization_id, to_organization_id, status, carrier_name,
      transport_mode, departure_date, estimated_arrival, container_ids, tracking_number
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      shipmentId, req.user.organizationId, dppId, fromLocation, toLocation,
      fromOrganizationId, toOrganizationId, 'pending', carrierName,
      transportMode, departureDate, estimatedArrival, JSON.stringify(containerIds || []), trackingNumber
    ]
  );

  if (dppId) {
    await dppService.appendToDPP({
      dppId,
      organizationId: req.user.organizationId,
      eventType: 'SHIPMENT',
      eventData: {
        shipmentId,
        fromLocation,
        toLocation,
        carrierName,
        transportMode,
        timestamp: departureDate,
      },
    });
  }

  res.status(201).json({ success: true, data: result.rows[0] });
}));

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    'SELECT * FROM shipments WHERE id = $1 OR shipment_id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.put('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, location, timestamp } = req.body;

  const validStatuses = ['pending', 'in_transit', 'delivered', 'customs', 'exception', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const result = await query(
    `UPDATE shipments 
     SET status = $1, updated_at = NOW()
     WHERE id = $2 OR shipment_id = $2
     RETURNING *`,
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  res.json({ success: true, data: result.rows[0] });
}));

router.post('/:id/receive', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { arrivalDate, condition } = req.body;

  const shipment = await query(
    'SELECT * FROM shipments WHERE id = $1 OR shipment_id = $1',
    [id]
  );

  if (shipment.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const result = await query(
    `UPDATE shipments 
     SET status = 'delivered', arrival_date = $1, updated_at = NOW()
     WHERE id = $2 OR shipment_id = $2
     RETURNING *`,
    [arrivalDate || new Date(), id]
  );

  if (shipment.rows[0].dpp_id) {
    await dppService.appendToDPP({
      dppId: shipment.rows[0].dpp_id,
      organizationId: req.user.organizationId,
      eventType: 'RECEIVED',
      eventData: {
        shipmentId: shipment.rows[0].shipment_id,
        receivedAt: arrivalDate || new Date(),
        condition: condition || 'good',
        receivedBy: req.user.id,
      },
    });
  }

  res.json({ success: true, data: result.rows[0] });
}));

export default router;
