import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import credencoService from './credencoService.js';
import ishareService from './ishareService.js';

/**
 * Verification Service
 * Handles credential verification, identity verification, and compliance checks
 * Integrates with Credenco and iSHARE for distributed trust
 */

class VerificationService {
  /**
   * Verify a credential with full audit trail
   */
  async verifyCredential(credentialId, verifierOrganizationId = null) {
    try {
      const verificationId = uuidv4();

      // Get credential from database
      const credResult = await query(
        `SELECT * FROM credentials
         WHERE id = $1 OR credential_id = $1`,
        [credentialId]
      );

      if (credResult.rows.length === 0) {
        throw new Error('Credential not found');
      }

      const credential = credResult.rows[0];

      // Check if credential is revoked
      if (credential.status === 'revoked') {
        await query(
          `INSERT INTO verifications (
            id, credential_id, verifier_org_id, is_valid, reason, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            verificationId,
            credentialId,
            verifierOrganizationId,
            false,
            'Credential has been revoked',
            new Date(),
          ]
        );

        return {
          verified: false,
          reason: 'Credential has been revoked',
          credentialId,
        };
      }

      // Check if credential is expired
      if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
        await query(
          `INSERT INTO verifications (
            id, credential_id, verifier_org_id, is_valid, reason, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            verificationId,
            credentialId,
            verifierOrganizationId,
            false,
            'Credential has expired',
            new Date(),
          ]
        );

        return {
          verified: false,
          reason: 'Credential has expired',
          credentialId,
        };
      }

      // Verify signature and authenticity with Credenco
      let credencoVerification = null;
      try {
        credencoVerification = await credencoService.verifyCredential(credential.credential_id);
      } catch (error) {
        console.warn('Credenco verification failed:', error.message);
      }

      const isValid = credencoVerification?.verified !== false;

      // Record verification
      await query(
        `INSERT INTO verifications (
          id, credential_id, verifier_org_id, is_valid, verification_method,
          credenco_response, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          verificationId,
          credentialId,
          verifierOrganizationId,
          isValid,
          'credenco',
          JSON.stringify(credencoVerification),
          new Date(),
        ]
      );

      console.log(`✓ Credential verified: ${credentialId} - ${isValid ? 'VALID' : 'INVALID'}`);

      return {
        verified: isValid,
        verificationId,
        credentialId,
        credential,
        credencoResponse: credencoVerification,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Credential verification failed:', error.message);
      throw new Error(`Failed to verify credential: ${error.message}`);
    }
  }

  /**
   * Verify organization identity using iSHARE
   */
  async verifyOrganization(organizationId, eori = null) {
    try {
      const verificationId = uuidv4();

      // Get organization from database
      const orgResult = await query(
        `SELECT * FROM organizations WHERE id = $1`,
        [organizationId]
      );

      if (orgResult.rows.length === 0) {
        throw new Error('Organization not found');
      }

      const organization = orgResult.rows[0];
      const orgEori = eori || organization.eori;

      if (!orgEori) {
        throw new Error('EORI not found for organization');
      }

      // Verify EORI format
      const eoriPattern = /^[A-Z]{2}[A-Z0-9]{1,15}$/;
      if (!eoriPattern.test(orgEori)) {
        return {
          verified: false,
          reason: 'Invalid EORI format',
          organizationId,
        };
      }

      // Verify with iSHARE
      let ishareVerification = null;
      try {
        ishareVerification = await ishareService.verifyPartyIdentity(orgEori);
      } catch (error) {
        console.warn('iSHARE verification failed:', error.message);
      }

      const isValid = ishareVerification?.verified === true;

      // Record verification
      const result = await query(
        `INSERT INTO organization_verifications (
          id, organization_id, eori, is_valid, verification_method,
          ishare_response, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          verificationId,
          organizationId,
          orgEori,
          isValid,
          'ishare',
          JSON.stringify(ishareVerification),
          new Date(),
        ]
      );

      // Update organization verification status
      if (isValid) {
        await query(
          `UPDATE organizations SET verified = true, verified_at = $1 WHERE id = $2`,
          [new Date(), organizationId]
        );
      }

      console.log(`✓ Organization verified: ${organizationId} (${orgEori}) - ${isValid ? 'VALID' : 'INVALID'}`);

      return {
        verified: isValid,
        verificationId,
        organizationId,
        eori: orgEori,
        organization,
        ishareResponse: ishareVerification,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Organization verification failed:', error.message);
      throw new Error(`Failed to verify organization: ${error.message}`);
    }
  }

  /**
   * Verify product authenticity and DPP
   */
  async verifyProduct(productId, organizationId = null) {
    try {
      const verificationId = uuidv4();

      // Get product
      const productResult = await query(
        `SELECT p.*, d.id as dpp_id FROM products p
         LEFT JOIN digital_product_passports d ON p.id = d.product_id
         WHERE p.id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.rows[0];

      // Check if DPP exists
      if (!product.dpp_id) {
        return {
          verified: false,
          reason: 'No Digital Product Passport found',
          productId,
          product,
        };
      }

      // Get DPP
      const dppResult = await query(
        `SELECT * FROM digital_product_passports WHERE id = $1`,
        [product.dpp_id]
      );

      const dpp = dppResult.rows[0];

      // Verify DPP integrity
      const integrityCheck = this.verifyDPPHash(dpp);

      // Record verification
      const result = await query(
        `INSERT INTO product_verifications (
          id, product_id, dpp_id, organization_id, is_valid,
          integrity_check, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          verificationId,
          productId,
          product.dpp_id,
          organizationId,
          integrityCheck.valid,
          JSON.stringify(integrityCheck),
          new Date(),
        ]
      );

      console.log(`✓ Product verified: ${productId}`);

      return {
        verified: integrityCheck.valid,
        verificationId,
        productId,
        product,
        dpp,
        integrityCheck,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Product verification failed:', error.message);
      throw new Error(`Failed to verify product: ${error.message}`);
    }
  }

  /**
   * Verify material composition
   */
  async verifyMaterialComposition(dppId, organizationId = null) {
    try {
      const verificationId = uuidv4();

      // Get DPP
      const dppResult = await query(
        `SELECT * FROM digital_product_passports WHERE id = $1`,
        [dppId]
      );

      if (dppResult.rows.length === 0) {
        throw new Error('DPP not found');
      }

      const dpp = dppResult.rows[0];
      const composition = JSON.parse(dpp.material_composition || '{}');

      // Verify composition structure
      const isValid = this.validateMaterialComposition(composition);

      // Record verification
      const result = await query(
        `INSERT INTO material_verifications (
          id, dpp_id, organization_id, is_valid, composition_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          verificationId,
          dppId,
          organizationId,
          isValid,
          JSON.stringify(composition),
          new Date(),
        ]
      );

      console.log(`✓ Material composition verified: ${dppId}`);

      return {
        verified: isValid,
        verificationId,
        dppId,
        composition,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Material verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify certifications
   */
  async verifyCertifications(certificateIds, organizationId = null) {
    try {
      const results = [];

      for (const certId of certificateIds) {
        const certResult = await query(
          `SELECT * FROM certifications WHERE id = $1`,
          [certId]
        );

        if (certResult.rows.length === 0) {
          results.push({
            certificateId: certId,
            verified: false,
            reason: 'Certificate not found',
          });
          continue;
        }

        const cert = certResult.rows[0];

        // Check expiration
        if (cert.expiration_date && new Date(cert.expiration_date) < new Date()) {
          results.push({
            certificateId: certId,
            verified: false,
            reason: 'Certificate has expired',
            certificate: cert,
          });
          continue;
        }

        // Check revocation
        if (cert.is_revoked) {
          results.push({
            certificateId: certId,
            verified: false,
            reason: 'Certificate has been revoked',
            certificate: cert,
          });
          continue;
        }

        results.push({
          certificateId: certId,
          verified: true,
          certificate: cert,
        });

        // Record verification
        await query(
          `INSERT INTO certification_verifications (
            id, certificate_id, organization_id, is_valid, created_at
          ) VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), certId, organizationId, true, new Date()]
        );
      }

      console.log(`✓ Certifications verified: ${certificateIds.length} total`);

      return {
        verifications: results,
        validCount: results.filter((r) => r.verified).length,
        invalidCount: results.filter((r) => !r.verified).length,
      };
    } catch (error) {
      console.error('Certification verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Batch verify credentials
   */
  async batchVerifyCredentials(credentialIds, verifierOrganizationId = null) {
    try {
      const results = [];
      const errors = [];

      for (const credId of credentialIds) {
        try {
          const verification = await this.verifyCredential(credId, verifierOrganizationId);
          results.push(verification);
        } catch (error) {
          errors.push({
            credentialId: credId,
            error: error.message,
          });
        }
      }

      return {
        verifications: results,
        errors,
        total: credentialIds.length,
        validCount: results.filter((r) => r.verified).length,
        invalidCount: results.filter((r) => !r.verified).length,
      };
    } catch (error) {
      console.error('Batch verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get verification history for resource
   */
  async getVerificationHistory(resourceType, resourceId, limit = 50) {
    try {
      let table = '';
      switch (resourceType) {
        case 'credential':
          table = 'verifications';
          break;
        case 'organization':
          table = 'organization_verifications';
          break;
        case 'product':
          table = 'product_verifications';
          break;
        case 'certificate':
          table = 'certification_verifications';
          break;
        default:
          throw new Error('Unknown resource type');
      }

      const result = await query(
        `SELECT * FROM ${table}
         WHERE ${resourceType}_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [resourceId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get verification history:', error.message);
      throw error;
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStatistics(organizationId = null, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      let whereClause = 'WHERE created_at >= $1';
      const params = [startDate];

      if (organizationId) {
        whereClause += ` AND verifier_org_id = $2`;
        params.push(organizationId);
      }

      const result = await query(
        `SELECT
          COUNT(*) as total_verifications,
          SUM(CASE WHEN is_valid = true THEN 1 ELSE 0 END) as valid_count,
          SUM(CASE WHEN is_valid = false THEN 1 ELSE 0 END) as invalid_count,
          verification_method,
          COUNT(DISTINCT DATE(created_at)) as days_with_verifications
         FROM verifications
         ${whereClause}
         GROUP BY verification_method`,
        params
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get verification statistics:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Verify DPP hash integrity
   */
  verifyDPPHash(dpp) {
    const crypto = require('crypto');

    const dataString = JSON.stringify({
      productData: dpp.product_data,
      materialComposition: dpp.material_composition,
      certifications: dpp.certifications,
    });

    const calculatedHash = crypto.createHash('sha256').update(dataString).digest('hex');

    return {
      valid: dpp.hash === calculatedHash,
      storedHash: dpp.hash,
      calculatedHash,
    };
  }

  /**
   * Helper: Validate material composition structure
   */
  validateMaterialComposition(composition) {
    if (!composition || typeof composition !== 'object') {
      return false;
    }

    // Check for required fields (can be customized)
    const requiredFields = ['materials', 'percentages'];
    for (const field of requiredFields) {
      if (!composition[field]) {
        return false;
      }
    }

    // Validate percentages sum to 100
    const totalPercentage = Object.values(composition.percentages).reduce((a, b) => a + b, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return false;
    }

    return true;
  }

  /**
   * Compliance check
   */
  async performComplianceCheck(organizationId, resourceType, resourceId) {
    try {
      const checks = {
        credentialExistence: false,
        organizationVerified: false,
        dppExists: false,
        certificationsValid: false,
        auditTrailComplete: false,
      };

      // Check credentials exist
      const credResult = await query(
        `SELECT COUNT(*) as count FROM credentials
         WHERE organization_id = $1`,
        [organizationId]
      );
      checks.credentialExistence = parseInt(credResult.rows[0].count) > 0;

      // Check organization is verified
      const orgResult = await query(
        `SELECT verified FROM organizations WHERE id = $1`,
        [organizationId]
      );
      checks.organizationVerified = orgResult.rows.length > 0 && orgResult.rows[0].verified;

      // Check DPP exists for resource
      const dppResult = await query(
        `SELECT COUNT(*) as count FROM digital_product_passports
         WHERE organization_id = $1`,
        [organizationId]
      );
      checks.dppExists = parseInt(dppResult.rows[0].count) > 0;

      // Check certifications are valid
      const certResult = await query(
        `SELECT COUNT(*) as count FROM certifications
         WHERE organization_id = $1 AND expiration_date > NOW()
         AND is_revoked = false`,
        [organizationId]
      );
      checks.certificationsValid = parseInt(certResult.rows[0].count) > 0;

      // Check audit trail
      const auditResult = await query(
        `SELECT COUNT(*) as count FROM audit_logs
         WHERE organization_id = $1`,
        [organizationId]
      );
      checks.auditTrailComplete = parseInt(auditResult.rows[0].count) > 0;

      const isCompliant = Object.values(checks).every((check) => check === true);

      return {
        organizationId,
        isCompliant,
        checks,
        complianceScore: (Object.values(checks).filter((v) => v).length / Object.keys(checks).length) * 100,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Compliance check failed:', error.message);
      throw error;
    }
  }
}

export default new VerificationService();
