-- ============================================
-- DSGO/DPP MVP DATABASE SCHEMA
-- ============================================
-- Comprehensive PostgreSQL schema for Digital Product Passport
-- with Credenco and iSHARE integration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ORGANIZATIONS & USERS
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  eori VARCHAR(255) UNIQUE NOT NULL,
  website VARCHAR(255),
  address TEXT,
  contact_email VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_eori CHECK (eori ~ '^[A-Z]{2}[A-Z0-9]{1,15}$')
);

CREATE INDEX idx_organizations_eori ON organizations(eori);
CREATE INDEX idx_organizations_status ON organizations(status);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  permissions JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- CREDENTIALS (Credenco Integration)
-- ============================================

CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id VARCHAR(255) UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issuer VARCHAR(255),
  subject_did VARCHAR(255),
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'issued',
  issued_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revocation_reason VARCHAR(255),
  subject_data JSONB,
  credential_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credentials_organization_id ON credentials(organization_id);
CREATE INDEX idx_credentials_status ON credentials(status);
CREATE INDEX idx_credentials_type ON credentials(type);
CREATE INDEX idx_credentials_subject_did ON credentials(subject_did);
CREATE INDEX idx_credentials_issued_at ON credentials(issued_at);

CREATE TABLE credential_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES credentials(id) ON DELETE CASCADE,
  verified BOOLEAN NOT NULL,
  verification_result JSONB,
  verified_by_org UUID REFERENCES organizations(id),
  verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credential_verifications_credential_id ON credential_verifications(credential_id);

CREATE TABLE credential_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  attributes JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE presentation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  credential_types JSONB,
  required_claims JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  verification_result JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presentation_requests_organization_id ON presentation_requests(organization_id);
CREATE INDEX idx_presentation_requests_status ON presentation_requests(status);

-- ============================================
-- DIGITAL PRODUCT PASSPORTS (Append-Only)
-- ============================================

CREATE TABLE digital_product_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID UNIQUE DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(100),
  batch_id VARCHAR(255),
  manufacturing_date DATE,
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',
  product_data JSONB,
  material_composition JSONB,
  certifications JSONB,
  hash VARCHAR(255),
  is_immutable BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_digital_product_passports_organization_id ON digital_product_passports(organization_id);
CREATE INDEX idx_digital_product_passports_product_id ON digital_product_passports(product_id);
CREATE INDEX idx_digital_product_passports_status ON digital_product_passports(status);
CREATE INDEX idx_digital_product_passports_batch_id ON digital_product_passports(batch_id);
CREATE INDEX idx_digital_product_passports_dpp_id ON digital_product_passports(dpp_id);

CREATE TABLE dpp_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  actor_organization_id UUID REFERENCES organizations(id),
  changes JSONB,
  attachments JSONB,
  related_products JSONB,
  sequence_number INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dpp_event_logs_dpp_id ON dpp_event_logs(dpp_id);
CREATE INDEX idx_dpp_event_logs_event_type ON dpp_event_logs(event_type);
CREATE INDEX idx_dpp_event_logs_sequence ON dpp_event_logs(dpp_id, sequence_number);
CREATE INDEX idx_dpp_event_logs_timestamp ON dpp_event_logs(timestamp DESC);

CREATE TABLE dpp_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_by_org UUID REFERENCES organizations(id),
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dpp_versions_dpp_id ON dpp_versions(dpp_id);
CREATE INDEX idx_dpp_versions_version_number ON dpp_versions(dpp_id, version_number);

CREATE TABLE dpp_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  target_organization_id UUID NOT NULL REFERENCES organizations(id),
  access_level VARCHAR(50) DEFAULT 'read',
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dpp_shares_dpp_id ON dpp_shares(dpp_id);
CREATE INDEX idx_dpp_shares_target_organization_id ON dpp_shares(target_organization_id);

-- ============================================
-- PRODUCTS & MATERIALS
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sku VARCHAR(100),
  epc_code VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_epc_code ON products(epc_code);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  material_name VARCHAR(255) NOT NULL,
  material_type VARCHAR(100),
  percentage DECIMAL(5, 2),
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  supplier_name VARCHAR(255),
  origin_country VARCHAR(100),
  certifications JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_dpp_id ON materials(dpp_id);
CREATE INDEX idx_materials_material_type ON materials(material_type);

-- ============================================
-- SUPPLY CHAIN: SHIPMENTS, TRANSPORT
-- ============================================

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dpp_id UUID REFERENCES digital_product_passports(dpp_id),
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  from_organization_id UUID REFERENCES organizations(id),
  to_organization_id UUID REFERENCES organizations(id),
  status VARCHAR(50) DEFAULT 'pending',
  carrier_name VARCHAR(255),
  transport_mode VARCHAR(50),
  departure_date TIMESTAMP,
  arrival_date TIMESTAMP,
  estimated_arrival TIMESTAMP,
  container_ids JSONB,
  tracking_number VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_organization_id ON shipments(organization_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_shipment_id ON shipments(shipment_id);
CREATE INDEX idx_shipments_dpp_id ON shipments(dpp_id);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);

-- ============================================
-- TESTING & CERTIFICATION
-- ============================================

CREATE TABLE test_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  eori VARCHAR(255) UNIQUE,
  accreditation_number VARCHAR(255),
  website VARCHAR(255),
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_labs_eori ON test_labs(eori);
CREATE INDEX idx_test_labs_status ON test_labs(status);

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id VARCHAR(255) UNIQUE NOT NULL,
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  test_lab_id UUID NOT NULL REFERENCES test_labs(id),
  test_type VARCHAR(100) NOT NULL,
  test_parameters JSONB,
  results JSONB,
  status VARCHAR(50) DEFAULT 'completed',
  test_date DATE NOT NULL,
  certificate_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_dpp_id ON tests(dpp_id);
CREATE INDEX idx_tests_test_lab_id ON tests(test_lab_id);
CREATE INDEX idx_tests_test_type ON tests(test_type);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dpp_id UUID REFERENCES digital_product_passports(dpp_id),
  certificate_type VARCHAR(100) NOT NULL,
  issuer VARCHAR(255),
  issue_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revocation_reason VARCHAR(255),
  certificate_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certifications_organization_id ON certifications(organization_id);
CREATE INDEX idx_certifications_certificate_type ON certifications(certificate_type);
CREATE INDEX idx_certifications_expiration_date ON certifications(expiration_date);
CREATE INDEX idx_certifications_is_revoked ON certifications(is_revoked);

-- ============================================
-- REPAIRS & MAINTENANCE
-- ============================================

CREATE TABLE repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id VARCHAR(255) UNIQUE NOT NULL,
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  repair_type VARCHAR(100),
  description TEXT,
  repair_date DATE NOT NULL,
  repaired_by VARCHAR(255),
  parts JSONB,
  cost DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repairs_dpp_id ON repairs(dpp_id);
CREATE INDEX idx_repairs_organization_id ON repairs(organization_id);
CREATE INDEX idx_repairs_repair_type ON repairs(repair_type);

-- ============================================
-- LIFE CYCLE ASSESSMENT (LCA)
-- ============================================

CREATE TABLE lca_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lca_id VARCHAR(255) UNIQUE NOT NULL,
  dpp_id UUID NOT NULL REFERENCES digital_product_passports(dpp_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  methodology VARCHAR(100),
  carbon_footprint DECIMAL(10, 2),
  water_footprint DECIMAL(10, 2),
  waste_generated DECIMAL(10, 2),
  renewable_energy_percentage DECIMAL(5, 2),
  certifications JSONB,
  assessment_date DATE,
  valid_until DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lca_assessments_dpp_id ON lca_assessments(dpp_id);
CREATE INDEX idx_lca_assessments_organization_id ON lca_assessments(organization_id);

-- ============================================
-- AUDIT LOGS (Append-Only, Immutable)
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  status VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================
-- iSHARE INTEGRATION
-- ============================================

CREATE TABLE ishare_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eori VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  participant_id VARCHAR(255),
  organization_data JSONB,
  ishare_status VARCHAR(50),
  verified_at TIMESTAMP,
  last_verified_at TIMESTAMP
);

CREATE INDEX idx_ishare_organizations_eori ON ishare_organizations(eori);
CREATE INDEX idx_ishare_organizations_organization_id ON ishare_organizations(organization_id);

CREATE TABLE ishare_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eori VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  url VARCHAR(255),
  ishare_status VARCHAR(50),
  registered_at TIMESTAMP,
  last_verified_at TIMESTAMP
);

CREATE INDEX idx_ishare_participants_eori ON ishare_participants(eori);

CREATE TABLE delegation_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id VARCHAR(255) NOT NULL,
  delegate_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  signed_token TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delegation_evidences_delegator_id ON delegation_evidences(delegator_id);
CREATE INDEX idx_delegation_evidences_delegate_id ON delegation_evidences(delegate_id);
CREATE INDEX idx_delegation_evidences_expires_at ON delegation_evidences(expires_at);

CREATE TABLE delegation_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(255),
  delegator_id VARCHAR(255),
  verified BOOLEAN,
  verification_result JSONB,
  error_message TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delegation_verifications_token_hash ON delegation_verifications(token_hash);

CREATE TABLE ishare_auth_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID UNIQUE,
  requester_eori VARCHAR(255),
  target_owner_eori VARCHAR(255),
  resource_id VARCHAR(255),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  response TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_ishare_auth_requests_request_id ON ishare_auth_requests(request_id);
CREATE INDEX idx_ishare_auth_requests_status ON ishare_auth_requests(status);

-- ============================================
-- VERIFICATION & COMPLIANCE
-- ============================================

CREATE TABLE organization_dids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  did VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organization_dids_organization_id ON organization_dids(organization_id);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES credentials(id),
  verifier_org_id UUID REFERENCES organizations(id),
  is_valid BOOLEAN NOT NULL,
  reason VARCHAR(255),
  verification_method VARCHAR(50),
  credenco_response JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verifications_credential_id ON verifications(credential_id);
CREATE INDEX idx_verifications_verifier_org_id ON verifications(verifier_org_id);

CREATE TABLE organization_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  eori VARCHAR(255),
  is_valid BOOLEAN,
  verification_method VARCHAR(50),
  ishare_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organization_verifications_organization_id ON organization_verifications(organization_id);

CREATE TABLE product_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  dpp_id UUID REFERENCES digital_product_passports(dpp_id),
  organization_id UUID REFERENCES organizations(id),
  is_valid BOOLEAN,
  integrity_check JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_verifications_product_id ON product_verifications(product_id);

CREATE TABLE material_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id UUID REFERENCES digital_product_passports(dpp_id),
  organization_id UUID REFERENCES organizations(id),
  is_valid BOOLEAN,
  composition_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_verifications_dpp_id ON material_verifications(dpp_id);

CREATE TABLE certification_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certifications(id),
  organization_id UUID REFERENCES organizations(id),
  is_valid BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certification_verifications_certificate_id ON certification_verifications(certificate_id);

CREATE TABLE compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  compliance_framework VARCHAR(100),
  status VARCHAR(50),
  last_checked TIMESTAMP,
  next_check TIMESTAMP,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_status_organization_id ON compliance_status(organization_id);

-- ============================================
-- GENERAL TABLES
-- ============================================

CREATE TABLE dpp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  product_type VARCHAR(100),
  default_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(255) UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  transaction_type VARCHAR(100),
  amount DECIMAL(10, 2),
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX idx_transactions_status ON transactions(status);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id VARCHAR(255) UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_type VARCHAR(100),
  description TEXT,
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_organization_id ON assets(organization_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);

-- ============================================
-- HELPER FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_product_passports_updated_at BEFORE UPDATE ON digital_product_passports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent DPP modification (enforce immutability)
CREATE OR REPLACE FUNCTION prevent_dpp_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_immutable = true AND (
        OLD.product_data IS DISTINCT FROM NEW.product_data OR
        OLD.material_composition IS DISTINCT FROM NEW.material_composition OR
        OLD.certifications IS DISTINCT FROM NEW.certifications
    ) THEN
        RAISE EXCEPTION 'Digital Product Passport is immutable. Cannot modify core data. Use append-only events instead.';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER prevent_dpp_data_modification BEFORE UPDATE ON digital_product_passports
    FOR EACH ROW EXECUTE FUNCTION prevent_dpp_modification();

-- Grant appropriate permissions
GRANT CONNECT ON DATABASE dsgo_dpp_db TO PUBLIC;
