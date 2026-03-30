import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from '../database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Runner
 * Executes schema.sql and tracks migrations
 */

class MigrationRunner {
  constructor() {
    this.migrationsDir = __dirname;
    this.schemaFile = path.join(this.migrationsDir, 'schema.sql');
  }

  /**
   * Run all migrations
   */
  async runMigrations() {
    try {
      console.log('\n🔄 Starting database migrations...\n');

      // Check if schema file exists
      if (!fs.existsSync(this.schemaFile)) {
        throw new Error(`Schema file not found: ${this.schemaFile}`);
      }

      // Read schema file
      const schemaSQL = fs.readFileSync(this.schemaFile, 'utf8');

      // Check if migrations table exists
      try {
        await query('SELECT COUNT(*) FROM migrations');
      } catch (error) {
        console.log('📝 Creating migrations table...');
        await query(`
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
      }

      // Check if migration already exists
      const migration = await query(
        'SELECT * FROM migrations WHERE name = $1',
        ['01_initial_schema']
      );

      if (migration.rows.length > 0) {
        console.log('✓ Schema already initialized (migration exists)');
        console.log(`  Executed at: ${migration.rows[0].executed_at}`);
        return;
      }

      // Split schema into individual statements (handle GO, semicolons, etc.)
      const statements = schemaSQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

      let executed = 0;
      let skipped = 0;

      console.log(`📋 Executing ${statements.length} SQL statements...\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip empty statements and comments
        if (!statement || statement.startsWith('--')) {
          skipped++;
          continue;
        }

        try {
          // Show progress
          if ((i + 1) % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${statements.length}`);
          }

          // Execute statement
          await query(statement);
          executed++;
        } catch (error) {
          // Some statements may fail if they already exist (CREATE IF NOT EXISTS)
          // Log but continue
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          ) {
            skipped++;
          } else {
            console.warn(`⚠ Statement ${i + 1} warning: ${error.message.substring(0, 100)}`);
            skipped++;
          }
        }
      }

      // Record migration
      await query(
        'INSERT INTO migrations (name, executed_at) VALUES ($1, $2)',
        ['01_initial_schema', new Date()]
      );

      console.log(`\n✅ Schema initialization complete!`);
      console.log(`   Statements executed: ${executed}`);
      console.log(`   Skipped/existing: ${skipped}`);
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Check migration status
   */
  async checkStatus() {
    try {
      const result = await query('SELECT * FROM migrations ORDER BY executed_at DESC');

      if (result.rows.length === 0) {
        console.log('\n📊 No migrations executed yet');
        return;
      }

      console.log('\n📊 Migration Status:\n');
      result.rows.forEach((migration) => {
        console.log(`  ✓ ${migration.name}`);
        console.log(`    Executed: ${migration.executed_at}`);
      });
    } catch (error) {
      console.log('\n⚠ Migrations table not found');
    }
  }

  /**
   * Reset database (dangerous!)
   */
  async resetDatabase() {
    try {
      console.log('\n⚠️  WARNING: This will DROP ALL TABLES!');
      console.log('   This action cannot be undone.\n');

      // Get all table names
      const result = await query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      `);

      const tables = result.rows.map((row) => row.table_name);

      if (tables.length === 0) {
        console.log('✓ Database is already empty');
        return;
      }

      // Drop all tables
      for (const table of tables) {
        console.log(`  Dropping table: ${table}`);
        await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      }

      // Clear migrations
      try {
        await query('DROP TABLE IF EXISTS migrations CASCADE');
      } catch (error) {
        // Ignore if migrations table doesn't exist
      }

      console.log('\n✓ Database reset complete');
    } catch (error) {
      console.error('❌ Reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed sample data
   */
  async seedData() {
    try {
      console.log('\n🌱 Seeding sample data...\n');

      // Sample organizations
      console.log('  Adding sample organizations...');
      const org1 = await query(
        `INSERT INTO organizations (name, eori, website, contact_email, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Acme Manufacturing', 'DE123456789012', 'https://acme.example.com', 'contact@acme.example.com', 'active']
      );

      const org2 = await query(
        `INSERT INTO organizations (name, eori, website, contact_email, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        ['Global Recyclers', 'NL987654321098', 'https://recyclers.example.com', 'info@recyclers.example.com', 'active']
      );

      // Sample test labs
      console.log('  Adding sample test labs...');
      await query(
        `INSERT INTO test_labs (name, eori, accreditation_number, contact_email, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          'European Testing Lab',
          'FR111111111111',
          'ETL-2024-001',
          'tests@etl.example.com',
          'active',
        ]
      );

      // Sample products
      console.log('  Adding sample products...');
      const product = await query(
        `INSERT INTO products (organization_id, product_id, name, description, category, sku)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          org1.rows[0].id,
          'PROD-2024-001',
          'Eco-Friendly Widget',
          'A sustainable widget made from recycled materials',
          'Consumer Electronics',
          'ECO-WIDGET-001',
        ]
      );

      // Sample DPP
      console.log('  Adding sample DPP...');
      await query(
        `INSERT INTO digital_product_passports (
          organization_id, product_id, product_name, product_type,
          batch_id, manufacturing_date, status, is_immutable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          org1.rows[0].id,
          'PROD-2024-001',
          'Eco-Friendly Widget',
          'Electronics',
          'BATCH-2024-Q1',
          new Date('2024-01-15'),
          'active',
          true,
        ]
      );

      // Sample certifications
      console.log('  Adding sample certifications...');
      await query(
        `INSERT INTO certifications (
          organization_id, certificate_id, certificate_type,
          issuer, issue_date, expiration_date
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          org1.rows[0].id,
          'CERT-2024-001',
          'ISO-14001',
          'International Standards Organization',
          new Date('2024-01-01'),
          new Date('2026-01-01'),
        ]
      );

      console.log('\n✓ Sample data seeded successfully');
      console.log('\nSample data created:');
      console.log(`  Organizations: 2 (IDs: ${org1.rows[0].id}, ${org2.rows[0].id})`);
      console.log(`  Products: 1`);
      console.log(`  DPPs: 1`);
      console.log(`  Certifications: 1`);
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'reset':
        await runner.resetDatabase();
        await runner.runMigrations();
        break;

      case 'seed':
        await runner.seedData();
        break;

      case 'status':
        await runner.checkStatus();
        break;

      case 'fresh':
        await runner.resetDatabase();
        await runner.runMigrations();
        await runner.seedData();
        break;

      default:
        // Default: just run migrations
        await runner.runMigrations();
        await runner.checkStatus();
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
