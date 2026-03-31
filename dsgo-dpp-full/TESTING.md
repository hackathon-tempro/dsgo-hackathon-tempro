# DSGO/DPP Platform - Testing & Deployment Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm 9+
- PostgreSQL 16 (or use Docker)

### 1. Setup Environment
```bash
cd dsgo-dpp-full
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dsgo_dpp
JWT_SECRET=test-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
FEATURE_CREDENCO_ENABLED=false
FEATURE_ISHARE_ENABLED=false
LOG_LEVEL=debug
VITE_API_URL=http://localhost:3000/api/v1
EOF
```

### 2. Start PostgreSQL
```bash
# Option A: Docker
docker run -d \
  --name dsgo-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dsgo_dpp \
  -p 5432:5432 \
  postgres:16-alpine

# Wait for container to be ready
sleep 3

# Verify connection
psql -U postgres -h localhost -d dsgo_dpp -c "SELECT 1"
```

### 3. Start Backend
```bash
cd backend
npm install
npm run dev
```

Expected output:
```
🚀 Starting DSGO/DPP Backend...
📊 Initializing database...
✓ Database initialized
✅ Server running on http://localhost:3000
```

### 4. Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/ (or 3002)
```

### 5. Access Application
- **Frontend:** http://localhost:5173/ (or http://localhost:3002/)
- **Backend API:** http://localhost:3000/api/v1
- **Health Check:** http://localhost:3000/health

---

## 🧪 Testing Workflows

### Test 1: Login with Demo Users

**Step 1:** Go to http://localhost:5173/login

**Step 2:** Try each demo user:

| Email | Password | Role |
|-------|----------|------|
| `supplier@acme-supplier.nl` | any | Supplier |
| `manufacturer@buildcorp.de` | any | Manufacturer |
| `tester@eurotest.fr` | any | Test Lab |
| `lca@greenlife.nl` | any | LCA Organization |
| `certifier@certifyeu.be` | any | Certification Body |
| `constructor@constructa.nl` | any | Construction Company |
| `owner@propinvest.de` | any | Building Owner |
| `maintenance@maintainpro.at` | any | Maintenance Company |
| `auditor@eu-authority.eu` | any | Regulatory Authority |
| `dismantler@dismantletech.nl` | any | Dismantling Company |
| `recycler@recyclecircle.de` | any | Recycler |

**Expected:** Redirects to role-specific dashboard (e.g., `/supplier`, `/manufacturer`)

**Test Result:** ✅ / ❌

---

### Test 2: Supplier Dashboard Navigation

**Step 1:** Login as `supplier@acme-supplier.nl`

**Step 2:** Navigate through tabs:
- Products
- Passport Issuance
- Outbound Shipments
- Wallet

**Expected:** All tabs load without errors, showing relevant content

**Test Result:** ✅ / ❌

---

### Test 3: Issue Material Passport Credential

**Step 1:** Login as `supplier@acme-supplier.nl`

**Step 2:** Go to "Passport Issuance" tab

**Step 3:** Fill form:
```
Lot ID: urn:lot:LOT-2026-03-001
Material ID: MAT-AL-7075
Batch Number: BATCH-77421
Country of Origin: DE
Recycled Content (%): 22.0
Carbon Footprint (kg CO2e): 3100.0
```

**Step 4:** Click "Issue Credential"

**Expected:** 
- Success toast notification
- Credential appears in Wallet tab
- Request sent to backend: `POST /api/v1/credentials/material-passport`

**Test Result:** ✅ / ❌

---

### Test 4: Verify Credential

**Step 1:** Login as `manufacturer@buildcorp.de`

**Step 2:** Go to "Receiving" tab (default)

**Step 3:** See incoming credentials

**Step 4:** Click "Verify" on a credential

**Expected:**
- Verification completes
- Shows verification results (signature valid, issuer trusted, etc.)
- Option to Accept or Reject delivery

**Test Result:** ✅ / ❌

---

### Test 5: API Health Check

```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "services": {
    "database": { "status": "healthy" },
    "credenco": { "status": "disabled" },
    "ishare": { "status": "disabled" }
  },
  "environment": "development",
  "version": "1.0.0"
}
```

**Test Result:** ✅ / ❌

---

### Test 6: Authenticated API Request

```bash
# Step 1: Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"supplier@acme-supplier.nl","password":"any"}'

# Expected response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user-supplier",
      "email": "supplier@acme-supplier.nl",
      "role": "supplier",
      ...
    }
  }
}

# Step 2: Use token to get credentials
TOKEN="your-token-from-step-1"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/credentials

# Expected: Array of credentials
{
  "success": true,
  "data": [...]
}
```

**Test Result:** ✅ / ❌

---

## 🔗 Real Integrations Setup

### Enabling Credenco Integration

**Prerequisites:**
- Credenco Business Wallet API credentials
- OAuth 2.0 client ID and secret

**Steps:**

1. **Get Credenco Credentials:**
   - Contact Credenco support
   - Request Business Wallet API access
   - Note: `CREDENCO_CLIENT_ID`, `CREDENCO_CLIENT_SECRET`, `CREDENCO_TENANT_ID`

2. **Update .env:**
```env
FEATURE_CREDENCO_ENABLED=true
CREDENCO_API_BASE_URL=https://business-wallet-api.credenco.com
CREDENCO_CLIENT_ID=your-client-id
CREDENCO_CLIENT_SECRET=your-client-secret
CREDENCO_TENANT_ID=your-tenant-id
CREDENCO_ISSUER_DID=did:web:your-domain.com
```

3. **Restart Backend:**
```bash
npm run dev
```

4. **Test Connection:**
```bash
curl http://localhost:3000/health
```

Expected: `"credenco": { "status": "connected" }`

---

### Enabling iSHARE Integration

**Prerequisites:**
- iSHARE Scheme credentials
- Digital certificate and private key
- Participant registry access

**Steps:**

1. **Get iSHARE Credentials:**
   - Register with iSHARE Scheme
   - Request B2B PKI certificate
   - Note: EORI, certificates, keys

2. **Add Certificates:**
```bash
# Place your certificate and key in backend/keys/
cp /path/to/ishare-cert.pem backend/keys/ishare-cert.pem
cp /path/to/ishare-key.pem backend/keys/ishare-key.pem
```

3. **Update .env:**
```env
FEATURE_ISHARE_ENABLED=true
ISHARE_AUTHORITY_URL=https://trusted-list.ishare.eu
ISHARE_CLIENT_ID=your-eori
ISHARE_CERTIFICATE_PATH=./keys/ishare-cert.pem
ISHARE_PRIVATE_KEY_PATH=./keys/ishare-key.pem
ISHARE_EORI=your-eori-code
```

4. **Restart Backend:**
```bash
npm run dev
```

5. **Test Connection:**
```bash
curl http://localhost:3000/health
```

Expected: `"ishare": { "status": "connected" }`

---

## 📊 Database Management

### Initialize Database Schema

```bash
cd backend

# Run migrations
npm run migrate

# Seed demo data
npm run seed
```

### Check Database

```bash
# Connect to database
psql -U postgres -h localhost -d dsgo_dpp

# List tables
\dt

# Check organizations
SELECT id, name, eori, status FROM organizations;

# Check credentials
SELECT id, type, status, issuer FROM credentials;

# Exit
\q
```

### Reset Database

```bash
# Drop and recreate database
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS dsgo_dpp;"
psql -U postgres -h localhost -c "CREATE DATABASE dsgo_dpp;"

# Re-run migrations and seed
cd backend
npm run migrate
npm run seed
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env
PORT=3001 npm run dev
```

---

### Database connection error

**Error:** `password authentication failed for user "postgres"`

**Solution:**
```bash
# Check credentials in .env
cat .env | grep DB_

# Test PostgreSQL connection
psql -U postgres -h localhost -d dsgo_dpp

# If using Docker, check container
docker ps | grep postgres
docker logs dsgo-postgres

# Restart container
docker restart dsgo-postgres
```

---

### Frontend shows `/undefined`

**Error:** Login redirects to `/undefined`

**Solution:**
```bash
# This is fixed in latest code
# Make sure you're on feature/complete-implementation branch
git checkout feature/complete-implementation
git pull

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Restart frontend
npm run dev
```

---

### API calls failing

**Error:** `CORS error` or `401 Unauthorized`

**Solution:**
```bash
# Check ALLOWED_ORIGINS in .env
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002

# Check token in browser localStorage
# Open DevTools > Application > Storage > Local Storage
# Should see 'token' and 'user' keys

# If missing, re-login
```

---

### Dashboard not loading

**Error:** Components not rendering, blank page

**Solution:**
```bash
# Check browser console for errors (F12)
# Check network tab for failed requests

# Verify API is running
curl http://localhost:3000/health

# Restart frontend
npm run dev

# Clear node_modules cache
rm -rf frontend/node_modules package-lock.json
npm install
npm run dev
```

---

## 📋 Testing Checklist

### Frontend Tests
- [ ] All 11 role dashboards load
- [ ] Navigation between tabs works
- [ ] Login/logout works
- [ ] Forms submit successfully
- [ ] Toasts show on success/error
- [ ] Loading states display
- [ ] Responsive on mobile

### Backend Tests
- [ ] Health check returns healthy
- [ ] Auth endpoints work (login, verify, me, logout)
- [ ] Credentials endpoints work (list, get, create, verify)
- [ ] DPP endpoints work (list, get, create, history)
- [ ] All role-specific endpoints accessible
- [ ] Database queries return data
- [ ] Error handling works (404, 401, 500)

### API Tests
- [ ] CORS headers correct
- [ ] Auth token required for protected routes
- [ ] Invalid tokens rejected
- [ ] Request validation works
- [ ] Response format consistent
- [ ] Pagination works

### Database Tests
- [ ] Migrations run successfully
- [ ] Schema created correctly
- [ ] Demo data seeded
- [ ] Queries execute fast
- [ ] Transactions rollback on error

### Integration Tests
- [ ] Credenco OAuth flow works (if enabled)
- [ ] iSHARE token generation works (if enabled)
- [ ] Credentials issued via Credenco
- [ ] Delegation evidence validated via iSHARE

---

## 🚢 Deployment

### Docker Compose (Full Stack)

```bash
cd dsgo-dpp-full

# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=prod-postgres.example.com
DB_USER=prod_user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-long-random-secret-key-12345678901234567890
ALLOWED_ORIGINS=https://dpp.example.com
FEATURE_CREDENCO_ENABLED=true
CREDENCO_CLIENT_ID=prod-client-id
CREDENCO_CLIENT_SECRET=prod-client-secret
FEATURE_ISHARE_ENABLED=true
ISHARE_CERTIFICATE_PATH=/secrets/ishare-cert.pem
ISHARE_PRIVATE_KEY_PATH=/secrets/ishare-key.pem
LOG_LEVEL=info
VITE_API_URL=https://api.dpp.example.com/api/v1
```

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate new JWT_SECRET (min 64 characters)
- [ ] Enable HTTPS/TLS
- [ ] Set ALLOWED_ORIGINS to production domain only
- [ ] Enable rate limiting in production
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Rotate credentials regularly

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `docker-compose logs backend`
3. Review frontend console: Browser DevTools (F12)
4. Check database: `psql -d dsgo_dpp -c "\dt"`

---

## ✅ Success Criteria

The project is successfully deployed when:
- ✅ All 11 role dashboards accessible and functional
- ✅ Can login with demo users
- ✅ Can create and verify credentials
- ✅ Database stores and retrieves data
- ✅ All API endpoints respond correctly
- ✅ Frontend and backend communicate properly
- ✅ Real integrations (Credenco, iSHARE) working (if credentials provided)
- ✅ No errors in logs or console

---

## 🎉 You're Ready!

The DSGO/DPP platform is ready for testing and deployment. Follow the Quick Start guide above to get running in 5 minutes!