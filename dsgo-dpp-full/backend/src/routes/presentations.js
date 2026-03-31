import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import credentialService from '../services/credentialService.js';

const router = Router();

router.post('/request', authMiddleware, asyncHandler(async (req, res) => {
  const { credentialTypes, requiredClaims, expirationMinutes = 15 } = req.body;

  const result = await credentialService.createPresentationRequest({
    organizationId: req.user.organizationId,
    requestedCredentialTypes: credentialTypes,
    requiredClaims: requiredClaims || [],
    expirationMinutes,
  });

  res.status(201).json({
    success: true,
    data: {
      requestId: result.id,
      presentationRequest: result.presentationRequest,
      expiresAt: result.presentationRequest.expires_at,
    },
  });
}));

router.post('/submit', authMiddleware, asyncHandler(async (req, res) => {
  const { presentationRequestId, credentials, holderDid } = req.body;

  const presentation = {
    credentials,
    holderDid,
    presentedAt: new Date().toISOString(),
  };

  const result = await credentialService.verifyPresentation(presentationRequestId, presentation);

  res.json({
    success: true,
    data: {
      submissionId: uuidv4(),
      presentationRequestId,
      verified: result.verified,
      verifications: result.verifications,
      submittedAt: new Date().toISOString(),
    },
  });
}));

router.post('/verify', authMiddleware, asyncHandler(async (req, res) => {
  const { presentation } = req.body;

  const verifications = [];
  let allValid = true;

  for (const credential of presentation.credentials || []) {
    try {
      const result = await credentialService.verifyCredential(credential.id);
      verifications.push(result);
      if (!result.verified) allValid = false;
    } catch (error) {
      verifications.push({ credentialId: credential.id, verified: false, error: error.message });
      allValid = false;
    }
  }

  res.json({
    success: true,
    data: {
      verified: allValid,
      verifications,
      verifiedAt: new Date().toISOString(),
    },
  });
}));

export default router;
