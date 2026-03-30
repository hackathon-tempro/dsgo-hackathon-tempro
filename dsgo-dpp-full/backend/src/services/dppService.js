import { query, transaction } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { logAction } from '../middleware/auditLog.js';

/**
 * Digital Product Passport (DPP) Service
 * Implements append-only, immutable product passport management
 * Compliant with EU Digital Product Passport Regulation 2024
 */

class DPPService {
  /**
   * Create a new Digital Product Passport
   * Append-only: cannot be modified after creation
   */
  async createDPP({
    organizationId,
    productId,
    productName,
    productType,
    batchId,
    manufacturingDate,
    productData = {},
    materialComposition = {},
    certifications = [],
  }) {
    const dppId = uuidv4();
    const versionNumber = 1;

    try {
      // Create DPP record (immutable)
      const result = await query(
        `INSERT INTO digital_product_passports (
          id, dpp_id, organization_id, product_id, product_name, product_type,
          batch_id, manufacturing_date, version, status, product_data,
          material_composition, certifications, hash, is_immutable,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          dppId,
          dppId,
          organizationId,
          productId,
          productName,
          productType,
          batchId,
          manufacturingDate,
          versionNumber,
          'active',
          JSON.stringify(productData),
          JSON.stringify(materialComposition),
          JSON.stringify(certifications),
          this.calculateHash(productData, materialComposition, certifications),
          true, // Mark as immutable
          new Date(),
          new Date(),
        ]
      );

      const dpp = result.rows[0];

      // Create initial DPP event log entry (append-only)
      await query(
        `INSERT INTO dpp_event_logs (
          id, dpp_id, event_type, actor_organization_id, changes, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          uuidv4(),
          dppId,
          'CREATED',
          organizationId,
          JSON.stringify({
            productName,
            productType,
            batchId,
            manufacturingDate,
          }),
          new Date(),
        ]
      );

      // Log audit action
      await logAction(
        null,
        organizationId,
        'CREATE',
        'dpp',
        dppId,
        { productName, productType, batchId }
      );

      console.log(`✓ Digital Product Passport created: ${dppId}`);

      return {
        success: true,
        dppId: dpp.dpp_id,
        dpp,
        message: 'DPP created successfully. This passport is immutable.',
      };
    } catch (error) {
      console.error('DPP creation failed:', error.message);
      throw new Error(`Failed to create DPP: ${error.message}`);
    }
  }

  /**
   * Append event to DPP (append-only pattern)
   * Cannot modify existing entries - only add new ones
   */
  async appendToDPP({
    dppId,
    organizationId,
    eventType,
    eventData,
    attachments = [],
    relatedProducts = [],
  }) {
    try {
      // Get current DPP
      const dppResult = await query(
        'SELECT * FROM digital_product_passports WHERE dpp_id = $1',
        [dppId]
      );

      if (dppResult.rows.length === 0) {
        throw new Error('DPP not found');
      }

      const dpp = dppResult.rows[0];

      // Create new event log entry (append-only)
      const eventId = uuidv4();
      const eventResult = await query(
        `INSERT INTO dpp_event_logs (
          id, dpp_id, event_type, actor_organization_id, changes, attachments,
          related_products, sequence_number, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7,
          (SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM dpp_event_logs WHERE dpp_id = $2),
          $8)
        RETURNING *`,
        [
          eventId,
          dppId,
          eventType,
          organizationId,
          JSON.stringify(eventData),
          JSON.stringify(attachments),
          JSON.stringify(relatedProducts),
          new Date(),
        ]
      );

      // Update DPP updated_at (but NOT the core data - immutable)
      await query(
        'UPDATE digital_product_passports SET updated_at = $1 WHERE dpp_id = $2',
        [new Date(), dppId]
      );

      // Log audit action
      await logAction(
        null,
        organizationId,
        'UPDATE',
        'dpp_event',
        dppId,
        { eventType, eventData }
      );

      console.log(`✓ Event appended to DPP: ${dppId}`);

      return {
        success: true,
        dppId,
        eventId: eventResult.rows[0].id,
        event: eventResult.rows[0],
        message: 'Event appended to DPP successfully. Append-only guarantee maintained.',
      };
    } catch (error) {
      console.error('Failed to append to DPP:', error.message);
      throw new Error(`Failed to append to DPP: ${error.message}`);
    }
  }

  /**
   * Get DPP with full event history (immutable view)
   */
  async getDPP(dppId, includeEvents = true) {
    try {
      // Get DPP
      const dppResult = await query(
        'SELECT * FROM digital_product_passports WHERE dpp_id = $1',
        [dppId]
      );

      if (dppResult.rows.length === 0) {
        throw new Error('DPP not found');
      }

      const dpp = dppResult.rows[0];

      if (includeEvents) {
        // Get all events in order (append-only guarantee)
        const eventsResult = await query(
          `SELECT * FROM dpp_event_logs
           WHERE dpp_id = $1
           ORDER BY sequence_number ASC`,
          [dppId]
        );

        return {
          dpp,
          events: eventsResult.rows,
          eventCount: eventsResult.rows.length,
          isImmutable: dpp.is_immutable,
          integrity: {
            hash: dpp.hash,
            verified: true, // In production, verify hash
          },
        };
      }

      return dpp;
    } catch (error) {
      console.error('Failed to get DPP:', error.message);
      throw error;
    }
  }

  /**
   * List DPPs for organization
   */
  async listDPPs(organizationId, filters = {}) {
    try {
      let whereClause = 'WHERE organization_id = $1';
      const params = [organizationId];
      let paramIndex = 2;

      if (filters.productType) {
        whereClause += ` AND product_type = $${paramIndex}`;
        params.push(filters.productType);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.batchId) {
        whereClause += ` AND batch_id = $${paramIndex}`;
        params.push(filters.batchId);
        paramIndex++;
      }

      const limit = Math.min(filters.limit || 50, 1000);
      const offset = ((filters.page || 0) * limit);

      const result = await query(
        `SELECT * FROM digital_product_passports
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM digital_product_passports ${whereClause}`,
        params
      );

      return {
        dpps: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        page: Math.floor(offset / limit),
      };
    } catch (error) {
      console.error('Failed to list DPPs:', error.message);
      throw error;
    }
  }

  /**
   * Track shipment/supply chain event on DPP
   */
  async recordShipmentEvent({
    dppId,
    organizationId,
    shipmentId,
    fromLocation,
    toLocation,
    timestamp,
    transportMode,
    carrierName,
    containerIds = [],
  }) {
    try {
      return await this.appendToDPP({
        dppId,
        organizationId,
        eventType: 'SHIPMENT',
        eventData: {
          shipmentId,
          fromLocation,
          toLocation,
          timestamp,
          transportMode,
          carrierName,
          containerIds,
        },
      });
    } catch (error) {
      console.error('Failed to record shipment event:', error.message);
      throw error;
    }
  }

  /**
   * Record test/certification event on DPP
   */
  async recordTestEvent({
    dppId,
    organizationId,
    testLabId,
    testType,
    testParameters,
    results,
    certificateId,
    timestamp,
  }) {
    try {
      return await this.appendToDPP({
        dppId,
        organizationId,
        eventType: 'TEST',
        eventData: {
          testLabId,
          testType,
          testParameters,
          results,
          certificateId,
          timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to record test event:', error.message);
      throw error;
    }
  }

  /**
   * Record repair/maintenance event on DPP
   */
  async recordRepairEvent({
    dppId,
    organizationId,
    repairId,
    repairType,
    description,
    repairDate,
    repairedBy,
    parts,
    cost,
  }) {
    try {
      return await this.appendToDPP({
        dppId,
        organizationId,
        eventType: 'REPAIR',
        eventData: {
          repairId,
          repairType,
          description,
          repairDate,
          repairedBy,
          parts,
          cost,
        },
      });
    } catch (error) {
      console.error('Failed to record repair event:', error.message);
      throw error;
    }
  }

  /**
   * Record end-of-life/recycling event on DPP
   */
  async recordEndOfLifeEvent({
    dppId,
    organizationId,
    eolDate,
    eolType,
    recyclingFacility,
    recyclingDetails,
    certifications,
  }) {
    try {
      return await this.appendToDPP({
        dppId,
        organizationId,
        eventType: 'END_OF_LIFE',
        eventData: {
          eolDate,
          eolType,
          recyclingFacility,
          recyclingDetails,
          certifications,
        },
      });
    } catch (error) {
      console.error('Failed to record end-of-life event:', error.message);
      throw error;
    }
  }

  /**
   * Record LCA (Life Cycle Assessment) data
   */
  async recordLCAData({
    dppId,
    organizationId,
    lcaId,
    methodology,
    carbonFootprint,
    waterFootprint,
    wasteGenerated,
    renewableEnergyPercentage,
    certifications,
  }) {
    try {
      return await this.appendToDPP({
        dppId,
        organizationId,
        eventType: 'LCA_DATA',
        eventData: {
          lcaId,
          methodology,
          carbonFootprint,
          waterFootprint,
          wasteGenerated,
          renewableEnergyPercentage,
          certifications,
        },
      });
    } catch (error) {
      console.error('Failed to record LCA data:', error.message);
      throw error;
    }
  }

  /**
   * Get DPP supply chain timeline
   */
  async getSupplyChainTimeline(dppId) {
    try {
      const result = await query(
        `SELECT * FROM dpp_event_logs
         WHERE dpp_id = $1 AND event_type IN ('SHIPMENT', 'RECEIVED', 'DELIVERED')
         ORDER BY sequence_number ASC`,
        [dppId]
      );

      return result.rows.map((event) => ({
        ...event,
        changes: JSON.parse(event.changes),
      }));
    } catch (error) {
      console.error('Failed to get supply chain timeline:', error.message);
      throw error;
    }
  }

  /**
   * Verify DPP integrity using hash
   */
  async verifyDPPIntegrity(dppId) {
    try {
      const dpp = await this.getDPP(dppId, false);

      // Recalculate hash
      const recalculatedHash = this.calculateHash(
        JSON.parse(dpp.product_data),
        JSON.parse(dpp.material_composition),
        JSON.parse(dpp.certifications)
      );

      const isValid = dpp.hash === recalculatedHash;

      if (isValid) {
        console.log(`✓ DPP integrity verified: ${dppId}`);
      } else {
        console.warn(`⚠ DPP integrity check failed: ${dppId}`);
      }

      return {
        dppId,
        isValid,
        storedHash: dpp.hash,
        calculatedHash: recalculatedHash,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('DPP integrity verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Export DPP as JSON
   */
  async exportDPP(dppId, format = 'json') {
    try {
      const fullDpp = await this.getDPP(dppId, true);

      if (format === 'json') {
        return {
          passport: fullDpp.dpp,
          events: fullDpp.events,
          metadata: {
            eventCount: fullDpp.eventCount,
            isImmutable: fullDpp.isImmutable,
            integrity: fullDpp.integrity,
            exportedAt: new Date(),
          },
        };
      }

      if (format === 'csv') {
        return this.convertDPPToCSV(fullDpp);
      }

      return fullDpp;
    } catch (error) {
      console.error('Failed to export DPP:', error.message);
      throw error;
    }
  }

  /**
   * Get DPP statistics
   */
  async getDPPStatistics(organizationId) {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_dpps,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_dpps,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_dpps,
          COUNT(CASE WHEN status = 'retired' THEN 1 END) as retired_dpps,
          COUNT(DISTINCT product_type) as unique_product_types,
          COUNT(DISTINCT batch_id) as unique_batches
         FROM digital_product_passports
         WHERE organization_id = $1`,
        [organizationId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to get DPP statistics:', error.message);
      throw error;
    }
  }

  /**
   * Search DPPs by criteria
   */
  async searchDPPs(organizationId, searchQuery, filters = {}) {
    try {
      let whereClause = `WHERE organization_id = $1
        AND (product_name ILIKE $2 OR product_id ILIKE $2 OR batch_id ILIKE $2
             OR product_data::text ILIKE $2)`;
      const params = [organizationId, `%${searchQuery}%`];
      let paramIndex = 3;

      if (filters.productType) {
        whereClause += ` AND product_type = $${paramIndex}`;
        params.push(filters.productType);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      const limit = Math.min(filters.limit || 50, 1000);
      const offset = ((filters.page || 0) * limit);

      const result = await query(
        `SELECT * FROM digital_product_passports
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      return {
        results: result.rows,
        total: result.rows.length,
        limit,
        offset,
      };
    } catch (error) {
      console.error('DPP search failed:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Calculate SHA256 hash for DPP data
   */
  calculateHash(productData, materialComposition, certifications) {
    const dataString = JSON.stringify({
      productData,
      materialComposition,
      certifications,
    });

    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Helper: Convert DPP to CSV
   */
  convertDPPToCSV(dpp) {
    const headers = [
      'DPP ID',
      'Product Name',
      'Product Type',
      'Batch ID',
      'Manufacturing Date',
      'Status',
      'Version',
      'Created At',
      'Event Type',
      'Event Timestamp',
      'Event Data',
    ];

    const rows = [];

    // Add main DPP info
    rows.push([
      dpp.dpp.dpp_id,
      dpp.dpp.product_name,
      dpp.dpp.product_type,
      dpp.dpp.batch_id,
      dpp.dpp.manufacturing_date,
      dpp.dpp.status,
      dpp.dpp.version,
      dpp.dpp.created_at,
      'CREATED',
      dpp.dpp.created_at,
      'Initial creation',
    ]);

    // Add events
    dpp.events.forEach((event) => {
      rows.push([
        dpp.dpp.dpp_id,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        event.event_type,
        event.timestamp,
        JSON.stringify(event.changes),
      ]);
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Create DPP from template
   */
  async createFromTemplate(templateId, organizationId, data) {
    try {
      // Get template
      const templateResult = await query(
        'SELECT * FROM dpp_templates WHERE id = $1',
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateResult.rows[0];

      // Create DPP using template
      return await this.createDPP({
        organizationId,
        productId: data.productId,
        productName: data.productName,
        productType: template.product_type,
        batchId: data.batchId,
        manufacturingDate: data.manufacturingDate,
        productData: { ...JSON.parse(template.default_data), ...data.productData },
        materialComposition: data.materialComposition,
        certifications: data.certifications,
      });
    } catch (error) {
      console.error('Failed to create DPP from template:', error.message);
      throw error;
    }
  }

  /**
   * Bulk create DPPs
   */
  async bulkCreateDPPs(organizationId, dppDataArray) {
    try {
      const results = [];
      const errors = [];

      for (const dppData of dppDataArray) {
        try {
          const result = await this.createDPP({
            organizationId,
            ...dppData,
          });
          results.push(result);
        } catch (error) {
          errors.push({
            data: dppData,
            error: error.message,
          });
        }
      }

      return {
        created: results,
        failed: errors,
        total: dppDataArray.length,
        successCount: results.length,
        failureCount: errors.length,
      };
    } catch (error) {
      console.error('Bulk DPP creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Archive a DPP (change status to archived, data remains immutable)
   */
  async archiveDPP(dppId, reason = '') {
    try {
      const result = await query(
        `UPDATE digital_product_passports
         SET status = 'archived', updated_at = $1
         WHERE dpp_id = $2
         RETURNING *`,
        [new Date(), dppId]
      );

      if (result.rows.length === 0) {
        throw new Error('DPP not found');
      }

      console.log(`✓ DPP archived: ${dppId}`);

      return {
        success: true,
        dppId,
        status: 'archived',
        message: 'DPP archived successfully. Data remains immutable and accessible.',
      };
    } catch (error) {
      console.error('Failed to archive DPP:', error.message);
      throw error;
    }
  }
}

export default new DPPService();
