import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query } from '../database.js';

/**
 * iSHARE OAuth 2.0 and Delegation Evidence Integration Service
 * Implements iSHARE authentication and authorization flows
 * Reference: https://ishare.eu/
 */

class iSHAREService {
  constructor() {
    this.authorityUrl = process.env.ISHARE_AUTHORITY_URL || 'https://trusted-list.ishare.eu';
    this.tokenEndpoint = process.env.ISHARE_TOKEN_ENDPOINT || 'https://your-ishare-provider/token';
    this.delegationEndpoint = process.env.ISHARE_DELEGATION_ENDPOINT || 'https://your-ishare-provider/delegation';
    this.clientId = process.env.ISHARE_CLIENT_ID;
    this.clientSecret = process.env.ISHARE_CLIENT_SECRET;
    this.keyId = process.env.ISHARE_KEY_ID;
    this.privateKeyPath = process.env.ISHARE_PRIVATE_KEY_PATH;
    this.certificatePath = process.env.ISHARE_CERTIFICATE_PATH;
    this.eori = process.env.ISHARE_EORI;
    this.schemeOwner = process.env.ISHARE_SCHEME_OWNER_ID;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.tokenCache = new Map();

    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Load private key for signing client assertions
   */
  loadPrivateKey() {
    try {
      if (!this.privateKeyPath) {
        throw new Error('ISHARE_PRIVATE_KEY_PATH not configured');
      }

      const keyPath = this.privateKeyPath.startsWith('/')
        ? this.privateKeyPath
        : path.join(process.cwd(), this.privateKeyPath);

      const privateKey = fs.readFileSync(keyPath, 'utf-8');
      return privateKey;
    } catch (error) {
      console.error('Failed to load private key:', error.message);
      throw new Error(`Failed to load iSHARE private key: ${error.message}`);
    }
  }

  /**
   * Load certificate
   */
  loadCertificate() {
    try {
      if (!this.certificatePath) {
        throw new Error('ISHARE_CERTIFICATE_PATH not configured');
      }

      const certPath = this.certificatePath.startsWith('/')
        ? this.certificatePath
        : path.join(process.cwd(), this.certificatePath);

      const certificate = fs.readFileSync(certPath, 'utf-8');
      return certificate;
    } catch (error) {
      console.error('Failed to load certificate:', error.message);
      throw new Error(`Failed to load iSHARE certificate: ${error.message}`);
    }
  }

  /**
   * Create JWT Client Assertion (for M2M authentication)
   * Used in OAuth 2.0 client credentials flow
   */
  createClientAssertion() {
    try {
      const privateKey = this.loadPrivateKey();
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 3600; // 1 hour

      const payload = {
        iss: this.clientId, // Issuer (this client)
        sub: this.clientId, // Subject (this client)
        aud: this.tokenEndpoint, // Audience (token endpoint)
        iat: now,
        exp: now + expiresIn,
        jti: crypto.randomUUID(),
      };

      const assertion = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
      });

      console.log('✓ Client assertion created');
      return assertion;
    } catch (error) {
      console.error('Failed to create client assertion:', error.message);
      throw new Error(`Failed to create client assertion: ${error.message}`);
    }
  }

  /**
   * Get access token using OAuth 2.0 Client Credentials flow
   * Implements iSHARE authentication
   */
  async getAccessToken(scope = 'iSHARE') {
    try {
      // Check cache
      const cacheKey = `token_${scope}`;
      if (this.tokenCache.has(cacheKey)) {
        const cached = this.tokenCache.get(cacheKey);
        if (cached.expiry > Date.now()) {
          console.log('✓ Using cached iSHARE access token');
          return cached.token;
        }
      }

      console.log('🔄 Requesting iSHARE access token...');

      const clientAssertion = this.createClientAssertion();

      const response = await this.client.post(this.tokenEndpoint, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: clientAssertion,
        scope,
      });

      const token = response.data.access_token;
      const expiresIn = response.data.expires_in || 3600;

      // Cache token
      this.tokenCache.set(cacheKey, {
        token,
        expiry: Date.now() + expiresIn * 1000 - 60000, // Subtract 1 minute for safety
      });

      console.log('✓ iSHARE access token obtained');
      return token;
    } catch (error) {
      console.error('Failed to get iSHARE access token:', error.message);
      throw new Error(`iSHARE token request failed: ${error.message}`);
    }
  }

  /**
   * Create and send delegation evidence
   * Used to authorize another party to act on behalf of this organization
   */
  async createDelegationEvidence({
    delegateId,
    delegatorId = this.clientId,
    action,
    resource,
    constraints = [],
    notBefore = null,
    notOnOrAfter = null,
  }) {
    try {
      const privateKey = this.loadPrivateKey();
      const now = new Date();
      const expiresIn = 24 * 60 * 60; // 24 hours

      const delegation = {
        delegationEvidence: {
          policyIssuer: delegatorId,
          target: {
            accessSubject: delegateId,
          },
          policySets: [
            {
              policies: [
                {
                  rules: [
                    {
                      effect: 'Permit',
                      action: {
                        names: [action],
                      },
                      resource: {
                        values: [resource],
                      },
                      constraints: constraints.length > 0 ? constraints : undefined,
                    },
                  ],
                },
              ],
              maxDelegationDepth: 1,
            },
          ],
          notBefore: notBefore || now.toISOString(),
          notOnOrAfter: notOnOrAfter || new Date(now.getTime() + expiresIn * 1000).toISOString(),
        },
      };

      // Sign delegation evidence
      const signedToken = jwt.sign(delegation.delegationEvidence, privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
        issuer: delegatorId,
        subject: delegatorId,
        expiresIn: '24h',
        noTimestamp: false,
      });

      // Store in database
      await query(
        `INSERT INTO delegation_evidences (
          delegator_id, delegate_id, action, resource, signed_token, expires_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          delegatorId,
          delegateId,
          action,
          resource,
          signedToken,
          new Date(now.getTime() + expiresIn * 1000),
          now,
        ]
      );

      console.log(`✓ Delegation evidence created for ${delegateId}`);

      return {
        delegationEvidence: signedToken,
        delegateId,
        resource,
        action,
        expiresAt: new Date(now.getTime() + expiresIn * 1000),
      };
    } catch (error) {
      console.error('Failed to create delegation evidence:', error.message);
      throw new Error(`Failed to create delegation evidence: ${error.message}`);
    }
  }

  /**
   * Verify and validate delegation evidence
   */
  async verifyDelegationEvidence(delegationToken, expectedDelegatorId) {
    try {
      // Get issuer's public certificate to verify signature
      const publicCert = await this.getPublicCertificate(expectedDelegatorId);

      // Verify the token
      const decoded = jwt.verify(delegationToken, publicCert, {
        algorithms: ['RS256'],
      });

      console.log('✓ Delegation evidence verified');

      // Store verification in database
      await query(
        `INSERT INTO delegation_verifications (
          token_hash, delegator_id, verified, verification_result, verified_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          crypto.createHash('sha256').update(delegationToken).digest('hex'),
          expectedDelegatorId,
          true,
          JSON.stringify(decoded),
          new Date(),
        ]
      );

      return {
        isValid: true,
        delegationEvidence: decoded,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Delegation evidence verification failed:', error.message);

      // Log failed verification
      await query(
        `INSERT INTO delegation_verifications (
          token_hash, delegator_id, verified, verification_result, verified_at, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.createHash('sha256').update(delegationToken).digest('hex'),
          expectedDelegatorId,
          false,
          null,
          new Date(),
          error.message,
        ]
      );

      throw new Error(`Delegation evidence verification failed: ${error.message}`);
    }
  }

  /**
   * Get public certificate from participant registry
   */
  async getPublicCertificate(participantId) {
    try {
      const response = await this.client.get(
        `${this.authorityUrl}/certificates/${participantId}`
      );

      return response.data.certificate;
    } catch (error) {
      console.error('Failed to get public certificate:', error.message);
      throw new Error(`Failed to retrieve public certificate for ${participantId}: ${error.message}`);
    }
  }

  /**
   * Check authorization based on delegation evidence
   */
  async checkAuthorization({
    delegatorId,
    delegateId,
    action,
    resource,
    delegationToken = null,
  }) {
    try {
      let isAuthorized = false;

      if (delegationToken) {
        // Verify delegation token
        const verification = await this.verifyDelegationEvidence(delegationToken, delegatorId);
        isAuthorized = verification.isValid;
      } else {
        // Check database for active delegation
        const result = await query(
          `SELECT * FROM delegation_evidences
           WHERE delegator_id = $1 AND delegate_id = $2 AND action = $3
           AND resource = $4 AND expires_at > NOW()`,
          [delegatorId, delegateId, action, resource]
        );

        isAuthorized = result.rows.length > 0;
      }

      console.log(
        `🔐 Authorization check: ${isAuthorized ? 'GRANTED' : 'DENIED'} for ${delegateId} to ${action} ${resource}`
      );

      return { isAuthorized, delegatorId, delegateId, action, resource };
    } catch (error) {
      console.error('Authorization check failed:', error.message);
      throw error;
    }
  }

  /**
   * Query participant registry
   */
  async queryParticipantRegistry(eori) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.client.get(
        `${this.authorityUrl}/participants/${eori}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Participant registry query failed:', error.message);
      throw new Error(`Failed to query participant registry: ${error.message}`);
    }
  }

  /**
   * Register participant in iSHARE
   */
  async registerParticipant({
    eori,
    name,
    url,
    certificationStatus = 'Active',
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const participantData = {
        eori,
        name,
        website: url,
        certificationStatus,
        created: new Date().toISOString(),
      };

      const response = await axios.post(
        `${this.authorityUrl}/participants`,
        participantData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`✓ Participant registered: ${eori}`);

      // Store in local database
      await query(
        `INSERT INTO ishare_participants (eori, name, url, ishare_status, registered_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (eori) DO UPDATE SET ishare_status = $4`,
        [eori, name, url, certificationStatus, new Date()]
      );

      return response.data;
    } catch (error) {
      console.error('Participant registration failed:', error.message);
      throw new Error(`Failed to register participant: ${error.message}`);
    }
  }

  /**
   * Verify party identity using iSHARE
   */
  async verifyPartyIdentity(partyEori) {
    try {
      // Check cache first
      const result = await query(
        `SELECT * FROM ishare_participants WHERE eori = $1`,
        [partyEori]
      );

      if (result.rows.length > 0 && result.rows[0].last_verified_at > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        console.log(`✓ Using cached party identity for ${partyEori}`);
        return result.rows[0];
      }

      // Query participant registry
      const participant = await this.queryParticipantRegistry(partyEori);

      // Verify with trusted list
      const trustedListResponse = await this.client.get(
        `${this.authorityUrl}/trusted-list/participants/${partyEori}`
      );

      if (trustedListResponse.data.status !== 'Active') {
        throw new Error('Party not found in trusted list or not active');
      }

      // Update cache
      await query(
        `INSERT INTO ishare_participants (eori, name, url, ishare_status, last_verified_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (eori) DO UPDATE SET last_verified_at = $5`,
        [partyEori, participant.name, participant.website, 'Active', new Date()]
      );

      console.log(`✓ Party identity verified: ${partyEori}`);

      return {
        eori: partyEori,
        verified: true,
        verifiedAt: new Date(),
        participant,
      };
    } catch (error) {
      console.error('Party verification failed:', error.message);
      throw new Error(`Failed to verify party identity: ${error.message}`);
    }
  }

  /**
   * Create authorization request
   */
  async createAuthorizationRequest({
    requesterEori,
    targetResourceOwnerEori,
    resourceId,
    purpose,
    dataShapeId = null,
  }) {
    try {
      const requestId = crypto.randomUUID();

      // Create JWT for authorization request
      const privateKey = this.loadPrivateKey();

      const authRequest = {
        requestId,
        requesterEori,
        targetResourceOwnerEori,
        resourceId,
        purpose,
        dataShapeId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const signedRequest = jwt.sign(authRequest, privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
        issuer: this.clientId,
      });

      // Store request
      await query(
        `INSERT INTO ishare_auth_requests (
          request_id, requester_eori, target_owner_eori, resource_id,
          purpose, status, created_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          requestId,
          requesterEori,
          targetResourceOwnerEori,
          resourceId,
          purpose,
          'pending',
          new Date(),
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        ]
      );

      console.log(`✓ Authorization request created: ${requestId}`);

      return {
        requestId,
        signedRequest,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      console.error('Failed to create authorization request:', error.message);
      throw error;
    }
  }

  /**
   * Approve authorization request
   */
  async approveAuthorizationRequest(requestId, delegationEvidence) {
    try {
      const privateKey = this.loadPrivateKey();

      const approval = {
        requestId,
        decision: 'approved',
        delegationEvidence,
        approvedAt: new Date().toISOString(),
      };

      const signedApproval = jwt.sign(approval, privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
        issuer: this.clientId,
      });

      // Update request status
      await query(
        `UPDATE ishare_auth_requests SET status = $1, response = $2 WHERE request_id = $3`,
        ['approved', signedApproval, requestId]
      );

      console.log(`✓ Authorization request approved: ${requestId}`);

      return {
        requestId,
        decision: 'approved',
        signedApproval,
      };
    } catch (error) {
      console.error('Failed to approve authorization request:', error.message);
      throw error;
    }
  }

  /**
   * Reject authorization request
   */
  async rejectAuthorizationRequest(requestId, reason = 'Not authorized') {
    try {
      const privateKey = this.loadPrivateKey();

      const rejection = {
        requestId,
        decision: 'rejected',
        reason,
        rejectedAt: new Date().toISOString(),
      };

      const signedRejection = jwt.sign(rejection, privateKey, {
        algorithm: 'RS256',
        keyid: this.keyId,
        issuer: this.clientId,
      });

      // Update request status
      await query(
        `UPDATE ishare_auth_requests SET status = $1, response = $2 WHERE request_id = $3`,
        ['rejected', signedRejection, requestId]
      );

      console.log(`✓ Authorization request rejected: ${requestId}`);

      return {
        requestId,
        decision: 'rejected',
        reason,
        signedRejection,
      };
    } catch (error) {
      console.error('Failed to reject authorization request:', error.message);
      throw error;
    }
  }

  /**
   * Verify iSHARE connectivity
   */
  async testConnection() {
    try {
      const token = await this.getAccessToken();

      const response = await this.client.get(
        `${this.authorityUrl}/health`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        status: 'connected',
        message: 'iSHARE authority is accessible',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: `iSHARE connection failed: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }
}

export default new iSHAREService();
