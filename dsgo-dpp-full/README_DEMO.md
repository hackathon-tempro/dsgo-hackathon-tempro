# DSGO/DPP Platform - Hackathon Demo

## 🎯 Demo Focus: 3 Key Storylines

This is a **simplified demo version** showcasing three core features of the Digital Product Passport platform:

### 1. **CO₂ Storyline** 🌍
Track and visualize emissions data across the entire product lifecycle:
- Supplier provides material with CO₂ footprint
- Manufacturer builds product, accumulates CO₂
- Building owner sees total lifecycle emissions

### 2. **Fire Resistance Certification** 🔥
Demonstrate how certifications aggregate up the supply chain:
- Materials certified as fire-resistant by a test lab
- Manufacturer assembles certified components
- Building proves it's fire-safe based on component certifications

### 3. **Official Authority Certification** ✅
Show that an accredited institution validates everything:
- Certification body tests and approves materials
- Issues official certification credential
- Building owner demonstrates compliance with official seal

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Docker installed
- Node.js 18+
- **No authentication needed** - just select company & employee

### Step 1: Start PostgreSQL
```bash
docker run -d --name dsgo-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=dsgo_dpp \
  -p 5432:5432 \
  postgres:16-alpine

sleep 3
```

### Step 2: Start Backend (Terminal 1)
```bash
cd dsgo-dpp-full/backend
npm install
npm run dev
```

Expected: `✅ Server running on http://localhost:3000`

### Step 3: Start Frontend (Terminal 2)
```bash
cd dsgo-dpp-full/frontend
npm install
npm run dev
```

Open: `http://localhost:5173` (or shown URL)

### Step 4: Log In (No Password)
1. Select Company: **BuildCorp Manufacturers**
2. Select Employee: **Hans Mueller**
3. Click **Log In**
4. iSHARE ID appears in top bar: `ORG-MFG-001`

---

## 👥 Demo Companies & Employees

All use **no password** - just select from dropdowns.

### Supplier (Acme Aluminium)
- **Employee:** Maria Schmidt
- **Role:** Sourcing Manager
- **iSHARE ID:** `ORG-SUP-001`

### Manufacturer (BuildCorp)
- **Employee:** Hans Mueller
- **Role:** Operations Lead
- **iSHARE ID:** `ORG-MFG-001`

### Test Lab (EuroTest)
- **Employee:** Dr. Sophie Martin
- **Role:** Lab Director
- **iSHARE ID:** `ORG-LAB-001`

### Certification Body (CertifyEU)
- **Employee:** John Smith
- **Role:** Certifications Manager
- **iSHARE ID:** `ORG-CERT-001`

### Building Owner (PropInvest)
- **Employee:** Elena Rodriguez
- **Role:** Portfolio Manager
- **iSHARE ID:** `ORG-OWNER-001`

---

## 📊 Demo Flows (12 minutes total)

### Flow 1: CO₂ Emissions Tracking (3 minutes)

#### Step 1: Supplier Issues Material
1. Log in as: **Maria Schmidt** (Acme Aluminium)
2. Navigate: **Passport Issuance**
3. Fill form:
   - Lot ID: `LOT-2024-AL-001`
   - Material: `Aluminium Facade Panel`
   - CO₂ Footprint: `3,100 kg CO₂e`
   - Country: `Germany`
4. Click: **Issue Credential**
5. ✅ MaterialPassportCredential created with CO₂ data

#### Step 2: Manufacturer Builds Product
1. Log in as: **Hans Mueller** (BuildCorp)
2. Navigate: **DPP Overview** → **Create New DPP**
3. Fill form:
   - Product Name: `Fire-Resistant Building Panel`
   - Materials: Select `Aluminium Facade Panel` from supplier
   - Manufacturing CO₂: `500 kg CO₂e`
   - Quantity: `5 units`
4. Click: **Create DPP**
5. ✅ DPP created - Total CO₂ now: **3,600 kg CO₂e** (3100 + 500)

#### Step 3: Building Owner Views Lifecycle CO₂
1. Log in as: **Elena Rodriguez** (PropInvest)
2. Navigate: **Portfolio**
3. View building:
   - Components: 5 × Fire-Resistant Building Panel
   - Total Lifecycle CO₂: **3,600 kg CO₂e**
   - Environmental Score: Visible in dashboard
4. Open: **Credential Wallet**
5. ✅ See all CO₂ credentials and total impact

---

### Flow 2: Fire Resistance Certification (4 minutes)

#### Step 1: Test Lab Issues Fire Resistance Test
1. Log in as: **Dr. Sophie Martin** (EuroTest)
2. Navigate: **Test Requests** → **Record Test Results**
3. Fill form:
   - Sample: `Aluminium Facade Panel`
   - Test Type: `Fire Resistance`
   - Result: `Class A - Non-flammable`
   - Method: `ISO 6892-1`
4. Click: **Submit Results**
5. Click: **Issue Credential**
6. ✅ TestReportCredential issued

#### Step 2: Certification Body Approves
1. Log in as: **John Smith** (CertifyEU)
2. Navigate: **Review Queue**
3. Select: Test report from Sophie Martin
4. Review: Fire resistance claim
5. Click: **Approve & Issue Certificate**
6. ✅ ProductCertificate issued - Official validation

#### Step 3: Manufacturer Uses Certified Components
1. Log in as: **Hans Mueller** (BuildCorp)
2. Navigate: **Assembly**
3. View: Certified components available
4. Select: `Aluminium Facade Panel (Fire Certified)`
5. Build: Assembly marked as **"Fire-Safe"**
6. Click: **Create DPP with Certifications**
7. ✅ Product now certified as fire-resistant

#### Step 4: Building Owner Confirms Fire Safety
1. Log in as: **Elena Rodriguez** (PropInvest)
2. Navigate: **Compliance**
3. Click: **Check Fire Safety**
4. Results show:
   - ✅ All components fire-certified
   - ✅ Official certification present
   - ✅ Building is fire-safe
5. Open: **Credential Wallet**
6. ✅ Fire certification badge visible

---

### Flow 3: Authority Validation (2 minutes)

#### Step 1: Show Official Seal
1. **Elena Rodriguez** (Building Owner)
2. Navigate: **Compliance** → **Certifications**
3. Display:
   - CertifyEU official seal
   - Certificate number
   - Issue date
   - Expiration date
4. ✅ Official authority validation visible

#### Step 2: Show Immutability
1. Navigate: **Compliance** → **Audit Trail**
2. Show timeline:
   - Material issued by Supplier (3100 CO₂)
   - Test performed by Lab (Fire Class A)
   - Approved by Cert Body (Official)
   - Used by Manufacturer (+500 CO₂)
   - Received by Building Owner
3. ✅ Every action is recorded, nothing can be changed

#### Step 3: Final Status
1. Display dashboard showing:
   - CO₂ Impact: ✅ **3,600 kg CO₂e** (transparent)
   - Fire Safety: ✅ **Class A** (certified)
   - Authority: ✅ **CertifyEU** (approved)
   - Audit Trail: ✅ **Complete** (immutable)

---

## 🎬 Demo Script (Presenter Notes)

### Opening (1 minute)
*"Today we're demonstrating a Digital Product Passport system that tracks three critical things:*

*1. Environmental impact - every stage of production contributes to CO₂*
*2. Safety certifications - fire resistance and other critical properties*
*3. Official validation - accredited authorities guarantee the claims*

*The key innovation: Everything is verifiable, immutable, and transparent."*

### Part 1: Environmental Transparency (3 minutes)
*"Let's start with supply chain transparency. Here's Maria from a supplier."*
- Show Maria logging in with iSHARE ID
- *"Maria issues a material credential - she's saying: this aluminium has 3,100 kg of CO₂ embedded in it."*
- Show credential issued
- *"Now Hans from the manufacturer receives this. He uses 5 units and adds 500 kg CO₂ for manufacturing."*
- Show Hans creating DPP
- *"Total: 3,600 kg CO₂e. Not hidden - visible to everyone."*
- Show Elena viewing the building
- *"Elena, the building owner, knows exactly what her building is made of and its environmental impact. This is supply chain transparency."*

### Part 2: Safety Certification (4 minutes)
*"But transparency is only part of it. We also need certification. Let's see how fire safety works."*
- Show Sophie from the lab
- *"Sophie is a certified lab director. She tests the aluminium and confirms: Class A fire resistance - non-flammable."*
- Show test report credential
- *"Now John from the certification body independently reviews this."*
- Show John approving
- *"John says: I verify this. I stake my institution's reputation on this claim."*
- Show official certificate issued
- *"Hans now uses these certified fire-resistant components to build the panel."*
- Show Hans assembling
- *"And Elena, the building owner, now knows her building is fire-safe - not just because someone claimed it, but because it's been independently tested and officially certified."*

### Part 3: Immutability (2 minutes)
*"One more thing - all of this is permanent and unchangeable."*
- Show audit trail
- *"Every credential, every approval, every action is recorded. Nothing can be deleted. Nothing can be changed. This is the power of append-only records."*
- *"If there's ever a dispute about materials or safety, we have a complete, verifiable record."*

### Closing (1 minute)
*"The Digital Product Passport creates accountability across entire supply chains. Every actor has skin in the game. Every claim is verifiable. Every building owner has peace of mind. This is the future of sustainable, safe construction."*

---

## 📍 Key UI Elements

### Login Screen
```
🏢 DSGO Digital Product Passport
   Select Company: [BuildCorp Manufacturers ▼]
   Select Employee: [Hans Mueller ▼]
   [Log In] (No Password)
```

### Top Navigation Bar
```
🏢 BuildCorp Manufacturing | iSHARE ID: ORG-MFG-001 | Hans Mueller | [Log Out]
```

### Credential Wallet
```
Issued Credentials
┌─────────────────────────────┐
│ Material Passport Credential │
│ ID: CRED-MAT-001            │
│ CO₂: 3,100 kg CO₂e          │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Test Report Credential      │
│ ID: CRED-TEST-001           │
│ Fire Rating: Class A        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Product Certificate         │
│ ID: CERT-001                │
│ Issued by: CertifyEU        │
│ ✅ Official Authority       │
└─────────────────────────────┘
```

---

## ✨ What's Implemented

### ✅ For Demo
- Company & employee selector (no password)
- iSHARE ID display in navigation
- Credential issuance (Material, Test, Certificate types)
- CO₂ calculation and accumulation
- Fire resistance tracking
- Credential wallet display per role
- Append-only DPP (immutability demo)
- Audit trail showing complete history
- Role-based dashboards (Supplier, Manufacturer, Test Lab, Cert Body, Building Owner)

### ❌ Intentionally Removed for Clarity
- Complex authentication flows
- Multi-signature schemes
- Advanced LCA calculations
- Repair and recycling workflows
- Real Credenco API integration (demo mock instead)
- Real iSHARE PKI (iSHARE ID displayed as simulation)
- Advanced compliance rules

---

## 🎯 Success Criteria

After the demo, judges should see:

- ✅ **CO₂ Transparency:** Building owner sees 3,600 kg CO₂e total
- ✅ **Fire Certification:** Class A fire resistance badge visible
- ✅ **Official Authority:** CertifyEU certification with seal
- ✅ **Verifiable:** Credentials can be traced to issuers
- ✅ **Immutable:** Audit trail shows unchanged history
- ✅ **Transparent:** Each actor's iSHARE ID visible
- ✅ **Easy:** No complex authentication, just company selection

---

## 🔗 Key API Endpoints

**Demo Auth**
- `POST /api/v1/demo/login` - Select company & employee

**Credentials**
- `POST /api/v1/credentials/material-passport` - Issue CO₂ credential
- `POST /api/v1/credentials/test-report` - Issue fire test credential
- `POST /api/v1/credentials/certificate` - Issue official certificate
- `GET /api/v1/credentials` - View credential wallet

**DPP (Digital Product Passport)**
- `POST /api/v1/dpp/create` - Create product DPP
- `GET /api/v1/dpp/:id` - View complete product with all credentials

**Audit**
- `GET /api/v1/audit/trail/:dppId` - View immutable audit trail

---

## 📝 Demo Data Summary

### Material (Supplier)
- Name: Aluminium Facade Panel
- CO₂: 3,100 kg CO₂e
- Fire Rating: Class A (Non-flammable)
- Source: Germany

### Finished Product (Manufacturer)
- Name: Fire-Resistant Building Panel Assembly
- Components: 5 × Aluminium Facade Panel
- Manufacturing CO₂: 500 kg CO₂e
- **Total Lifecycle CO₂: 3,600 kg CO₂e**
- Fire Rating: Class A (Certified)
- Certifications: ✓ Fire Resistant ✓ Official Authority

### Building (Owner)
- Portfolio: 1 building
- Materials: Fire-Resistant panels
- **Total CO₂ Impact: 3,600 kg CO₂e**
- **Fire Safety: Class A (Certified)**
- **Official Approval: CertifyEU ✅**

---

## 🏆 For Judges

### Innovation
- **Verifiable Credentials:** W3C VC 2.0 compliant
- **Immutable Records:** Append-only DPP prevents tampering
- **Digital Identity:** iSHARE IDs for B2B trust
- **Transparency:** Every actor sees the same data
- **Real-World Use:** Actual construction materials & certifications

### Problem Solved
- Supply chains lack transparency
- Certifications are hard to verify
- Environmental impact is hidden
- Fraud is possible in construction
- Building owners don't know their material origins

### Solution
- Digital Product Passport (DPP) creates permanent record
- Each actor has accountability via iSHARE ID
- Credentials are cryptographically verifiable
- Data is immutable (can't be changed retroactively)
- Building owners have peace of mind

---

**Demo Version:** 1.0  
**Status:** 🟢 Ready for Hackathon  
**Duration:** 12 minutes  
**Setup:** 5 minutes  
**Focus:** CO₂ + Fire Safety + Official Authority  
**Key:** Simple, verifiable, immutable, transparent