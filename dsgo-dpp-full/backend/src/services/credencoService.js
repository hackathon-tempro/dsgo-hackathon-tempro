import axios from 'axios';
import crypto from 'crypto';
import { query } from '../database.js';

/**
 * Credenco Business Wallet API Service
 * Authenticates via API key passed in the x-api-key header.
 * Manage keys in Business Wallet → Settings → IAM → API Access.
 */

class CredencoService {
  constructor() {
    this.baseURL = process.env.CREDENCO_API_BASE_URL || 'https://wallet.acc.credenco.com';
    this.apiKey = process.env.CREDENCO_API_KEY;
    this.tenantId = process.env.CREDENCO_TENANT_ID;
    this.issuerDid = process.env.CREDENCO_ISSUER_DID;
    this.webhookSecret = process.env.CREDENCO_WEBHOOK_SECRET;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': this.apiKey,
      },
    });
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
  }) {
    try {
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

      const response = await this.client.post('/api/v2/credentials/issue', payload);
      const credential = response.data;

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
   * POST /api/v2/credentials/verify
   */
  async verifyCredential(credentialOrProof) {
    try {
      const response = await this.client.post('/api/v2/credentials/verify', {
        credential: credentialOrProof,
        verificationOptions: {
          checkRevocation: true,
          checkExpiration: true,
          checkSignature: true,
        },
      });

      const verification = response.data;

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
   * POST /api/v2/credentials/:id/revoke
   */
  async revokeCredential(credentialId, reason = null) {
    try {
      const response = await this.client.post(`/api/v2/credentials/${credentialId}/revoke`, {
        reason: reason || 'Revocation requested',
        revocationDate: new Date().toISOString(),
      });

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
   * GET /api/v2/credentials/:id/status
   */
  async getCredentialStatus(credentialId) {
    try {
      const response = await this.client.get(`/api/v2/credentials/${credentialId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get credential status:', error.message);
      throw new Error(`Failed to get credential status: ${error.message}`);
    }
  }

  /**
   * Create a presentation request
   */
  async createPresentationRequest({
    requestingParty,
    credentialTypes = [],
    challenge = null,
    expirationMinutes = 15,
  }) {
    try {
      const presentationRequest = {
        '@context': 'https://w3id.org/presentation-exchange/v1',
        name: 'DSGO Credential Request',
        purpose: 'Digital Product Passport verification',
        input_descriptors: credentialTypes.map((type) => ({
          id: crypto.randomUUID(),
          name: type,
          purpose: `Request for ${type} credential`,
          schema: { uri: [type] },
        })),
        challenge: challenge || crypto.randomBytes(32).toString('hex'),
        domain: process.env.API_BASE_URL || 'https://dsgo-dpp.com',
        expires_at: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
      };

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

      return { id: result.rows[0].id, presentationRequest };
    } catch (error) {
      console.error('Failed to create presentation request:', error.message);
      throw new Error(`Failed to create presentation request: ${error.message}`);
    }
  }

  /**
   * Verify a presentation
   * POST /api/v2/presentations/verify
   */
  async verifyPresentation(presentationSubmission) {
    try {
      const response = await this.client.post('/api/v2/presentations/verify', {
        presentation: presentationSubmission,
        verificationOptions: {
          checkRevocation: true,
          checkExpiration: true,
          checkSignature: true,
          checkPresentation: true,
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
   * Issue credential via OID4VCI flow — delivers credential to a wallet app via QR code.
   * The returned request_uri must be scanned by the Credenco wallet app.
   * POST /api/v2/credential/issue
   */
  async issueToWallet({ template_id, claims, correlation_id = null }) {
    try {
      const body = { template_id, claims };
      if (correlation_id) body.correlation_id = correlation_id;

      const response = await this.client.post('/api/v2/credential/issue', body);
      const { correlation_id: corrId, request_uri, status_uri } = response.data;

      console.log(`✓ Credential offer created: ${corrId}`);
      return { correlation_id: corrId, request_uri, status_uri };
    } catch (error) {
      console.error('issueToWallet failed:', error.response?.data || error.message);
      throw new Error(`Failed to create credential offer: ${error.message}`);
    }
  }

  /**
   * Poll the status of an OID4VCI credential offer
   * GET /api/v2/credential/issue/:correlationId
   */
  async getOfferStatus(correlationId) {
    try {
      const response = await this.client.get(`/api/v2/credential/issue/${correlationId}`);
      return response.data;
    } catch (error) {
      console.error('getOfferStatus failed:', error.message);
      throw new Error(`Failed to get offer status: ${error.message}`);
    }
  }

  /**
   * Test connection — makes a lightweight API call to verify the key works
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return { status: 'error', message: 'CREDENCO_API_KEY is not set' };
      }
      await this.client.get('/api/v2/credentials?limit=1');
      return { status: 'connected', message: 'Credenco API is accessible' };
    } catch (error) {
      if (error.response?.status === 401) {
        return { status: 'error', message: 'Invalid API key (401 Unauthorized)' };
      }
      if (error.response?.status === 403) {
        return { status: 'error', message: 'API key lacks required permissions (403 Forbidden)' };
      }
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Handle Credenco webhook
   */
  async handleCredencoWebhook(payload) {
    const signature = payload.signature || 'no-signature';
    return this.handleWebhook(payload, signature);
  }

  async handleWebhook(payload, signature) {
    try {
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

  async handleCredentialIssued(data) {
    await query(
      `UPDATE credentials SET status = $1, credenco_webhook_received = true WHERE credenco_id = $2`,
      ['issued', data.credentialId]
    );
  }

  async handleCredentialRevoked(data) {
    await query(
      `UPDATE credentials SET status = $1, revoked_at = $2, revocation_reason = $3 WHERE credenco_id = $4`,
      ['revoked', new Date(), data.reason, data.credentialId]
    );
  }

  async handleCredentialExpired(data) {
    await query(
      `UPDATE credentials SET status = $1, expired_at = $2 WHERE credenco_id = $3`,
      ['expired', new Date(), data.credentialId]
    );
  }

  /**
   * Create a DID for an organization
   */
  async createOrgDID(organizationId, organizationName) {
    try {
      const response = await this.client.post('/api/v2/dids/create', {
        method: 'key',
        displayName: organizationName,
        metadata: { organizationId, createdAt: new Date().toISOString() },
      });

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

  async getOrgDID(organizationId) {
    const result = await query(
      'SELECT did FROM organization_dids WHERE organization_id = $1',
      [organizationId]
    );
    if (result.rows.length === 0) throw new Error('Organization DID not found');
    return result.rows[0].did;
  }

  async batchIssueCredentials(credentials) {
    const results = [];
    const errors = [];
    for (const cred of credentials) {
      try {
        results.push(await this.issueCredential(cred));
      } catch (error) {
        errors.push({ credential: cred, error: error.message });
      }
    }
    return { issued: results, failed: errors };
  }

  async checkCredentialHealth(credentialIds) {
    const statuses = [];
    for (const credId of credentialIds) {
      try {
        statuses.push({ credentialId: credId, status: await this.getCredentialStatus(credId) });
      } catch (error) {
        statuses.push({ credentialId: credId, error: error.message });
      }
    }
    return statuses;
  }
}

export default new CredencoService();
