import { query, transaction } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import credencoService from './credencoService.js';
import { logAction } from '../middleware/auditLog.js';

/**
 * Credential Service
 * Manages the complete lifecycle of verifiable credentials
 * Integrates with Credenco and local database
 */

class CredentialService {
  /**
   * Issue a new credential
   */
  async issueCredential({
    organizationId,
    credentialType,
    subjectDid,
    subjectData,
    expirationDate = null,
    metadata = {},
  }) {
    const credentialId = uuidv4();

    try {
      // Issue via Credenco
      const credencoCredential = await credencoService.issueCredential({
        credentialType,
        subjectDid,
        subjectData,
        expirationDate,
        credentialStatus: 'active',
      });

      // Store in local database
      const result = await query(
        `INSERT INTO credentials (
          id, credential_id, organization_id, credential_type, subject_did,
          subject_data, status, issued_at, expires_at, credenco_response,
          metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          credentialId,
          credencoCredential.id,
          organizationId,
          credentialType,
          subjectDid,
          JSON.stringify(subjectData),
          'issued',
          new Date(),
          expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          JSON.stringify(credencoCredential),
          JSON.stringify(metadata),
          new Date(),
        ]
      );

      // Log action
      await logAction(
        null,
        organizationId,
        'CREATE',
        'credentials',
        credentialId,
        { credentialType, subjectDid }
      );

      console.log(`✓ Credential issued: ${credentialId}`);

      return {
        success: true,
        credentialId,
        credential: result.rows[0],
        credencoResponse: credencoCredential,
      };
    } catch (error) {
      console.error('Credential issuance failed:', error.message);
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  /**
   * Verify a credential
   */
  async verifyCredential(credentialId, organizationId = null) {
    try {
      // Get credential from database
      const result = await query(
        'SELECT * FROM credentials WHERE id = $1 OR credential_id = $1',
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const credential = result.rows[0];

      // Check expiration
      if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
        await query(
          'UPDATE credentials SET status = $1 WHERE id = $2',
          ['expired', credential.id]
        );

        return {
          verified: false,
          reason: 'Credential has expired',
          credentialId: credential.id,
        };
      }

      // Check revocation status
      if (credential.status === 'revoked') {
        return {
          verified: false,
          reason: 'Credential has been revoked',
          credentialId: credential.id,
        };
      }

      // Verify with Credenco
      const verification = await credencoService.verifyCredential(credential.credential_id);

      // Store verification record
      await query(
        `INSERT INTO credential_verifications (
          credential_id, verified, verification_result, verified_by_org, verified_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          credential.id,
          verification.verified,
          JSON.stringify(verification),
          organizationId,
          new Date(),
        ]
      );

      console.log(`✓ Credential verified: ${credentialId}`);

      return {
        verified: verification.verified,
        credentialId: credential.id,
        credential,
        verification,
      };
    } catch (error) {
      console.error('Credential verification failed:', error.message);
      throw new Error(`Failed to verify credential: ${error.message}`);
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId, organizationId, reason = 'Requested by holder') {
    try {
      // Get credential
      const result = await query(
        'SELECT * FROM credentials WHERE id = $1 OR credential_id = $1',
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const credential = result.rows[0];

      // Verify ownership
      if (credential.organization_id !== organizationId) {
        throw new Error('Not authorized to revoke this credential');
      }

      // Revoke via Credenco
      await credencoService.revokeCredential(credential.credential_id, reason);

      // Update database
      await query(
        `UPDATE credentials SET status = $1, revoked_at = $2, revocation_reason = $3
         WHERE id = $4`,
        ['revoked', new Date(), reason, credential.id]
      );

      // Log action
      await logAction(
        null,
        organizationId,
        'DELETE',
        'credentials',
        credential.id,
        { reason }
      );

      console.log(`✓ Credential revoked: ${credentialId}`);

      return {
        success: true,
        credentialId: credential.id,
        revokedAt: new Date(),
      };
    } catch (error) {
      console.error('Credential revocation failed:', error.message);
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }
  }

  /**
   * Get credential details
   */
  async getCredential(credentialId) {
    try {
      const result = await query(
        `SELECT c.*, COUNT(cv.id) as verification_count
         FROM credentials c
         LEFT JOIN credential_verifications cv ON c.id = cv.credential_id
         WHERE c.id = $1 OR c.credential_id = $1
         GROUP BY c.id`,
        [credentialId]
      );

      if (result.rows.length === 0) {
        throw new Error('Credential not found');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Failed to get credential:', error.message);
      throw error;
    }
  }

  /**
   * List credentials for organization
   */
  async listCredentials(organizationId, filters = {}) {
    try {
      let whereClause = 'WHERE c.organization_id = $1';
      const params = [organizationId];
      let paramIndex = 2;

      if (filters.status) {
        whereClause += ` AND c.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.credentialType) {
        whereClause += ` AND c.credential_type = $${paramIndex}`;
        params.push(filters.credentialType);
        paramIndex++;
      }

      if (filters.subjectDid) {
        whereClause += ` AND c.subject_did = $${paramIndex}`;
        params.push(filters.subjectDid);
        paramIndex++;
      }

      if (filters.startDate) {
        whereClause += ` AND c.issued_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        whereClause += ` AND c.issued_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      const limit = Math.min(filters.limit || 50, 1000);
      const offset = ((filters.page || 0) * limit);

      const result = await query(
        `SELECT c.*, COUNT(cv.id) as verification_count
         FROM credentials c
         LEFT JOIN credential_verifications cv ON c.id = cv.credential_id
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.issued_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM credentials c ${whereClause}`,
        params
      );

      return {
        credentials: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        page: Math.floor(offset / limit),
      };
    } catch (error) {
      console.error('Failed to list credentials:', error.message);
      throw error;
    }
  }

  /**
   * Get credential statistics
   */
  async getCredentialStats(organizationId) {
    try {
      const result = await query(
        `SELECT
          COUNT(*) as total_credentials,
          SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as active_credentials,
          SUM(CASE WHEN status = 'revoked' THEN 1 ELSE 0 END) as revoked_credentials,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_credentials,
          COUNT(DISTINCT credential_type) as credential_types
         FROM credentials
         WHERE organization_id = $1`,
        [organizationId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Failed to get credential stats:', error.message);
      throw error;
    }
  }

  /**
   * Check for expired credentials and update status
   */
  async updateExpiredCredentials() {
    try {
      const result = await query(
        `UPDATE credentials
         SET status = 'expired'
         WHERE status = 'issued' AND expires_at < NOW()
         RETURNING id`,
      );

      console.log(`✓ Updated ${result.rowCount} expired credentials`);
      return result.rowCount;
    } catch (error) {
      console.error('Failed to update expired credentials:', error.message);
      throw error;
    }
  }

  /**
   * Export credentials for organization
   */
  async exportCredentials(organizationId, format = 'json') {
    try {
      const result = await query(
        `SELECT * FROM credentials
         WHERE organization_id = $1
         ORDER BY issued_at DESC`,
        [organizationId]
      );

      if (format === 'csv') {
        return this.convertToCSV(result.rows);
      }

      return result.rows;
    } catch (error) {
      console.error('Failed to export credentials:', error.message);
      throw error;
    }
  }

  /**
   * Create presentation request for credential verification
   */
  async createPresentationRequest({
    organizationId,
    requestedCredentialTypes,
    requiredClaims = [],
    expirationMinutes = 15,
  }) {
    try {
      const requestId = uuidv4();

      const result = await query(
        `INSERT INTO presentation_requests (
          id, organization_id, credential_types, required_claims,
          status, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          requestId,
          organizationId,
          JSON.stringify(requestedCredentialTypes),
          JSON.stringify(requiredClaims),
          'pending',
          new Date(Date.now() + expirationMinutes * 60 * 1000),
          new Date(),
        ]
      );

      console.log(`✓ Presentation request created: ${requestId}`);

      return result.rows[0];
    } catch (error) {
      console.error('Failed to create presentation request:', error.message);
      throw error;
    }
  }

  /**
   * Verify presentation submission
   */
  async verifyPresentation(presentationRequestId, presentation) {
    try {
      // Get presentation request
      const reqResult = await query(
        'SELECT * FROM presentation_requests WHERE id = $1',
        [presentationRequestId]
      );

      if (reqResult.rows.length === 0) {
        throw new Error('Presentation request not found');
      }

      const request = reqResult.rows[0];

      // Check if expired
      if (new Date(request.expires_at) < new Date()) {
        throw new Error('Presentation request has expired');
      }

      // Verify all credentials in presentation
      const verifications = [];
      let allValid = true;

      for (const credential of presentation.credentials || []) {
        try {
          const verification = await this.verifyCredential(credential.id);
          verifications.push(verification);
          allValid = allValid && verification.verified;
        } catch (error) {
          verifications.push({
            credentialId: credential.id,
            verified: false,
            error: error.message,
          });
          allValid = false;
        }
      }

      // Update presentation request status
      await query(
        `UPDATE presentation_requests
         SET status = $1, verified_at = $2, verification_result = $3
         WHERE id = $4`,
        [
          allValid ? 'verified' : 'rejected',
          new Date(),
          JSON.stringify(verifications),
          presentationRequestId,
        ]
      );

      console.log(`✓ Presentation verified: ${presentationRequestId} - ${allValid ? 'VALID' : 'INVALID'}`);

      return {
        presentationRequestId,
        verified: allValid,
        verifications,
      };
    } catch (error) {
      console.error('Presentation verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Convert credentials to CSV
   */
  convertToCSV(credentials) {
    const headers = [
      'ID',
      'Credential ID',
      'Type',
      'Subject DID',
      'Status',
      'Issued At',
      'Expires At',
      'Revoked At',
    ];

    const rows = credentials.map((cred) => [
      cred.id,
      cred.credential_id,
      cred.credential_type,
      cred.subject_did,
      cred.status,
      cred.issued_at,
      cred.expires_at,
      cred.revoked_at || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Batch revoke credentials
   */
  async batchRevokeCredentials(credentialIds, organizationId, reason) {
    try {
      const results = [];
      const errors = [];

      for (const credId of credentialIds) {
        try {
          const result = await this.revokeCredential(credId, organizationId, reason);
          results.push(result);
        } catch (error) {
          errors.push({
            credentialId: credId,
            error: error.message,
          });
        }
      }

      return {
        revoked: results,
        failed: errors,
        total: credentialIds.length,
        successCount: results.length,
        failureCount: errors.length,
      };
    } catch (error) {
      console.error('Batch revocation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get verification history for credential
   */
  async getVerificationHistory(credentialId, limit = 50) {
    try {
      const result = await query(
        `SELECT * FROM credential_verifications
         WHERE credential_id = (
           SELECT id FROM credentials WHERE id = $1 OR credential_id = $1
         )
         ORDER BY verified_at DESC
         LIMIT $2`,
        [credentialId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get verification history:', error.message);
      throw error;
    }
  }
}

export default new CredentialService();
