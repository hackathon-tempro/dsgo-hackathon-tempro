import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../database.js';

/**
 * Credenco Business Wallet API Service
 * Handles credential issuance, verification, and revocation
 * Real integration with Credenco's OAuth 2.0 and credential APIs
 */

class CredencoService {
  constructor() {
    this.baseURL = process.env.CREDENCO_API_BASE_URL || 'https://business-wallet-api.credenco.com';
    this.clientId = process.env.CREDENCO_CLIENT_ID;
    this.clientSecret = process.env.CREDENCO_CLIENT_SECRET;
    this.tenantId = process.env.CREDENCO_TENANT_ID;
    this.issuerDid = process.env.CREDENCO_ISSUER_DID;
    this.webhookSecret = process.env.CREDENCO_WEBHOOK_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * OAuth 2.0 Client Credentials Flow
   * Obtains access token for API calls
   */
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
        return this.accessToken;
      }

      const response = await this.client.post('/oauth2/token', {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'credential:issue credential:verify credential:revoke',
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      console.log('✓ Credenco access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('Failed to obtain Credenco access token:', error.message);
      throw new Error(`Credenco authentication failed: ${error.message}`);
    }
  }

  /**
   * Issue a verifiable credential
   * POST /api/v2/credentials/issue
   */
  async issueCredential({
    credentialType,
    subjectDid,
    subjectData,
    expirationDate = null,
    credentialStatus = 'active',
    issuerDataEncrypted = false,
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const payload = {
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://www.w3.org/ns/credentials/examples/v2',
          'https://credenco.com/credentials/v2',
        ],
        type: ['VerifiableCredential', credentialType],
        issuer: this.issuerDid,
        issuanceDate: new Date().toISOString(),
        expirationDate: expirationDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        credentialSubject: {
          id: subjectDid,
          ...subjectData,
        },
        credentialStatus: {
          id: `${this.baseURL}/credentials/status/${crypto.randomUUID()}`,
          type: 'BitstringStatusList',
          statusPurpose: 'revocation',
        },
      };

      const response = await this.client.post('/api/v2/credentials/issue', payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      const credential = response.data;

      // Store credential metadata in database
      await this.storeCredentialMetadata({
        credentialId: credential.id,
        issuer: this.issuerDid,
        subject: subjectDid,
        type: credentialType,
        status: credentialStatus,
        expirationDate,
        credencoId: credential.id,
      });

      console.log(`✓ Credential issued: ${credential.id}`);
      return credential;
    } catch (error) {
      console.error('Credential issuance failed:', error.message);
      throw new Error(`Failed to issue credential: ${error.message}`);
    }
  }

  /**
   * Verify a credential
   */
  async verifyCredential(credentialOrProof) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.post('/api/v2/credentials/verify', {
        credential: credentialOrProof,
        verificationOptions: {
          checkRevocation: true,
          checkExpiration: true,
          checkSignature: true,
        },
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      const verification = response.data;

      // Log verification attempt
      await query(
        `INSERT INTO credential_verifications (credential_id, verified, verification_result, verified_at)
         VALUES ($1, $2, $3, $4)`,
        [
          credentialOrProof.id || 'unknown',
          verification.isValid,
          JSON.stringify(verification),
          new Date(),
        ]
      );

      console.log(`✓ Credential verification: ${verification.isValid ? 'VALID' : 'INVALID'}`);
      return verification;
    } catch (error) {
      console.error('Credential verification failed:', error.message);
      throw new Error(`Failed to verify credential: ${error.message}`);
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId, reason = null) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.post(`/api/v2/credentials/${credentialId}/revoke`, {
        reason: reason || 'Revocation requested',
        revocationDate: new Date().toISOString(),
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      // Update credential status in database
      await query(
        `UPDATE credentials SET status = $1, revoked_at = $2, revocation_reason = $3
         WHERE credenco_id = $4`,
        ['revoked', new Date(), reason, credentialId]
      );

      console.log(`✓ Credential revoked: ${credentialId}`);
      return response.data;
    } catch (error) {
      console.error('Credential revocation failed:', error.message);
      throw new Error(`Failed to revoke credential: ${error.message}`);
    }
  }

  /**
   * Get credential status
   */
  async getCredentialStatus(credentialId) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.get(`/api/v2/credentials/${credentialId}/status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get credential status:', error.message);
      throw new Error(`Failed to get credential status: ${error.message}`);
    }
  }

  /**
   * Create a presentation request
   * For organizations to request credentials from others
   */
  async createPresentationRequest({
    requestingParty,
    credentialTypes = [],
    challenge = null,
    expirationMinutes = 15,
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const presentationRequest = {
        '@context': 'https://w3id.org/presentation-exchange/v1',
        name: 'DSGO Credential Request',
        purpose: 'Digital Product Passport verification',
        input_descriptors: credentialTypes.map((type) => ({
          id: crypto.randomUUID(),
          name: type,
          purpose: `Request for ${type} credential`,
          schema: {
            uri: [type],
          },
        })),
        challenge: challenge || crypto.randomBytes(32).toString('hex'),
        domain: process.env.API_BASE_URL || 'https://dsgo-dpp.com',
        expires_at: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
      };

      // Store in database
      const result = await query(
        `INSERT INTO presentation_requests (
          request_data, requesting_party, credential_types, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          JSON.stringify(presentationRequest),
          requestingParty,
          JSON.stringify(credentialTypes),
          new Date(Date.now() + expirationMinutes * 60 * 1000),
          new Date(),
        ]
      );

      return {
        id: result.rows[0].id,
        presentationRequest,
      };
    } catch (error) {
      console.error('Failed to create presentation request:', error.message);
      throw new Error(`Failed to create presentation request: ${error.message}`);
    }
  }

  /**
   * Verify a presentation (credential proof)
   */
  async verifyPresentation(presentationSubmission) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.post('/api/v2/presentations/verify', {
        presentation: presentationSubmission,
        verificationOptions: {
          checkRevocation: true,
          checkExpiration: true,
          checkSignature: true,
          checkPresentation: true,
        },
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Presentation verification failed:', error.message);
      throw new Error(`Failed to verify presentation: ${error.message}`);
    }
  }

  /**
   * Store credential metadata in local database
   */
  async storeCredentialMetadata({
    credentialId,
    issuer,
    subject,
    type,
    status = 'active',
    expirationDate = null,
    credencoId = null,
  }) {
    try {
      await query(
        `INSERT INTO credentials (
          id, credential_id, organization_id, issuer, subject_did, type, status, expires_at, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (credential_id) DO UPDATE SET
          status = $7, expires_at = $8`,
        [
          credentialId,
          credentialId,
          null,
          issuer,
          subject,
          type,
          status,
          expirationDate,
          JSON.stringify({ credencoId }),
        ]
      );
    } catch (error) {
      console.error('Failed to store credential metadata:', error.message);
      throw error;
    }
  }

  /**
   * Test connection to Credenco API
   */
  async testConnection() {
    try {
      await this.getAccessToken();
      return { status: 'connected', message: 'Credenco API is accessible' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Handle Credenco webhook (alias for handleWebhook)
   */
  async handleCredencoWebhook(payload) {
    const signature = payload.signature || 'no-signature';
    return this.handleWebhook(payload, signature);
  }

  /**
   * Handle Credenco webhook for credential events
   */
  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (computedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      const { event, data } = payload;

      console.log(`📥 Credenco webhook event: ${event}`);

      switch (event) {
        case 'credential.issued':
          await this.handleCredentialIssued(data);
          break;
        case 'credential.revoked':
          await this.handleCredentialRevoked(data);
          break;
        case 'credential.expired':
          await this.handleCredentialExpired(data);
          break;
        default:
          console.warn(`Unknown webhook event: ${event}`);
      }

      return { success: true, event };
    } catch (error) {
      console.error('Webhook handling failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle credential issued webhook
   */
  async handleCredentialIssued(data) {
    try {
      await query(
        `UPDATE credentials SET status = $1, credenco_webhook_received = true
         WHERE credenco_id = $2`,
        ['issued', data.credentialId]
      );
    } catch (error) {
      console.error('Failed to handle credential issued event:', error.message);
    }
  }

  /**
   * Handle credential revoked webhook
   */
  async handleCredentialRevoked(data) {
    try {
      await query(
        `UPDATE credentials SET status = $1, revoked_at = $2, revocation_reason = $3
         WHERE credenco_id = $4`,
        ['revoked', new Date(), data.reason, data.credentialId]
      );
    } catch (error) {
      console.error('Failed to handle credential revoked event:', error.message);
    }
  }

  /**
   * Handle credential expired webhook
   */
  async handleCredentialExpired(data) {
    try {
      await query(
        `UPDATE credentials SET status = $1, expired_at = $2
         WHERE credenco_id = $3`,
        ['expired', new Date(), data.credentialId]
      );
    } catch (error) {
      console.error('Failed to handle credential expired event:', error.message);
    }
  }

  /**
   * Create a DID (Decentralized Identifier) for organization
   */
  async createOrgDID(organizationId, organizationName) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.post('/api/v2/dids/create', {
        method: 'key',
        displayName: organizationName,
        metadata: {
          organizationId,
          createdAt: new Date().toISOString(),
        },
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': this.tenantId,
        },
      });

      // Store DID in database
      await query(
        `INSERT INTO organization_dids (organization_id, did, created_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_id) DO UPDATE SET did = $2`,
        [organizationId, response.data.did, new Date()]
      );

      console.log(`✓ DID created for organization ${organizationId}: ${response.data.did}`);
      return response.data;
    } catch (error) {
      console.error('Failed to create organization DID:', error.message);
      throw new Error(`Failed to create organization DID: ${error.message}`);
    }
  }

  /**
   * Get organization DID
   */
  async getOrgDID(organizationId) {
    try {
      const result = await query(
        'SELECT did FROM organization_dids WHERE organization_id = $1',
        [organizationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Organization DID not found');
      }

      return result.rows[0].did;
    } catch (error) {
      console.error('Failed to get organization DID:', error.message);
      throw error;
    }
  }

  /**
   * Batch issue credentials
   */
  async batchIssueCredentials(credentials) {
    try {
      const results = [];
      const errors = [];

      for (const cred of credentials) {
        try {
          const issued = await this.issueCredential(cred);
          results.push(issued);
        } catch (error) {
          errors.push({
            credential: cred,
            error: error.message,
          });
        }
      }

      return { issued: results, failed: errors };
    } catch (error) {
      console.error('Batch credential issuance failed:', error.message);
      throw error;
    }
  }

  /**
   * Check credential health/status batch
   */
  async checkCredentialHealth(credentialIds) {
    try {
      const accessToken = await this.getAccessToken();

      const statuses = [];
      for (const credId of credentialIds) {
        try {
          const status = await this.getCredentialStatus(credId);
          statuses.push({ credentialId: credId, status });
        } catch (error) {
          statuses.push({ credentialId: credId, error: error.message });
        }
      }

      return statuses;
    } catch (error) {
      console.error('Credential health check failed:', error.message);
      throw error;
    }
  }
}

export default new CredencoService();
