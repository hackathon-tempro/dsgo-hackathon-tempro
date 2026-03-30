import pkg from "pg";
import dotenv from "dotenv";

const { Pool } = pkg;
dotenv.config();

/**
 * Database Configuration and Connection Pool
 * Manages PostgreSQL connections for DSGO/DPP MVP
 */

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "dsgo_dpp_db",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// Event handlers for pool
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.on("connect", () => {
  console.log("✓ New connection to database created");
});

pool.on("remove", () => {
  console.log("⊗ Connection removed from pool");
});

/**
 * Query execution with error handling and logging
 * @param {string} sql - SQL query string
 * @param {array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (sql, params = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(
        `⚠ Slow query detected (${duration}ms): ${sql.substring(0, 50)}...`,
      );
    }

    return result;
  } catch (error) {
    console.error(`Database query error: ${error.message}`);
    console.error(`SQL: ${sql}`);
    throw new Error(`Database query failed: ${error.message}`);
  }
};

/**
 * Get a dedicated client from the pool for manual transaction control
 * @returns {Promise} Database client
 */
export const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    console.error("Failed to get database client:", error);
    throw error;
  }
};

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise} Transaction result
 */
export const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction rolled back:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Health check for database connection
 * @returns {Promise} Health status
 */
export const healthCheck = async () => {
  try {
    const result = await query("SELECT NOW()");
    return {
      status: "healthy",
      timestamp: result.rows[0].now,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
    };
  }
};

/**
 * Close all connections
 */
export const closePool = async () => {
  try {
    await pool.end();
    console.log("✓ Database pool closed");
  } catch (error) {
    console.error("Error closing pool:", error);
    throw error;
  }
};

/**
 * Initialize database schema (called on startup)
 */
export const initDatabase = async () => {
  try {
    console.log("🔄 Initializing database...");

    // Check if migrations table exists
    const migrationsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      );
    `);

    if (!migrationsTable.rows[0].exists) {
      console.log("📝 Creating migrations table...");
      await query(`
        CREATE TABLE migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Check if core tables exist
    const organizationsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'organizations'
      );
    `);

    if (!organizationsTable.rows[0].exists) {
      console.log("📝 Schema not initialized. Run migrations.");
    }

    console.log("✓ Database initialization complete");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

/**
 * Get pool statistics
 */
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

/**
 * Execute multiple queries in sequence
 */
export const queryBatch = async (queries) => {
  const results = [];
  for (const q of queries) {
    const result = await query(q.sql, q.params);
    results.push(result);
  }
  return results;
};

export default pool;
