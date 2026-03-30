# DSGO/DPP Backend MVP

Digital Product Passport (DPP) platform backend with real **Credenco Business Wallet** and **iSHARE** integration for EU Digital Product Passport Regulation 2024 compliance.

## 🎯 Project Overview

**DSGO/DPP MVP** is a comprehensive backend system implementing all 13 user stories for Digital Product Passport management across supply chains. Built with Node.js/Express, PostgreSQL, and integrated with real credential management (Credenco) and federated authorization (iSHARE).

### Key Features

- ✅ **Credenco Integration**: Real OAuth 2.0 Business Wallet API for credential issuance, verification, and revocation
- ✅ **iSHARE OAuth 2.0**: Federated authentication with delegation evidence validation
- ✅ **Append-Only DPPs**: Immutable product passports per EU regulation
- ✅ **Audit Trail**: Complete compliance logging with 7-year retention
- ✅ **Multi-Org Support**: Organization-scoped access control
- ✅ **100+ REST Endpoints**: Covering all 13 user stories
- ✅ **Production-Ready**: Full error handling, input validation, rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Credenco Business Wallet API credentials
- iSHARE participant registration

### Installation

```bash
# Clone repository
git clone <repo-url>
cd dsgo-dpp-full/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Verify Installation

```bash
# Check health
curl http://localhost:3001/health

# Check API info
curl http://localhost:3001/api/info
```

## 📋 Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dsgo_dpp_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=24h

# Credenco Integration
CREDENCO_API_BASE_URL=https://api.credenco.com/v2
CREDENCO_CLIENT_ID=your-client-id
CREDENCO_CLIENT_SECRET=your-client-secret
CREDENCO_ISSUER_DID=did:example:issuer

# iSHARE Integration
ISHARE_AUTHORITY_URL=https://auth.isharetest.net
ISHARE_CLIENT_ID=your-ishare-id
ISHARE_PRIVATE_KEY_PATH=./certs/ishare-private-key.pem
ISHARE_EORI=EU.EORI.XXXXXXXXXX

# Feature Flags
FEATURE_CREDENCO_ENABLED=true
FEATURE_ISHARE_ENABLED=true
AUDIT_LOG_ENABLED=true
```

## 🏗️ Architecture Overview

### Service Architecture

```
┌─────────────────────────────────────────────┐
│          Express.js API Server              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Middleware Layer                │   │
│  │  - Authentication (JWT)             │   │
│  │  - Audit Logging (Append-Only)      │   │
│  │  - Error Handling                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Services Layer                  │   │
│  │  - CredencoService                  │   │
│  │  - iSHAREService                    │   │
│  │  - CredentialService                │   │
│  │  - DPPService                       │   │
│  │  - AuditService                     │   │
│  │  - VerificationService              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Routes & Controllers            │   │
│  │  - /api/v1/organizations            │   │
│  │  - /api/v1/credentials              │   │
│  │  - /api/v1/dpp                      │   │
│  │  - /api/v1/products                 │   │
│  │  - /api/v1/materials                │   │
│  │  - ... (14+ route files)            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
           ▼              ▼               ▼
     ┌─────────┐  ┌──────────┐  ┌─────────────┐
     │PostgreSQL│  │Credenco  │  │iSHARE Auth  │
     │  DB      │  │  API     │  │ Server      │
     └─────────┘  └──────────┘  └─────────────┘
```

### 13 User Stories Implemented

1. **Organization Management**: CRUD operations with EORI validation
2. **User Management**: Role-based access control (Admin, Manager, User)
3. **Product Registration**: Create and manage products with DPP
4. **Material Declaration**: Track material composition and sources
5. **Shipment Tracking**: Record supply chain movements
6. **Test & Certification**: Upload test results and certifications
7. **Repairs & Maintenance**: Log product repair events
8. **Life Cycle Assessment**: Record environmental impact data
9. **Credential Issuance**: Issue verifiable credentials via Credenco
10. **Credential Verification**: Verify credentials with signature validation
11. **Cross-Org Access**: iSHARE delegation for multi-org collaboration
12. **Audit & Compliance**: Complete audit trail with GDPR/DPP compliance
13. **End-of-Life**: Record recycling and disposal events

## 🔐 Credenco Integration

### Real OAuth 2.0 Client Credentials Flow

The backend implements actual Credenco Business Wallet API integration:

```typescript
// OAuth 2.0 Client Credentials
POST /oauth2/token
{
  "grant_type": "client_credentials",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "scope": "credential:issue credential:verify credential:revoke"
}

// Response
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Credential Issuance

```bash
POST /api/v1/credentials/issue
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "credentialType": "ProductCertification",
  "subjectDid": "did:example:product123",
  "subjectData": {
    "productName": "Eco-Widget",
    "certificationId": "CERT-2024-001"
  },
  "expirationDate": "2025-12-31"
}

# Response
{
  "success": true,
  "credentialId": "cred_abc123",
  "credential": {
    "id": "cred_abc123",
    "type": "VerifiableCredential",
    "issuer": "did:example:issuer",
    "issuanceDate": "2024-01-15T10:00:00Z",
    "credentialSubject": { ... }
  }
}
```

### Credential Verification

```bash
POST /api/v1/credentials/:credentialId/verify
Authorization: Bearer <jwt-token>

# Response
{
  "verified": true,
  "credentialId": "cred_abc123",
  "credential": { ... },
  "verificationResult": {
    "isValid": true,
    "signature": "verified",
    "notRevoked": true,
    "notExpired": true
  },
  "verifiedAt": "2024-01-15T10:05:00Z"
}
```

### Credential Revocation

```bash
DELETE /api/v1/credentials/:credentialId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "reason": "Revocation requested by holder"
}

# Response
{
  "success": true,
  "credentialId": "cred_abc123",
  "revokedAt": "2024-01-15T10:10:00Z"
}
```

## 🔗 iSHARE OAuth 2.0 Integration

### Federated Authentication with JWT Assertion

```bash
# 1. Create JWT Client Assertion (signed with private key)
{
  "iss": "your-client-id",
  "sub": "your-client-id",
  "aud": "https://auth.isharetest.net",
  "iat": 1705326000,
  "exp": 1705329600,
  "jti": "550e8400-e29b-41d4-a716-446655440000"
}

# 2. Request Access Token
POST https://auth.isharetest.net/token
{
  "grant_type": "client_credentials",
  "client_id": "your-client-id",
  "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
  "client_assertion": "eyJhbGc...",
  "scope": "iSHARE"
}
```

### Delegation Evidence

```bash
POST /api/v1/delegation/create
Authorization: Bearer <ishare-token>
Content-Type: application/json

{
  "delegateId": "EU.EORI.partner123",
  "action": "GET",
  "resource": "/products/*"
}

# Response
{
  "delegationEvidence": "eyJhbGc...",
  "expiresAt": "2024-01-16T10:00:00Z"
}
```

### Party Identity Verification

```bash
POST /api/v1/organizations/verify-eori
Content-Type: application/json

{
  "eori": "EU.EORI.123456789012"
}

# Response
{
  "verified": true,
  "organization": {
    "eori": "EU.EORI.123456789012",
    "name": "Example Organization",
    "status": "Active"
  },
  "verifiedAt": "2024-01-15T10:00:00Z"
}
```

## 📊 REST API Endpoints

### Organizations (User Story 1)

```
GET    /api/v1/organizations                    # List all organizations
POST   /api/v1/organizations                    # Create organization
GET    /api/v1/organizations/:id                # Get organization details
PUT    /api/v1/organizations/:id                # Update organization
DELETE /api/v1/organizations/:id                # Delete organization
POST   /api/v1/organizations/:id/verify         # Verify EORI
GET    /api/v1/organizations/:id/users          # List users in org
POST   /api/v1/organizations/:id/users          # Add user to org
```

### Credentials (User Stories 9-10)

```
GET    /api/v1/credentials                      # List credentials
POST   /api/v1/credentials/issue                # Issue credential
GET    /api/v1/credentials/:id                  # Get credential
POST   /api/v1/credentials/:id/verify           # Verify credential
DELETE /api/v1/credentials/:id                  # Revoke credential
POST   /api/v1/credentials/batch-issue          # Batch issue
POST   /api/v1/credentials/:id/presentations   # Create presentation
```

### Digital Product Passports (User Stories 3-8, 13)

```
GET    /api/v1/dpp                              # List DPPs
POST   /api/v1/dpp                              # Create DPP
GET    /api/v1/dpp/:id                          # Get DPP
POST   /api/v1/dpp/:id/events                   # Append event
GET    /api/v1/dpp/:id/timeline                 # Get supply chain timeline
POST   /api/v1/dpp/:id/shipment-event           # Record shipment
POST   /api/v1/dpp/:id/test-event               # Record test
POST   /api/v1/dpp/:id/repair-event             # Record repair
POST   /api/v1/dpp/:id/lca-data                 # Record LCA
POST   /api/v1/dpp/:id/eol-event                # Record end-of-life
GET    /api/v1/dpp/:id/verify-integrity         # Verify immutability
POST   /api/v1/dpp/:id/share                    # Share with org
GET    /api/v1/dpp/:id/export                   # Export as JSON
```

### Products (User Story 3)

```
GET    /api/v1/products                         # List products
POST   /api/v1/products                         # Create product
GET    /api/v1/products/:id                     # Get product
PUT    /api/v1/products/:id                     # Update product
DELETE /api/v1/products/:id                     # Delete product
POST   /api/v1/products/:id/verify              # Verify authenticity
```

### Materials (User Story 4)

```
GET    /api/v1/materials                        # List materials
POST   /api/v1/materials                        # Create material record
GET    /api/v1/materials/:id                    # Get material
PUT    /api/v1/materials/:id                    # Update material
DELETE /api/v1/materials/:id                    # Delete material
POST   /api/v1/materials/:id/verify-composition # Verify composition
```

### Shipments (User Story 5)

```
GET    /api/v1/shipments                        # List shipments
POST   /api/v1/shipments                        # Create shipment
GET    /api/v1/shipments/:id                    # Get shipment
PUT    /api/v1/shipments/:id                    # Update shipment status
POST   /api/v1/shipments/:id/receive            # Mark as received
GET    /api/v1/shipments/:id/track              # Track shipment
```

### Test Labs & Tests (User Story 6)

```
GET    /api/v1/test-labs                        # List labs
POST   /api/v1/test-labs                        # Register lab
GET    /api/v1/tests                            # List tests
POST   /api/v1/tests                            # Upload test result
GET    /api/v1/tests/:id                        # Get test result
```

### Certifications (User Story 6)

```
GET    /api/v1/certifications                   # List certifications
POST   /api/v1/certifications                   # Upload certificate
GET    /api/v1/certifications/:id               # Get certificate
POST   /api/v1/certifications/:id/verify        # Verify certificate
DELETE /api/v1/certifications/:id               # Revoke certificate
```

### Repairs (User Story 7)

```
GET    /api/v1/repairs                          # List repairs
POST   /api/v1/repairs                          # Record repair
GET    /api/v1/repairs/:id                      # Get repair record
PUT    /api/v1/repairs/:id                      # Update repair
```

### LCA Data (User Story 8)

```
GET    /api/v1/lca                              # List LCA assessments
POST   /api/v1/lca                              # Record LCA data
GET    /api/v1/lca/:id                          # Get LCA assessment
POST   /api/v1/lca/:id/verify                   # Verify LCA data
```

### Cross-Org Access (User Story 11)

```
POST   /api/v1/delegation/request               # Request cross-org access
POST   /api/v1/delegation/:id/approve           # Approve delegation
POST   /api/v1/delegation/:id/reject            # Reject delegation
GET    /api/v1/delegation/verify                # Verify delegation
GET    /api/v1/delegation/history               # Get delegation history
```

### Audit & Compliance (User Story 12)

```
GET    /api/v1/audit                            # Get audit logs
GET    /api/v1/audit/resource/:type/:id         # Get resource audit trail
GET    /api/v1/audit/compliance-report          # Generate compliance report
GET    /api/v1/audit/export                     # Export audit logs
POST   /api/v1/compliance/check                 # Run compliance check
```

### Transactions & Assets (Blockchain Ready)

```
GET    /api/v1/transactions                     # List transactions
POST   /api/v1/transactions                     # Record transaction
GET    /api/v1/assets                           # List assets
POST   /api/v1/assets                           # Create asset record
```

## 🗄️ Database Schema

### Core Tables

- **organizations**: Participant information with EORI validation
- **users**: User accounts with role-based permissions
- **credentials**: Issued verifiable credentials from Credenco
- **digital_product_passports**: Immutable DPP records (append-only enforcement via triggers)
- **dpp_event_logs**: Append-only event history (SHIPMENT, TEST, REPAIR, LCA, EOL)
- **products**: Product master data
- **materials**: Material composition tracking
- **shipments**: Supply chain movement records
- **test_labs**: Authorized testing facilities
- **tests**: Test results with certification IDs
- **certifications**: Valid certificates tracking
- **repairs**: Maintenance and repair events
- **lca_assessments**: Environmental impact data
- **audit_logs**: Immutable compliance audit trail
- **delegation_evidences**: iSHARE delegation records

### Key Constraints

- **Immutability**: DPP product data is protected by database trigger preventing modification
- **Append-Only**: Events can only be added, never deleted
- **EORI Validation**: Organization EORI must match pattern `^[A-Z]{2}[A-Z0-9]{1,15}$`
- **Referential Integrity**: Foreign keys enforce data relationships
- **Audit Trail**: All actions logged with user, timestamp, and IP address

## 🔄 Development Workflow

### Running Locally

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Watch tests
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Database Management

```bash
# Run migrations
npm run migrate

# Seed sample data
npm run migrate seed

# Reset database (⚠️ deletes all data)
npm run migrate reset

# Fresh install with seed
npm run migrate fresh
```

### API Testing

```bash
# Health check
curl http://localhost:3001/health

# Get API info
curl http://localhost:3001/api/info

# Authenticate
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token
curl http://localhost:3001/api/v1/organizations \
  -H "Authorization: Bearer <token>"
```

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update all Credenco credentials with production values
- [ ] Update all iSHARE credentials with production values
- [ ] Enable SSL/TLS on database connection
- [ ] Configure rate limiting appropriately
- [ ] Set up proper logging to ELK stack or Splunk
- [ ] Configure backup strategy for PostgreSQL
- [ ] Enable HTTPS on API server
- [ ] Set up monitoring and alerts
- [ ] Configure CORS for frontend domains

### Docker Deployment

```bash
# Build image
docker build -t dsgo-dpp-backend:latest .

# Run container
docker run -d \
  -p 3001:3001 \
  -e DB_HOST=postgres \
  -e CREDENCO_CLIENT_ID=<id> \
  -e CREDENCO_CLIENT_SECRET=<secret> \
  dsgo-dpp-backend:latest
```

### Environment-Specific Configuration

**Development**
```
NODE_ENV=development
LOG_LEVEL=debug
DB_SSL=false
```

**Staging**
```
NODE_ENV=staging
LOG_LEVEL=info
DB_SSL=true
```

**Production**
```
NODE_ENV=production
LOG_LEVEL=error
DB_SSL=true
RATE_LIMIT_MAX_REQUESTS=50
```

## 🔒 Security Considerations

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens with 7-day expiration
- Password hashing with bcrypt (12 rounds)

### Authorization
- Role-based access control (RBAC)
- Organization-scoped resources
- Permission-based fine-grained control

### Data Protection
- Append-only audit logs
- DPP immutability enforcement
- GDPR compliance with data retention
- Sensitive field redaction in logs

### API Security
- Rate limiting (100 requests/15 minutes)
- Input validation with express-validator
- SQL injection prevention (parameterized queries)
- CORS configuration
- Helmet security headers
- Request ID tracking for debugging

## 📝 Logging & Monitoring

### Audit Logs

All actions logged to `audit_logs` table:
- User ID
- Organization ID
- Action (CREATE, READ, UPDATE, DELETE)
- Resource type and ID
- Status (success/failure)
- IP address
- User agent
- Timestamp

### Query Performance

Slow queries (>1s) logged to console:
```
⚠ Slow query detected (1234ms): SELECT * FROM products WHERE...
```

### Error Tracking

All errors logged with:
- Request ID for correlation
- User ID (if authenticated)
- Stack trace
- Error code for frontend handling

## 📚 API Documentation

### Response Format

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "statusCode": 400
  },
  "timestamp": "2024-01-15T10:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication token missing or invalid
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Input validation failed
- `DUPLICATE_ENTRY`: Resource already exists
- `BUSINESS_LOGIC_ERROR`: Operation violates business rules
- `DATABASE_ERROR`: Database operation failed
- `EXTERNAL_SERVICE_ERROR`: Credenco or iSHARE API error

## 🤝 Support for 11 Frontends

This backend supports multiple frontend applications:

1. **Manufacturer Portal** - Product registration and DPP creation
2. **Distributor Portal** - Shipment tracking and custody transfer
3. **Retailer Dashboard** - Product information display
4. **Recycler Interface** - End-of-life management
5. **Test Lab System** - Test result upload
6. **Compliance Dashboard** - Audit and reporting
7. **Admin Console** - Organization and user management
8. **Mobile App** - Portable product scanning
9. **B2B Integration** - API-first integration platform
10. **Public Registry** - Product information lookup
11. **Analytics Dashboard** - Supply chain insights

All frontends use the same REST API with role-based filtering of data.

## 📖 Additional Resources

- [Credenco Documentation](https://developer.credenco.com)
- [iSHARE Specification](https://ishare.eu/standard/details)
- [EU Digital Product Passport Regulation 2024](https://ec.europa.eu)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

## 📄 License

Apache License 2.0

## 👥 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Built for the DSGO Hackathon with ❤️**
