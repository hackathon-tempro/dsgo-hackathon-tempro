import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Import database and services
import { initDatabase, healthCheck as dbHealthCheck } from './database.js';
import credencoService from './services/credencoService.js';
import ishareService from './services/ishareService.js';

// Import middleware
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { auditLogger, initAuditLogging } from './middleware/auditLog.js';
import { authMiddleware, optionalAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// SECURITY & PARSING MIDDLEWARE
// ============================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// AUDIT & AUTHENTICATION MIDDLEWARE
// ============================================

// Initialize audit logging
app.use(auditLogger);

// Optional authentication (some routes don't require auth)
app.use(optionalAuth);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', asyncHandler(async (req, res) => {
  try {
    const dbHealth = await dbHealthCheck();
    const credencoHealth = process.env.FEATURE_CREDENCO_ENABLED === 'true'
      ? await credencoService.testConnection()
      : { status: 'disabled' };
    const ishareHealth = process.env.FEATURE_ISHARE_ENABLED === 'true'
      ? await ishareService.testConnection()
      : { status: 'disabled' };

    const isHealthy = dbHealth.status === 'healthy' &&
      (credencoHealth.status === 'connected' || credencoHealth.status === 'disabled') &&
      (ishareHealth.status === 'connected' || ishareHealth.status === 'disabled');

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        credenco: credencoHealth,
        ishare: ishareHealth,
      },
      environment: NODE_ENV,
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * Ping endpoint (lightweight health check)
 */
app.get('/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// ============================================
// API ROUTES
// ============================================

import authRoutes from './routes/auth.js';
import organizationsRoutes from './routes/organizations.js';
import materialsRoutes from './routes/materials.js';
import productsRoutes from './routes/products.js';
import shipmentsRoutes from './routes/shipments.js';
import credentialsRoutes from './routes/credentials.js';
import dppRoutes from './routes/dpp.js';
import testLabsRoutes from './routes/testLabs.js';
import lcaRoutes from './routes/lca.js';
import certificationsRoutes from './routes/certifications.js';
import transactionsRoutes from './routes/transactions.js';
import assetHandoversRoutes from './routes/assetHandovers.js';
import assetsRoutes from './routes/assets.js';
import repairsRoutes from './routes/repairs.js';
import auditRoutes from './routes/audit.js';
import dismantlingRoutes from './routes/dismantling.js';
import recyclingRoutes from './routes/recycling.js';
import complianceRoutes from './routes/compliance.js';
import presentationsRoutes from './routes/presentations.js';
import verificationsRoutes from './routes/verifications.js';
import healthRoutes from './routes/health.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organizations', organizationsRoutes);
app.use('/api/v1/materials', materialsRoutes);
app.use('/api/v1/lots', materialsRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/product-instances', productsRoutes);
app.use('/api/v1/shipments', shipmentsRoutes);
app.use('/api/v1/credentials', credentialsRoutes);
app.use('/api/v1/verifications', verificationsRoutes);
app.use('/api/v1/dpp', dppRoutes);
app.use('/api/v1/test-labs', testLabsRoutes);
app.use('/api/v1/test-requests', testLabsRoutes);
app.use('/api/v1/samples', testLabsRoutes);
app.use('/api/v1/test-results', testLabsRoutes);
app.use('/api/v1/lca', lcaRoutes);
app.use('/api/v1/certifications', certificationsRoutes);
app.use('/api/v1/transactions', transactionsRoutes);
app.use('/api/v1/asset-handovers', assetHandoversRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/repairs', repairsRoutes);
app.use('/api/v1/access-grants', repairsRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/dismantling', dismantlingRoutes);
app.use('/api/v1/recycling', recyclingRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/presentations', presentationsRoutes);
app.use('/', healthRoutes);

// ============================================
// WEBHOOK ENDPOINTS
// ============================================

/**
 * Credenco webhook endpoint
 */
app.post('/webhooks/credenco', asyncHandler(async (req, res) => {
  try {
    const { payload, signature } = req.body;
    const result = await credencoService.handleCredencoWebhook(payload);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Credenco webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
}));

/**
 * iSHARE webhook endpoint
 */
app.post('/webhooks/ishare', asyncHandler(async (req, res) => {
  try {
    const payload = req.body;
    // TODO: Handle iSHARE webhook
    res.json({ success: true, message: 'iSHARE webhook received' });
  } catch (error) {
    console.error('iSHARE webhook error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
}));

// ============================================
// STATUS & METRICS ENDPOINTS
// ============================================

/**
 * Server status
 */
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    environment: NODE_ENV,
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * API info
 */
app.get('/api/info', (req, res) => {
  res.json({
    name: 'DSGO/DPP Backend',
    version: '1.0.0',
    description: 'Digital Product Passport with Credenco & iSHARE Integration',
    environment: NODE_ENV,
    features: {
      credenco: process.env.FEATURE_CREDENCO_ENABLED === 'true',
      ishare: process.env.FEATURE_ISHARE_ENABLED === 'true',
      blockchain: process.env.FEATURE_BLOCKCHAIN_INTEGRATION === 'true',
      multiSignature: process.env.FEATURE_MULTI_SIGNATURE === 'true',
      delegationEvidence: process.env.FEATURE_DELEGATION_EVIDENCE === 'true',
      automatedCompliance: process.env.FEATURE_AUTOMATED_COMPLIANCE === 'true',
    },
  });
});

// ============================================
// 404 & ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// SERVER INITIALIZATION
// ============================================

/**
 * Initialize server
 */
const initServer = async () => {
  try {
    console.log('🚀 Starting DSGO/DPP Backend...');
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`🔌 Port: ${PORT}`);

    // Initialize database
    console.log('\n📊 Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized');

    // Initialize audit logging
    console.log('\n📋 Initializing audit logging...');
    await initAuditLogging();
    console.log('✓ Audit logging initialized');

    // Test Credenco connection
    if (process.env.FEATURE_CREDENCO_ENABLED === 'true') {
      console.log('\n🔐 Testing Credenco connection...');
      const credencoStatus = await credencoService.testConnection();
      if (credencoStatus.status === 'connected') {
        console.log('✓ Credenco connected');
      } else {
        console.warn('⚠ Credenco connection failed:', credencoStatus.message);
      }
    }

    // Test iSHARE connection
    if (process.env.FEATURE_ISHARE_ENABLED === 'true') {
      console.log('\n🔐 Testing iSHARE connection...');
      const ishareStatus = await ishareService.testConnection();
      if (ishareStatus.status === 'connected') {
        console.log('✓ iSHARE connected');
      } else {
        console.warn('⚠ iSHARE connection failed:', ishareStatus.message);
      }
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API documentation: http://localhost:${PORT}/api/info`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('\n🎉 Backend initialization complete!\n');
    });
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handle graceful shutdown
 */
const gracefulShutdown = (signal) => {
  console.log(`\n📴 Received ${signal}, shutting down gracefully...`);

  app.close(() => {
    console.log('✓ HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠ Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

initServer();

export default app;
