import bcrypt from 'bcryptjs';
import { query, transaction, closePool } from './database.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const organizations = [
  { name: 'Acme Aluminium Supplier', eori: 'NL000000001012', type: 'supplier', email: 'contact@acme-supplier.nl' },
  { name: 'BuildCorp Manufacturers', eori: 'DE000000001012', type: 'manufacturer', email: 'info@buildcorp.de' },
  { name: 'EuroTest Lab', eori: 'FR000000001012', type: 'test_lab', email: 'tests@eurotest.fr' },
  { name: 'GreenLife LCA', eori: 'NL000000002012', type: 'lca_org', email: 'assessments@greenlife.nl' },
  { name: 'CertifyEU', eori: 'BE000000001012', type: 'certification_body', email: 'certifications@certifyeu.be' },
  { name: 'Constructa BV', eori: 'NL000000003012', type: 'construction_company', email: 'projects@constructa.nl' },
  { name: 'PropInvest Real Estate', eori: 'DE000000002012', type: 'building_owner', email: 'portfolio@propinvest.de' },
  { name: 'MaintainPro Services', eori: 'AT000000001012', type: 'maintenance_company', email: 'service@maintainpro.at' },
  { name: 'EU Regulatory Authority', eori: 'EU000000001012', type: 'regulatory_authority', email: 'compliance@eu-authority.eu' },
  { name: 'DismantleTech', eori: 'NL000000004012', type: 'dismantling_company', email: 'intake@dismantletech.nl' },
  { name: 'RecycleCircle', eori: 'DE000000003012', type: 'recycler', email: 'processing@recyclecircle.de' },
];

const testUsers = [
  { email: 'admin@dsgo-dpp.com', firstName: 'System', lastName: 'Admin', role: 'admin' },
  { email: 'supplier@acme-supplier.nl', firstName: 'Jan', lastName: 'Supplier', role: 'user', orgIndex: 0 },
  { email: 'manufacturer@buildcorp.de', firstName: 'Hans', lastName: 'Manufacturer', role: 'user', orgIndex: 1 },
  { email: 'tester@eurotest.fr', firstName: 'Marie', lastName: 'Tester', role: 'user', orgIndex: 2 },
  { email: 'lca@greenlife.nl', firstName: 'Erik', lastName: 'LCA', role: 'user', orgIndex: 3 },
  { email: 'certifier@certifyeu.be', firstName: 'Pierre', lastName: 'Certifier', role: 'user', orgIndex: 4 },
  { email: 'constructor@constructa.nl', firstName: 'Klaas', lastName: 'Builder', role: 'user', orgIndex: 5 },
  { email: 'owner@propinvest.de', firstName: 'Anna', lastName: 'Owner', role: 'user', orgIndex: 6 },
  { email: 'maintenance@maintainpro.at', firstName: 'Franz', lastName: 'Maintainer', role: 'user', orgIndex: 7 },
  { email: 'auditor@eu-authority.eu', firstName: 'Sofia', lastName: 'Auditor', role: 'user', orgIndex: 8 },
  { email: 'dismantler@dismantletech.nl', firstName: 'Pieter', lastName: 'Dismantler', role: 'user', orgIndex: 9 },
  { email: 'recycler@recyclecircle.de', firstName: 'Klaus', lastName: 'Recycler', role: 'user', orgIndex: 10 },
];

const products = [
  { name: 'Aluminium Facade Panel', category: 'Construction Materials', sku: 'AFP-001', epc: 'urn:epc:class:AFP-001' },
  { name: 'Steel Reinforcement Bar', category: 'Steel Products', sku: 'SRB-001', epc: 'urn:epc:class:SRB-001' },
  { name: 'Insulation Panel', category: 'Insulation', sku: 'INS-001', epc: 'urn:epc:class:INS-001' },
];

async function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

async function seedOrganizations() {
  console.log('\n📦 Seeding organizations...');
  const orgIds = [];

  for (const org of organizations) {
    const id = uuidv4();
    const did = `did:example:${org.eori}`;

    try {
      await query(
        `INSERT INTO organizations (id, name, eori, contact_email, status, verified)
         VALUES ($1, $2, $3, $4, 'active', true)
         ON CONFLICT (eori) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [id, org.name, org.eori, org.email]
      );

      await query(
        `INSERT INTO organization_dids (organization_id, did)
         VALUES ($1, $2)
         ON CONFLICT (organization_id) DO UPDATE SET did = EXCLUDED.did`,
        [id, did]
      );

      orgIds.push({ id, ...org });
      console.log(`  ✓ ${org.name} (${org.eori})`);
    } catch (error) {
      console.log(`  ⚠ ${org.name}: ${error.message}`);
    }
  }

  return orgIds;
}

async function seedUsers(orgIds) {
  console.log('\n👥 Seeding users...');

  for (const user of testUsers) {
    const orgId = user.orgIndex !== undefined ? orgIds[user.orgIndex]?.id : orgIds[0]?.id;
    const passwordHash = await bcrypt.hash('password123', BCRYPT_ROUNDS);

    try {
      await query(
        `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT (email) DO UPDATE SET last_login = NOW()`,
        [orgId, user.email, passwordHash, user.firstName, user.lastName, user.role]
      );
      console.log(`  ✓ ${user.email}`);
    } catch (error) {
      console.log(`  ⚠ ${user.email}: ${error.message}`);
    }
  }
}

async function seedProducts(orgIds) {
  console.log('\n📋 Seeding products...');

  const manufacturerOrg = orgIds.find(o => o.type === 'manufacturer');
  if (!manufacturerOrg) return;

  for (const product of products) {
    const productId = uuidv4();

    try {
      await query(
        `INSERT INTO products (organization_id, product_id, name, category, sku, epc_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')
         ON CONFLICT DO NOTHING`,
        [manufacturerOrg.id, productId, product.name, product.category, product.sku, product.epc]
      );
      console.log(`  ✓ ${product.name}`);
    } catch (error) {
      console.log(`  ⚠ ${product.name}: ${error.message}`);
    }
  }
}

async function seedTestLabs(orgIds) {
  console.log('\n🔬 Seeding test labs...');

  const testLabOrg = orgIds.find(o => o.type === 'test_lab');
  if (!testLabOrg) return;

  const labs = [
    { name: 'EuroTest Lab', accreditation: 'ETL-2024-001' },
    { name: 'Material Testing Center', accreditation: 'MTC-2024-002' },
  ];

  for (const lab of labs) {
    try {
      await query(
        `INSERT INTO test_labs (name, eori, accreditation_number, contact_email, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT DO NOTHING`,
        [lab.name, testLabOrg.eori, lab.accreditation, testLabOrg.email]
      );
      console.log(`  ✓ ${lab.name}`);
    } catch (error) {
      console.log(`  ⚠ ${lab.name}: ${error.message}`);
    }
  }
}

async function seedSampleDPPs(orgIds) {
  console.log('\n📄 Seeding sample DPPs...');

  const manufacturerOrg = orgIds.find(o => o.type === 'manufacturer');
  if (!manufacturerOrg) return;

  const product = products[0];
  const dppId = uuidv4();
  const productId = uuidv4();

  try {
    await query(
      `INSERT INTO digital_product_passports (
        id, dpp_id, organization_id, product_id, product_name, product_type,
        batch_id, manufacturing_date, status, is_immutable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', true)
      ON CONFLICT (dpp_id) DO NOTHING`,
      [
        dppId, dppId, manufacturerOrg.id, productId, product.name,
        product.category, 'BATCH-2024-001', new Date(), 'active', true
      ]
    );
    console.log(`  ✓ Sample DPP for ${product.name}`);
  } catch (error) {
    console.log(`  ⚠ Sample DPP: ${error.message}`);
  }
}

async function seedIshareParticipants(orgIds) {
  console.log('\n🔐 Seeding iSHARE participants (simulation mode)...');

  for (const org of orgIds) {
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      const certificate = generateSelfSignedCert(org.eori, org.name);

      await query(
        `INSERT INTO ishare_participants (eori, name, ishare_status, registered_at)
         VALUES ($1, $2, 'Active', NOW())
         ON CONFLICT (eori) DO UPDATE SET last_verified_at = NOW()`,
        [org.eori, org.name]
      );

      await query(
        `INSERT INTO ishare_organizations (eori, organization_id, ishare_status, organization_data, verified_at)
         VALUES ($1, $2, 'Active', $3, NOW())
         ON CONFLICT (eori) DO UPDATE SET organization_data = $3`,
        [org.eori, org.id, JSON.stringify({ publicKey, privateKey, certificate })]
      );
    } catch (error) {
      console.log(`  ⚠ iSHARE ${org.name}: ${error.message}`);
    }
  }
  console.log(`  ✓ ${orgIds.length} participants registered (simulated certificates)`);
}

function generateSelfSignedCert(eori, orgName) {
  return `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJHQtKXXXXXXXXXXXXX
...
-----END CERTIFICATE-----
(Simulated self-signed certificate for ${orgName} - ${eori})`;
}

async function seed() {
  try {
    console.log('\n🌱 Starting database seeding...\n');
    console.log('='.repeat(50));

    const orgIds = await seedOrganizations();
    await seedIshareParticipants(orgIds);
    await seedUsers(orgIds);
    await seedProducts(orgIds);
    await seedTestLabs(orgIds);
    await seedSampleDPPs(orgIds);

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📋 Test credentials:');
    console.log('   Email:    admin@dsgo-dpp.com');
    console.log('   Password: password123');
    console.log('');
    console.log('🏢 Organization emails (all use password123):');
    testUsers.slice(1).forEach(u => {
      console.log(`   ${u.role}: ${u.email}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    throw error;
  }
}

async function reset() {
  try {
    console.log('\n⚠️  WARNING: Resetting database...\n');

    await query('DROP TABLE IF EXISTS audit_logs CASCADE');
    await query('DROP TABLE IF EXISTS credentials CASCADE');
    await query('DROP TABLE IF EXISTS digital_product_passports CASCADE');
    await query('DROP TABLE IF EXISTS dpp_event_logs CASCADE');
    await query('DROP TABLE IF EXISTS products CASCADE');
    await query('DROP TABLE IF EXISTS organizations CASCADE');
    await query('DROP TABLE IF EXISTS users CASCADE');
    await query('DROP TABLE IF EXISTS test_labs CASCADE');
    await query('DROP TABLE IF EXISTS ishare_participants CASCADE');
    await query('DROP TABLE IF EXISTS migrations CASCADE');

    console.log('✓ Database reset complete');
    console.log('✓ Run "npm run seed" to repopulate\n');

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    throw error;
  }
}

const command = process.argv[2];

async function main() {
  try {
    switch (command) {
      case 'reset':
        await reset();
        break;
      case 'fresh':
        await reset();
        await seed();
        break;
      default:
        await seed();
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
