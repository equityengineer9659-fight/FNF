/**
 * Phase 2 Security Configuration
 * Centralized security settings and thresholds
 */

module.exports = {
  // Security thresholds
  vulnerabilities: {
    maxCritical: parseInt(process.env.MAX_CRITICAL_VULNERABILITIES || '0'),
    maxHigh: parseInt(process.env.MAX_HIGH_VULNERABILITIES || '2'),
    maxModerate: 10,
    maxLow: 20
  },

  // Accessibility compliance
  accessibility: {
    standard: process.env.ACCESSIBILITY_COMPLIANCE_LEVEL || 'AA',
    minPassRate: 90,
    timeout: 30000
  },

  // Content Security Policy
  csp: {
    enforcementLevel: process.env.CSP_ENFORCEMENT_LEVEL || 'strict',
    allowInlineStyles: false,
    allowInlineScripts: false,
    allowEval: false
  },

  // Dependency audit configuration
  dependencies: {
    auditLevel: process.env.DEPENDENCY_AUDIT_LEVEL || 'moderate',
    excludeDevDependencies: false,
    timeout: parseInt(process.env.SECURITY_SCAN_TIMEOUT || '300') * 1000
  },

  // Security headers configuration
  securityHeaders: {
    required: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ],
    recommended: [
      'Strict-Transport-Security',
      'Permissions-Policy',
      'X-XSS-Protection'
    ]
  },

  // File scanning configuration
  scanning: {
    maxFilesToScan: 50,
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.min.js',
      '*.min.css'
    ],
    sensitivePatterns: [
      /password/gi,
      /token/gi,
      /api[_-]?key/gi,
      /secret/gi,
      /auth[_-]?token/gi,
      /bearer\s+[a-zA-Z0-9]/gi
    ]
  },

  // Validation levels and their requirements
  validationLevels: {
    1: {
      description: 'Basic security validation',
      required: ['dependency-audit', 'basic-vulnerability-scan']
    },
    2: {
      description: 'Enhanced security validation', 
      required: ['dependency-audit', 'vulnerability-scan', 'slds-compliance', 'csp-validation']
    },
    3: {
      description: 'Comprehensive security validation',
      required: ['dependency-audit', 'vulnerability-scan', 'slds-compliance', 'csp-validation', 'accessibility-compliance', 'advanced-scanning']
    },
    4: {
      description: 'Full security validation with compliance',
      required: ['dependency-audit', 'vulnerability-scan', 'slds-compliance', 'csp-validation', 'accessibility-compliance', 'advanced-scanning', 'security-headers', 'comprehensive-compliance']
    }
  },

  // Agent assignments for security issues
  agentAssignments: {
    'critical-vulnerability': ['security-compliance-auditor', 'technical-architect'],
    'high-vulnerability': ['security-compliance-auditor'],
    'accessibility-violation': ['security-compliance-auditor', 'html-expert-slds'],
    'csp-violation': ['security-compliance-auditor', 'javascript-behavior-expert'],
    'slds-security-issue': ['security-compliance-auditor', 'css-design-systems-expert'],
    'dependency-vulnerability': ['security-compliance-auditor', 'technical-architect']
  },

  // Reporting configuration
  reporting: {
    outputDir: 'security-reports',
    includeDetails: true,
    generateSummary: true,
    retentionDays: 90
  }
};
