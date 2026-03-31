import { query } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import verificationService from './verificationService.js';
import dppService from './dppService.js';

class ComplianceService {
  async getComplianceRequirements(framework = 'EU_DPP_REGULATION_2024') {
    const requirements = {
      'EU_DPP_REGULATION_2024': [
        {
          id: 'DPP-001',
          name: 'Digital Product Passport Required',
          description: 'Product must have an active DPP',
          type: 'dpp_existence',
          severity: 'critical',
        },
        {
          id: 'DPP-002',
          name: 'Material Passport Credential',
          description: 'All materials must have MaterialPassportCredential',
          type: 'credential',
          credentialType: 'MaterialPassportCredential',
          severity: 'critical',
        },
        {
          id: 'DPP-003',
          name: 'Environmental Credential',
          description: 'Product must have ProductEnvironmentalCredential',
          type: 'credential',
          credentialType: 'ProductEnvironmentalCredential',
          severity: 'high',
        },
        {
          id: 'DPP-004',
          name: 'Product Certificate',
          description: 'Product must have valid ProductCertificate',
          type: 'credential',
          credentialType: 'ProductCertificate',
          severity: 'high',
        },
        {
          id: 'DPP-005',
          name: 'LCA Assessment',
          description: 'Life Cycle Assessment must be completed',
          type: 'lca',
          severity: 'medium',
        },
        {
          id: 'DPP-006',
          name: 'Test Report',
          description: 'Product must have passed required tests',
          type: 'credential',
          credentialType: 'TestReportCredential',
          severity: 'medium',
        },
      ],
    };

    return requirements[framework] || requirements['EU_DPP_REGULATION_2024'];
  }

  async performComplianceCheck(organizationId, framework, assetIds = []) {
    const requirements = await this.getComplianceRequirements(framework);
    const results = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const req of requirements) {
      const severityWeight = {
        critical: 30,
        high: 25,
        medium: 25,
        low: 20,
      };

      maxScore += severityWeight[req.severity] || 20;

      try {
        let compliant = false;
        let details = {};

        switch (req.type) {
          case 'dpp_existence':
            const dpps = await dppService.listDPPs(organizationId, { status: 'active' });
            compliant = dpps.total > 0;
            details = { dppCount: dpps.total };
            break;

          case 'credential':
            const credResult = await query(
              `SELECT COUNT(*) as count FROM credentials 
               WHERE organization_id = $1 AND type = $2 AND status = 'issued'`,
              [organizationId, req.credentialType]
            );
            compliant = parseInt(credResult.rows[0].count) > 0;
            details = { credentialCount: parseInt(credResult.rows[0].count) };
            break;

          case 'lca':
            const lcaResult = await query(
              `SELECT COUNT(*) as count FROM lca_assessments 
               WHERE organization_id = $1 AND valid_until > NOW()`,
              [organizationId]
            );
            compliant = parseInt(lcaResult.rows[0].count) > 0;
            details = { lcaCount: parseInt(lcaResult.rows[0].count) };
            break;

          default:
            compliant = true;
        }

        if (compliant) {
          totalScore += severityWeight[req.severity] || 20;
        }

        results.push({
          requirementId: req.id,
          requirementName: req.name,
          compliant,
          severity: req.severity,
          details,
          checkedAt: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          requirementId: req.id,
          requirementName: req.name,
          compliant: false,
          severity: req.severity,
          error: error.message,
          checkedAt: new Date().toISOString(),
        });
      }
    }

    const compliancePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const overallCompliant = compliancePercentage >= 70;

    await query(
      `INSERT INTO compliance_status (organization_id, compliance_framework, status, last_checked, details)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (organization_id) DO UPDATE SET 
         status = $3, last_checked = NOW(), details = $4`,
      [
        organizationId,
        framework,
        overallCompliant ? 'compliant' : 'non_compliant',
        JSON.stringify({ score: compliancePercentage, results }),
      ]
    );

    return {
      organizationId,
      framework,
      overallCompliant,
      complianceScore: compliancePercentage,
      requirementsChecked: results.length,
      compliantRequirements: results.filter(r => r.compliant).length,
      results,
      checkedAt: new Date().toISOString(),
    };
  }

  async collectProofs(organizationId, requiredCredentialTypes, targetOrganizationIds = []) {
    const presentations = [];
    const targets = targetOrganizationIds.length > 0 ? targetOrganizationIds : [organizationId];

    for (const targetOrgId of targets) {
      for (const credType of requiredCredentialTypes) {
        const creds = await query(
          `SELECT id, credential_id, type, status, issued_at, expires_at 
           FROM credentials 
           WHERE organization_id = $1 AND type = $2 AND status = 'issued'`,
          [targetOrgId, credType]
        );

        for (const cred of creds.rows) {
          presentations.push({
            organizationId: targetOrgId,
            credentialId: cred.id,
            credentialType: credType,
            issuedAt: cred.issued_at,
            expiresAt: cred.expires_at,
          });
        }
      }
    }

    return {
      collectionId: uuidv4(),
      organizationId,
      requiredTypes: requiredCredentialTypes,
      presentations,
      collectedAt: new Date().toISOString(),
    };
  }

  async getComplianceHistory(organizationId, daysBack = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const result = await query(
      `SELECT * FROM compliance_status 
       WHERE organization_id = $1 AND last_checked >= $2
       ORDER BY last_checked DESC`,
      [organizationId, startDate]
    );

    return result.rows;
  }

  async getPortfolioCompliance(assetIds, framework) {
    const results = [];

    for (const assetId of assetIds) {
      const asset = await query(
        'SELECT organization_id FROM assets WHERE id = $1 OR asset_id = $1',
        [assetId]
      );

      if (asset.rows.length > 0) {
        const compliance = await this.performComplianceCheck(
          asset.rows[0].organization_id,
          framework,
          [assetId]
        );

        results.push({
          assetId,
          compliance,
        });
      }
    }

    const overallScore = results.reduce((sum, r) => sum + r.compliance.complianceScore, 0) / results.length;

    return {
      framework,
      totalAssets: assetIds.length,
      compliantAssets: results.filter(r => r.compliance.overallCompliant).length,
      overallComplianceScore: overallScore,
      assetResults: results,
      checkedAt: new Date().toISOString(),
    };
  }
}

export default new ComplianceService();
