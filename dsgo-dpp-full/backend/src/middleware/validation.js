import Joi from 'joi';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const eoriPattern = /^[A-Z]{2}[A-Z0-9]{1,15}$/;

export const schemas = {
  uuid: Joi.string().pattern(uuidPattern).required().messages({
    'string.pattern.base': 'Invalid UUID format',
    'any.required': 'UUID is required',
  }),

  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),

  eori: Joi.string().pattern(eoriPattern).required().messages({
    'string.pattern.base': 'Invalid EORI format. Must be 2 letters followed by 1-15 alphanumeric characters',
    'any.required': 'EORI is required',
  }),

  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).max(1000).default(50),
  }),

  dateRange: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  }),

  material: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    type: Joi.string().max(100),
    unit: Joi.string().max(50),
    origin: Joi.string().max(100),
  }),

  lot: Joi.object({
    materialId: Joi.string().pattern(uuidPattern).required(),
    quantity: Joi.number().positive().required(),
    batchNumber: Joi.string().max(100),
    manufacturingDate: Joi.date().iso(),
    expiryDate: Joi.date().iso().greater(Joi.ref('manufacturingDate')),
    certifications: Joi.array().items(Joi.string()),
  }),

  product: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000),
    category: Joi.string().max(100),
    sku: Joi.string().max(100),
    epcCode: Joi.string().max(100),
  }),

  dpp: Joi.object({
    productId: Joi.string().pattern(uuidPattern).required(),
    productName: Joi.string().min(1).max(255).required(),
    productType: Joi.string().max(100),
    batchId: Joi.string().max(255),
    manufacturingDate: Joi.date().iso(),
    productData: Joi.object(),
    materialComposition: Joi.object(),
    certifications: Joi.array().items(Joi.string()),
  }),

  dppAppend: Joi.object({
    eventType: Joi.string().valid(
      'MATERIAL_CERTIFIED',
      'TEST_REPORT_ISSUED',
      'LCA_DATA',
      'CERTIFICATION_GRANTED',
      'ASSEMBLY_COMPLETED',
      'SHIPMENT',
      'REPAIR',
      'MAINTENANCE',
      'TRANSFER',
      'HANDOVER',
      'DISMANTLING',
      'RECYCLING'
    ).required(),
    eventData: Joi.object().required(),
    attachments: Joi.array().items(Joi.object()),
    relatedProducts: Joi.array().items(Joi.string()),
  }),

  shipment: Joi.object({
    fromOrganizationId: Joi.string().pattern(uuidPattern).required(),
    toOrganizationId: Joi.string().pattern(uuidPattern).required(),
    fromLocation: Joi.string().max(255).required(),
    toLocation: Joi.string().max(255).required(),
    carrierName: Joi.string().max(255),
    transportMode: Joi.string().max(50),
    departureDate: Joi.date().iso(),
    estimatedArrival: Joi.date().iso(),
    containerIds: Joi.array().items(Joi.string()),
    trackingNumber: Joi.string().max(255),
  }),

  transaction: Joi.object({
    fromOrganizationId: Joi.string().pattern(uuidPattern).required(),
    toOrganizationId: Joi.string().pattern(uuidPattern).required(),
    productId: Joi.string().pattern(uuidPattern).required(),
    quantity: Joi.number().positive().required(),
    transactionType: Joi.string().valid('SALE', 'TRANSFER', 'CONSIGNMENT').required(),
    amount: Joi.number().min(0),
    metadata: Joi.object(),
  }),

  assetHandover: Joi.object({
    transactionId: Joi.string().pattern(uuidPattern).required(),
    assetId: Joi.string().pattern(uuidPattern).required(),
    fromOrganizationId: Joi.string().pattern(uuidPattern).required(),
    toOrganizationId: Joi.string().pattern(uuidPattern).required(),
    handoverDate: Joi.date().iso().required(),
    handoverNotes: Joi.string().max(1000),
  }),

  testRequest: Joi.object({
    dppId: Joi.string().pattern(uuidPattern).required(),
    testLabId: Joi.string().pattern(uuidPattern).required(),
    testType: Joi.string().max(100).required(),
    testParameters: Joi.object(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').default('MEDIUM'),
  }),

  testResult: Joi.object({
    testRequestId: Joi.string().pattern(uuidPattern).required(),
    results: Joi.object().required(),
    status: Joi.string().valid('PASSED', 'FAILED', 'CONDITIONAL').required(),
    certificateId: Joi.string().max(255),
  }),

  lcaProject: Joi.object({
    dppId: Joi.string().pattern(uuidPattern).required(),
    methodology: Joi.string().valid('ISO-14040', 'ISO-14044', 'PEF', 'EPD').required(),
    scope: Joi.string().max(500),
    boundary: Joi.string().max(500),
  }),

  lcaResult: Joi.object({
    projectId: Joi.string().pattern(uuidPattern).required(),
    carbonFootprint: Joi.number().required(),
    waterFootprint: Joi.number(),
    wasteGenerated: Joi.number(),
    renewableEnergyPercentage: Joi.number().min(0).max(100),
    assessmentDate: Joi.date().iso().required(),
    validUntil: Joi.date().iso().greater(Joi.ref('assessmentDate')),
  }),

  certification: Joi.object({
    dppId: Joi.string().pattern(uuidPattern).required(),
    certificateType: Joi.string().max(100).required(),
    issuer: Joi.string().max(255).required(),
    issueDate: Joi.date().iso().required(),
    expirationDate: Joi.date().iso().greater(Joi.ref('issueDate')).required(),
    standard: Joi.string().max(100),
  }),

  repair: Joi.object({
    dppId: Joi.string().pattern(uuidPattern).required(),
    repairType: Joi.string().max(100).required(),
    description: Joi.string().max(1000),
    repairDate: Joi.date().iso().required(),
    repairedBy: Joi.string().max(255),
    parts: Joi.array().items(Joi.object()),
    cost: Joi.number().min(0),
  }),

  accessGrant: Joi.object({
    resourceOwnerId: Joi.string().pattern(uuidPattern).required(),
    requesterId: Joi.string().pattern(uuidPattern).required(),
    resourceType: Joi.string().valid('DPP', 'CREDENTIAL', 'DOCUMENT').required(),
    resourceId: Joi.string().pattern(uuidPattern).required(),
    accessLevel: Joi.string().valid('READ', 'APPEND', 'MANAGE').default('READ'),
    expiresAt: Joi.date().iso().greater('now').required(),
    purpose: Joi.string().max(500),
  }),

  auditRequest: Joi.object({
    organizationId: Joi.string().pattern(uuidPattern).required(),
    auditorId: Joi.string().pattern(uuidPattern).required(),
    scope: Joi.string().max(500).required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    resources: Joi.array().items(Joi.string()),
  }),

  auditSubmission: Joi.object({
    auditRequestId: Joi.string().pattern(uuidPattern).required(),
    credentials: Joi.array().items(Joi.object()).required(),
  }),

  complianceCheck: Joi.object({
    organizationId: Joi.string().pattern(uuidPattern).required(),
    framework: Joi.string().max(100).required(),
    requirements: Joi.array().items(Joi.object()).required(),
    portfolioAssets: Joi.array().items(Joi.string()),
  }),

  dismantling: Joi.object({
    dppId: Joi.string().pattern(uuidPattern).required(),
    facilityId: Joi.string().pattern(uuidPattern).required(),
    dismantlingDate: Joi.date().iso().required(),
    outcome: Joi.string().valid('RECYCLED', 'REUSED', 'DISPOSED', 'STORAGE').required(),
    components: Joi.array().items(Joi.object()),
  }),

  recycling: Joi.object({
    lotId: Joi.string().pattern(uuidPattern).required(),
    facilityId: Joi.string().pattern(uuidPattern).required(),
    processType: Joi.string().max(100).required(),
    weight: Joi.number().positive(),
    recyclingPercentage: Joi.number().min(0).max(100),
    epcEventType: Joi.string().valid('OBSERVE', 'TRANSFORM', 'AGGREGATE', 'DISAGGREGATE').required(),
  }),

  organization: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    eori: Joi.string().pattern(eoriPattern).required(),
    website: Joi.string().uri(),
    address: Joi.string().max(500),
    contactEmail: Joi.string().email(),
    phone: Joi.string().max(20),
  }),

  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8),
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    role: Joi.string().valid('admin', 'manager', 'user', 'viewer').default('user'),
  }),
};

export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema '${schemaName}' not found`));
    }

    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          validationErrors: errors,
        },
      });
    }

    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

export const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema '${schemaName}' not found`));
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          validationErrors: errors,
        },
      });
    }

    req.query = value;
    next();
  };
};

export const validateBody = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema '${schemaName}' not found`));
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          validationErrors: errors,
        },
      });
    }

    req.body = value;
    next();
  };
};

export const validateParams = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema '${schemaName}' not found`));
    }

    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: error.details,
        },
      });
    }

    next();
  };
};

export default {
  schemas,
  validate,
  validateQuery,
  validateBody,
  validateParams,
};
