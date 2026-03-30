import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Audit Service
 * Manages audit trail creation, retrieval, and compliance reporting
 * Implements immutable audit log pattern for regulatory compliance
 */

class AuditService {
  /**
   * Create audit entry
   */
  async createAuditEntry({
    userId,
    organizationId,
    action,
    resourceType,
    resourceId,
    status,
    details = {},
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      const auditId = uuidv4();

      const result = await query(
        `INSERT INTO audit_logs (
          id, user_id, organization_id, action, resource_type, resource_id,
          status, details, ip_address, user_agent, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          auditId,
          userId,
          organizationId,
          action,
          resourceType,
          resourceId,
          status,
          JSON.stringify(details),
          ipAddress,
          userAgent,
          new Date(),
        ]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to create audit entry:', error.message);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(organizationId, filters = {}) {
    try {
      let whereClause = 'WHERE organization_id = $1';
      const params = [organizationId];
      let paramIndex = 2;

      // Add filters
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

      if (filters.resourceId) {
        whereClause += ` AND resource_id = $${paramIndex}`;
        params.push(filters.resourceId);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.startDate) {
        whereClause += ` AND timestamp >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        whereClause += ` AND timestamp <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      const limit = Math.min(filters.limit || 100, 10000);
      const offset = ((filters.page || 0) * limit);

      const result = await query(
        `SELECT * FROM audit_logs
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        params
      );

      return {
        logs: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        page: Math.floor(offset / limit),
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error.message);
      throw error;
    }
  }

  /**
   * Get audit trail for specific resource
   */
  async getResourceAuditTrail(resourceType, resourceId, organizationId = null) {
    try {
      let whereClause = 'WHERE resource_type = $1 AND resource_id = $2';
      const params = [resourceType, resourceId];

      if (organizationId) {
        whereClause += ` AND organization_id = $3`;
        params.push(organizationId);
      }

      const result = await query(
        `SELECT * FROM audit_logs
         ${whereClause}
         ORDER BY timestamp ASC`,
        params
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get resource audit trail:', error.message);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId, organizationId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(
        `SELECT
          action,
          COUNT(*) as count,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM audit_logs
         WHERE user_id = $1 AND organization_id = $2 AND timestamp >= $3
         GROUP BY action
         ORDER BY count DESC`,
        [userId, organizationId, startDate]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get user activity summary:', error.message);
      throw error;
    }
  }

  /**
   * Get organization audit summary
   */
  async getOrganizationAuditSummary(organizationId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(
        `SELECT
          DATE(timestamp) as date,
          COUNT(*) as total_actions,
          COUNT(DISTINCT user_id) as active_users,
          COUNT(DISTINCT resource_type) as resource_types,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_actions
         FROM audit_logs
         WHERE organization_id = $1 AND timestamp >= $2
         GROUP BY DATE(timestamp)
         ORDER BY date DESC`,
        [organizationId, startDate]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get organization audit summary:', error.message);
      throw error;
    }
  }

  /**
   * Get sensitive actions (security relevant)
   */
  async getSensitiveActions(organizationId, daysBack = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const sensitiveActions = [
        'CREATE_USER',
        'DELETE_USER',
        'UPDATE_ROLE',
        'REVOKE_CREDENTIAL',
        'DELETE_CREDENTIAL',
        'EXPORT_DATA',
        'SHARE_RESOURCE',
        'BULK_DELETE',
      ];

      const result = await query(
        `SELECT * FROM audit_logs
         WHERE organization_id = $1 AND timestamp >= $2
         AND action = ANY($3)
         ORDER BY timestamp DESC`,
        [organizationId, startDate, sensitiveActions]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get sensitive actions:', error.message);
      throw error;
    }
  }

  /**
   * Get failed actions (potential security issues)
   */
  async getFailedActions(organizationId, daysBack = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(
        `SELECT * FROM audit_logs
         WHERE organization_id = $1 AND status = 'failed' AND timestamp >= $2
         ORDER BY timestamp DESC`,
        [organizationId, startDate]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get failed actions:', error.message);
      throw error;
    }
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(organizationId, filters = {}, format = 'csv') {
    try {
      const logsData = await this.getAuditLogs(organizationId, { ...filters, limit: 100000 });

      if (format === 'csv') {
        return this.convertLogsToCSV(logsData.logs);
      }

      if (format === 'json') {
        return JSON.stringify(logsData.logs, null, 2);
      }

      return logsData.logs;
    } catch (error) {
      console.error('Failed to export audit logs:', error.message);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(organizationId, startDate, endDate) {
    try {
      // Get all audit data in range
      const logsResult = await query(
        `SELECT * FROM audit_logs
         WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3
         ORDER BY timestamp ASC`,
        [organizationId, startDate, endDate]
      );

      const logs = logsResult.rows;

      // Analyze compliance
      const report = {
        organizationId,
        period: { startDate, endDate },
        generatedAt: new Date(),
        summary: {
          totalActions: logs.length,
          successfulActions: logs.filter((l) => l.status === 'success').length,
          failedActions: logs.filter((l) => l.status === 'failed').length,
          uniqueUsers: new Set(logs.map((l) => l.user_id)).size,
          actionsByType: this.groupByAction(logs),
          resourcesByType: this.groupByResourceType(logs),
        },
        sensitiveActions: logs.filter((l) => this.isSensitiveAction(l.action)),
        securityEvents: logs.filter((l) => l.status === 'failed' || this.isSensitiveAction(l.action)),
        dataAccess: logs.filter((l) => l.action === 'READ' || l.action === 'EXPORT'),
        dataModifications: logs.filter((l) => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)),
      };

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error.message);
      throw error;
    }
  }

  /**
   * Archive old audit logs (compliance requirement)
   */
  async archiveOldLogs(daysToKeep = 2555) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // In production, implement archival to cold storage
      // For now, just mark as archived
      const result = await query(
        `UPDATE audit_logs
         SET archived = true, archived_at = $1
         WHERE timestamp < $2 AND archived = false
         RETURNING COUNT(*) as archived_count`,
        [new Date(), cutoffDate]
      );

      console.log(`✓ Archived ${result.rowCount} old audit logs`);
      return result.rowCount;
    } catch (error) {
      console.error('Failed to archive old logs:', error.message);
      throw error;
    }
  }

  /**
   * Verify audit log integrity
   */
  async verifyAuditIntegrity(organizationId, startDate, endDate) {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_logs,
          COUNT(CASE WHEN id IS NULL THEN 1 END) as missing_ids,
          COUNT(CASE WHEN timestamp IS NULL THEN 1 END) as missing_timestamps,
          COUNT(CASE WHEN user_id IS NULL AND action != 'SYSTEM_ACTION' THEN 1 END) as orphaned_logs
         FROM audit_logs
         WHERE organization_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
        [organizationId, startDate, endDate]
      );

      const integrity = result.rows[0];

      return {
        organizationId,
        period: { startDate, endDate },
        integrity: {
          totalLogs: integrity.total_logs,
          missingIds: integrity.missing_ids,
          missingTimestamps: integrity.missing_timestamps,
          orphanedLogs: integrity.orphaned_logs,
          isValid: integrity.missing_ids === 0 && integrity.missing_timestamps === 0,
        },
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to verify audit integrity:', error.message);
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(organizationId, searchQuery) {
    try {
      const result = await query(
        `SELECT * FROM audit_logs
         WHERE organization_id = $1
         AND (
           user_id::text ILIKE $2
           OR resource_id::text ILIKE $2
           OR details::text ILIKE $2
           OR ip_address::text ILIKE $2
         )
         ORDER BY timestamp DESC
         LIMIT 1000`,
        [organizationId, `%${searchQuery}%`]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to search audit logs:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Convert logs to CSV
   */
  convertLogsToCSV(logs) {
    const headers = [
      'ID',
      'User ID',
      'Organization ID',
      'Action',
      'Resource Type',
      'Resource ID',
      'Status',
      'IP Address',
      'Timestamp',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.user_id || '',
      log.organization_id,
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.status,
      log.ip_address || '',
      log.timestamp,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Helper: Group logs by action
   */
  groupByAction(logs) {
    const grouped = {};
    logs.forEach((log) => {
      grouped[log.action] = (grouped[log.action] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Helper: Group logs by resource type
   */
  groupByResourceType(logs) {
    const grouped = {};
    logs.forEach((log) => {
      grouped[log.resource_type] = (grouped[log.resource_type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Helper: Check if action is sensitive
   */
  isSensitiveAction(action) {
    const sensitiveActions = [
      'CREATE_USER',
      'DELETE_USER',
      'UPDATE_ROLE',
      'REVOKE_CREDENTIAL',
      'DELETE_CREDENTIAL',
      'EXPORT_DATA',
      'SHARE_RESOURCE',
      'BULK_DELETE',
      'PERMISSION_CHANGE',
      'AUTHORIZATION_GRANT',
    ];

    return sensitiveActions.includes(action);
  }

  /**
   * Get audit log statistics
   */
  async getAuditStatistics(organizationId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(
        `SELECT
          COUNT(*) as total_entries,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT resource_type) as resource_types,
          COUNT(CASE WHEN action = 'CREATE' THEN 1 END) as create_actions,
          COUNT(CASE WHEN action = 'READ' THEN 1 END) as read_actions,
          COUNT(CASE WHEN action = 'UPDATE' THEN 1 END) as update_actions,
          COUNT(CASE WHEN action = 'DELETE' THEN 1 END) as delete_actions,
          COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_actions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_actions,
          AVG(CAST(EXTRACT(EPOCH FROM age(timestamp, lag(timestamp) OVER (ORDER BY timestamp))) AS INTEGER)) as avg_action_interval
         FROM audit_logs
         WHERE organization_id = $1 AND timestamp >= $2`,
        [organizationId, startDate]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to get audit statistics:', error.message);
      throw error;
    }
  }

  /**
   * Bulk create audit entries
   */
  async bulkCreateAuditEntries(entries) {
    try {
      const values = entries.map((entry, index) => {
        const offset = index * 11;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
      });

      const params = [];
      entries.forEach((entry) => {
        params.push(
          uuidv4(),
          entry.userId,
          entry.organizationId,
          entry.action,
          entry.resourceType,
          entry.resourceId,
          entry.status,
          JSON.stringify(entry.details),
          entry.ipAddress,
          entry.userAgent,
          new Date()
        );
      });

      const result = await query(
        `INSERT INTO audit_logs (
          id, user_id, organization_id, action, resource_type, resource_id,
          status, details, ip_address, user_agent, timestamp
        ) VALUES ${values.join(', ')}
        RETURNING COUNT(*) as inserted`,
        params
      );

      return result.rowCount;
    } catch (error) {
      console.error('Failed to bulk create audit entries:', error.message);
      throw error;
    }
  }
}

export default new AuditService();
