import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Logging Middleware
 * Logs all CRUD operations for compliance and audit trail
 * Implements append-only pattern for immutability
 */

/**
 * Initialize audit logging system
 */
export const initAuditLogging = async () => {
  try {
    // Create audit_logs table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        organization_id UUID,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255),
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        request_id UUID,
        status_code INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        data_classification VARCHAR(50) DEFAULT 'INTERNAL',

        CONSTRAINT audit_logs_valid_action CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'REVOKE'))
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
    `);

    console.log('✓ Audit logging system initialized');
  } catch (error) {
    console.error('Failed to initialize audit logging:', error.message);
    throw error;
  }
};

/**
 * Audit logging middleware
 * Captures request details and logs to audit trail
 */
export const auditLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = uuidv4();
  const startTime = Date.now();

  // Store original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override json method
  res.json = function (data) {
    res.auditData = data;
    return originalJson.call(this, data);
  };

  // Override send method
  res.send = function (data) {
    res.auditData = data;
    return originalSend.call(this, data);
  };

  // Log on response finish
  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;

      // Skip health checks and non-API routes
      if (req.path === '/health' || req.path === '/ping' || req.path.startsWith('/.')) {
        return;
      }

      // Determine action type from HTTP method
      const actionMap = {
        'GET': 'READ',
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE',
      };

      const action = actionMap[req.method] || 'READ';

      // Extract resource type and ID from path
      const pathParts = req.path.split('/').filter(p => p);
      const resourceType = pathParts[1] || 'unknown';
      const resourceId = pathParts[2] || null;

      // Prepare audit log entry
      const auditEntry = {
        id: req.id,
        userId: req.user?.id || null,
        organizationId: req.user?.organizationId || null,
        action,
        resourceType,
        resourceId,
        changes: serializeChanges(req, res),
        ipAddress: getClientIP(req),
        userAgent: req.get('user-agent'),
        requestId: req.id,
        statusCode: res.statusCode,
        errorMessage: res.auditData?.error || null,
        dataClassification: classifyData(resourceType),
      };

      // Log to database if audit logging is enabled
      if (process.env.AUDIT_LOG_ENABLED !== 'false') {
        await logAuditEntry(auditEntry);
      }

      // Log sensitive operations to console
      if (action === 'DELETE' || action === 'UPDATE') {
        console.log(
          `[AUDIT] ${action} ${resourceType}/${resourceId} by ${req.user?.email || 'anonymous'} | Status: ${res.statusCode} | Duration: ${duration}ms`
        );
      }
    } catch (error) {
      console.error('Error logging audit trail:', error.message);
      // Don't throw - audit logging shouldn't break request handling
    }
  });

  next();
};

/**
 * Log specific action to audit trail
 */
export const logAction = async (userId, organizationId, action, resourceType, resourceId, changes = null, metadata = {}) => {
  try {
    if (process.env.AUDIT_LOG_ENABLED === 'false') {
      return;
    }

    await query(
      `INSERT INTO audit_logs
       (user_id, organization_id, action, resource_type, resource_id, changes, data_classification)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        organizationId,
        action,
        resourceType,
        resourceId,
        changes ? JSON.stringify(changes) : null,
        classifyData(resourceType),
      ]
    );
  } catch (error) {
    console.error('Failed to log audit action:', error.message);
    // Non-critical error - don't throw
  }
};

/**
 * Get audit logs for organization
 */
export const getAuditLogs = async (organizationId, filters = {}) => {
  try {
    let whereClause = 'WHERE organization_id = $1';
    const params = [organizationId];
    let paramIndex = 2;

    if (filters.userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.action) {
      whereClause += ` AND action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.resourceType) {
      whereClause += ` AND resource_type = $${paramIndex}`;
      params.push(filters.resourceType);
      paramIndex++;
    }

    if (filters.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    const limit = Math.min(filters.limit || 100, 1000);
    const offset = (filters.page || 0) * limit;

    const result = await query(
      `SELECT id, user_id, action, resource_type, resource_id,
              changes, ip_address, status_code, created_at
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return result.rows;
  } catch (error) {
    console.error('Failed to retrieve audit logs:', error.message);
    throw error;
  }
};

/**
 * Export audit logs for compliance
 */
export const exportAuditLogs = async (organizationId, format = 'json') => {
  try {
    const logs = await query(
      `SELECT * FROM audit_logs
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId]
    );

    if (format === 'csv') {
      return convertToCSV(logs.rows);
    }

    return logs.rows;
  } catch (error) {
    console.error('Failed to export audit logs:', error.message);
    throw error;
  }
};

/**
 * Audit log cleanup (archive old logs)
 */
export const archiveOldLogs = async (daysToKeep = 2555) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await query(
      `DELETE FROM audit_logs
       WHERE created_at < $1`,
      [cutoffDate]
    );

    console.log(`✓ Archived ${result.rowCount} old audit logs`);
    return result.rowCount;
  } catch (error) {
    console.error('Failed to archive old logs:', error.message);
    throw error;
  }
};

/**
 * Helper: Get client IP address
 */
function getClientIP(req) {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Helper: Serialize changes for audit trail
 */
function serializeChanges(req, res) {
  const changes = {};

  // Capture request body (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    changes.request = sanitizeObject(req.body);
  }

  // Capture response data
  if (res.auditData && typeof res.auditData === 'object') {
    changes.response = sanitizeObject(res.auditData);
  }

  // Capture query parameters
  if (Object.keys(req.query).length > 0) {
    changes.query = req.query;
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

/**
 * Helper: Remove sensitive data from objects
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'refreshToken',
    'creditCard',
    'ssn',
  ];

  const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Helper: Classify data by resource type for compliance
 */
function classifyData(resourceType) {
  const publicResources = ['products', 'materials', 'certifications'];
  const confidentialResources = ['organizations', 'users', 'transactions'];
  const sensitiveResources = ['credentials', 'dpp', 'repairs'];

  if (publicResources.includes(resourceType)) return 'PUBLIC';
  if (sensitiveResources.includes(resourceType)) return 'SENSITIVE';
  if (confidentialResources.includes(resourceType)) return 'CONFIDENTIAL';
  return 'INTERNAL';
}

/**
 * Helper: Convert logs to CSV format
 */
function convertToCSV(logs) {
  const headers = ['ID', 'User ID', 'Organization ID', 'Action', 'Resource Type', 'Resource ID', 'Status Code', 'Created At'];
  const rows = logs.map((log) => [
    log.id,
    log.user_id,
    log.organization_id,
    log.action,
    log.resource_type,
    log.resource_id,
    log.status_code,
    log.created_at,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell || ''}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export default auditLogger;
