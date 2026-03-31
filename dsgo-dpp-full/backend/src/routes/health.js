import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { healthCheck as dbHealthCheck } from '../database.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  let dbStatus = 'not_configured';
  
  try {
    const dbHealth = await dbHealthCheck();
    dbStatus = dbHealth.status;
  } catch (error) {
    dbStatus = 'unavailable';
  }

  res.json({
    success: true,
    data: {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus },
        demoMode: process.env.DEMO_MODE === 'true' ? 'enabled' : 'disabled',
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    },
  });
}));

router.get('/audit-log', asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
}));

export default router;
