import cors from 'cors';

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3001').split(',');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Delegation-Evidence',
    'X-Delegator-ID',
    'X-Idempotency-Key',
    'Accept',
    'Accept-Language',
    'X-Forwarded-For',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);

export const corsWithCustomOptions = (options = {}) => {
  return cors({
    ...corsOptions,
    ...options,
  });
};

export default corsMiddleware;
