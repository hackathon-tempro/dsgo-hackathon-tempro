import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  server: {
    port: parseInt(process.env.PORT) || 3000,
    apiVersion: process.env.API_VERSION || 'v1',
    apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'dsgo_dpp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
    ssl: process.env.DB_SSL === 'true',
    timeout: parseInt(process.env.DB_TIMEOUT) || 5000,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
  },

  credenco: {
    enabled: process.env.FEATURE_CREDENCO_ENABLED === 'true',
    baseUrl: process.env.CREDENCO_API_BASE_URL || 'https://business-wallet-api.credenco.com',
    clientId: process.env.CREDENCO_CLIENT_ID,
    clientSecret: process.env.CREDENCO_CLIENT_SECRET,
    tenantId: process.env.CREDENCO_TENANT_ID,
    issuerDid: process.env.CREDENCO_ISSUER_DID,
    webhookSecret: process.env.CREDENCO_WEBHOOK_SECRET,
  },

  ishare: {
    enabled: process.env.FEATURE_ISHARE_ENABLED === 'true',
    simulationMode: process.env.ISHARE_SIMULATION_MODE === 'true',
    authorityUrl: process.env.ISHARE_AUTHORITY_URL || 'https://trusted-list.ishare.eu',
    tokenEndpoint: process.env.ISHARE_TOKEN_ENDPOINT,
    delegationEndpoint: process.env.ISHARE_DELEGATION_ENDPOINT,
    clientId: process.env.ISHARE_CLIENT_ID,
    privateKeyPath: process.env.ISHARE_PRIVATE_KEY_PATH,
    certificatePath: process.env.ISHARE_CERTIFICATE_PATH,
    eori: process.env.ISHARE_EORI,
  },

  dpp: {
    version: process.env.DPP_VERSION || '1.0.0',
    appendOnlyEnforcement: process.env.DPP_APPEND_ONLY_ENFORCEMENT !== 'false',
    maxBatchSize: parseInt(process.env.DPP_MAX_BATCH_SIZE) || 1000,
    retentionDays: parseInt(process.env.DPP_RETENTION_DAYS) || 2555,
  },

  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED !== 'false',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 2555,
    level: process.env.AUDIT_LOG_LEVEL || 'INFO',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    allowedIpWhitelist: process.env.ALLOWED_IP_WHITELIST?.split(',') || [],
  },

  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3Bucket: process.env.STORAGE_S3_BUCKET,
    s3Region: process.env.STORAGE_S3_REGION || 'eu-west-1',
  },

  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM || 'noreply@dsgo-dpp.com',
  },

  external: {
    apiTimeout: parseInt(process.env.EXTERNAL_API_TIMEOUT) || 10000,
    apiRetries: parseInt(process.env.EXTERNAL_API_RETRIES) || 3,
  },

  features: {
    blockchain: process.env.FEATURE_BLOCKCHAIN_INTEGRATION === 'true',
    multiSignature: process.env.FEATURE_MULTI_SIGNATURE === 'true',
    delegationEvidence: process.env.FEATURE_DELEGATION_EVIDENCE !== 'false',
    automatedCompliance: process.env.FEATURE_AUTOMATED_COMPLIANCE === 'true',
  },

  logging: {
    format: process.env.LOG_FORMAT || 'json',
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
    fileSize: process.env.LOG_FILE_SIZE || '10m',
    fileCount: parseInt(process.env.LOG_FILE_COUNT) || 30,
  },

  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CACHE_TTL) || 3600,
    type: process.env.CACHE_TYPE || 'memory',
  },

  compliance: {
    framework: process.env.COMPLIANCE_FRAMEWORK || 'EU_DPP_REGULATION_2024',
    enforcement: process.env.COMPLIANCE_ENFORCEMENT !== 'false',
  },
};

export const requireCredentials = (service) => {
  const serviceConfig = config[service];
  if (!serviceConfig?.enabled) return true;

  const required = serviceConfig.requiredCredentials || [];
  const missing = required.filter(key => !serviceConfig[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  ${service} is enabled but missing credentials: ${missing.join(', ')}`);
    return false;
  }

  return true;
};

export default config;
