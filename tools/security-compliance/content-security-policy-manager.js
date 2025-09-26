#!/usr/bin/env node

/**
 * Content Security Policy Management System
 * Security & Compliance Framework v1.0
 * 
 * CSP implementation with governance framework integration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ContentSecurityPolicyManager {
  constructor() {
    this.config = null;
    this.cspViolations = [];
    this.reportingActive = false;
    this.currentPolicy = null;
  }

  async initialize() {
    try {
      const configPath = path.join(__dirname, 'security-framework-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      console.log('🔒 Content Security Policy Manager initialized');
      console.log('🚨 Emergency Response Integration: ACTIVE');
      console.log(`📋 Enforcement Mode: ${this.config.security_monitoring.content_security_policy.enforcement_mode}`);
    } catch (error) {
      throw new Error(`Failed to initialize CSP Manager: ${error.message}`);
    }
  }

  async generateCSPPolicy() {
    console.log('📝 Generating Content Security Policy...');
    
    const cspConfig = this.config.security_monitoring.content_security_policy;
    const directives = cspConfig.directives;
    
    // Build CSP header string
    const policyParts = [];
    
    for (const [directive, sources] of Object.entries(directives)) {
      const sourceList = Array.isArray(sources) ? sources.join(' ') : sources;
      policyParts.push(`${directive} ${sourceList}`);
    }
    
    // Add reporting directive if enabled
    if (cspConfig.violation_reporting.enabled) {
      policyParts.push(`report-uri ${cspConfig.violation_reporting.endpoint}`);
    }
    
    this.currentPolicy = policyParts.join('; ');
    
    console.log('📋 Generated CSP Policy:');
    console.log(`   ${this.currentPolicy}`);
    
    return this.currentPolicy;
  }

  async analyzeCurrentCSPCompliance() {
    console.log('🔍 Analyzing current CSP compliance...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      inline_scripts: await this.detectInlineScripts(),
      inline_styles: await this.detectInlineStyles(),
      external_resources: await this.detectExternalResources(),
      eval_usage: await this.detectEvalUsage(),
      violations: [],
      compliance_score: 0,
      recommendations: []
    };

    // Calculate compliance score
    let violations = 0;
    
    if (analysis.inline_scripts.detected && !this.config.security_monitoring.content_security_policy.directives['script-src'].includes("'unsafe-inline'")) {
      violations++;
      analysis.violations.push({
        type: 'inline_scripts',
        severity: 'high',
        description: 'Inline scripts detected without unsafe-inline directive',
        count: analysis.inline_scripts.count
      });
      analysis.recommendations.push('Consider moving inline scripts to external files or add nonce/hash-based CSP');
    }

    if (analysis.inline_styles.detected && !this.config.security_monitoring.content_security_policy.directives['style-src'].includes("'unsafe-inline'")) {
      violations++;
      analysis.violations.push({
        type: 'inline_styles',
        severity: 'medium',
        description: 'Inline styles detected without unsafe-inline directive',
        count: analysis.inline_styles.count
      });
      analysis.recommendations.push('Consider using external stylesheets or CSS-in-JS with nonce/hash');
    }

    if (analysis.eval_usage.detected) {
      violations++;
      analysis.violations.push({
        type: 'eval_usage',
        severity: 'critical',
        description: 'eval() or similar dynamic code execution detected',
        locations: analysis.eval_usage.locations
      });
      analysis.recommendations.push('Remove eval() usage and replace with safer alternatives');
    }

    // Calculate compliance score (0-100)
    const totalChecks = 4; // inline scripts, inline styles, eval usage, external resources
    analysis.compliance_score = Math.max(0, Math.round(((totalChecks - violations) / totalChecks) * 100));

    console.log(`🔍 CSP Compliance Analysis: ${analysis.compliance_score}% compliant`);
    console.log(`⚠️  Violations found: ${violations}`);

    return analysis;
  }

  async detectInlineScripts() {
    try {
      const htmlFiles = await this.getHTMLFiles();
      let inlineScriptCount = 0;
      const locations = [];

      for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf8');
        const scriptMatches = content.match(/<script(?![^>]*src=)[^>]*>/gi);
        
        if (scriptMatches) {
          inlineScriptCount += scriptMatches.length;
          locations.push({
            file: path.basename(file),
            count: scriptMatches.length
          });
        }
      }

      return {
        detected: inlineScriptCount > 0,
        count: inlineScriptCount,
        locations
      };
    } catch (error) {
      return {
        detected: false,
        count: 0,
        error: error.message
      };
    }
  }

  async detectInlineStyles() {
    try {
      const htmlFiles = await this.getHTMLFiles();
      let inlineStyleCount = 0;
      const locations = [];

      for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for <style> tags
        const styleTagMatches = content.match(/<style[^>]*>/gi);
        // Check for style attributes
        const styleAttrMatches = content.match(/style\s*=\s*["'][^"']*["']/gi);
        
        const fileCount = (styleTagMatches?.length || 0) + (styleAttrMatches?.length || 0);
        
        if (fileCount > 0) {
          inlineStyleCount += fileCount;
          locations.push({
            file: path.basename(file),
            style_tags: styleTagMatches?.length || 0,
            style_attributes: styleAttrMatches?.length || 0,
            total: fileCount
          });
        }
      }

      return {
        detected: inlineStyleCount > 0,
        count: inlineStyleCount,
        locations
      };
    } catch (error) {
      return {
        detected: false,
        count: 0,
        error: error.message
      };
    }
  }

  async detectExternalResources() {
    try {
      const htmlFiles = await this.getHTMLFiles();
      const externalResources = {
        scripts: new Set(),
        styles: new Set(),
        images: new Set(),
        fonts: new Set()
      };

      for (const file of htmlFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // External scripts
        const scriptSrcs = content.match(/src\s*=\s*["']https?:\/\/[^"']*["']/gi);
        if (scriptSrcs) {
          scriptSrcs.forEach(src => {
            const url = src.match(/https?:\/\/[^"']*/)[0];
            externalResources.scripts.add(url);
          });
        }

        // External stylesheets
        const linkHrefs = content.match(/<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']https?:\/\/[^"']*["']/gi);
        if (linkHrefs) {
          linkHrefs.forEach(link => {
            const url = link.match(/https?:\/\/[^"']*/)[0];
            externalResources.styles.add(url);
          });
        }

        // External images
        const imgSrcs = content.match(/<img[^>]*src\s*=\s*["']https?:\/\/[^"']*["']/gi);
        if (imgSrcs) {
          imgSrcs.forEach(img => {
            const url = img.match(/https?:\/\/[^"']*/)[0];
            externalResources.images.add(url);
          });
        }
      }

      return {
        scripts: Array.from(externalResources.scripts),
        styles: Array.from(externalResources.styles),
        images: Array.from(externalResources.images),
        fonts: Array.from(externalResources.fonts),
        total_external: externalResources.scripts.size + externalResources.styles.size + 
                      externalResources.images.size + externalResources.fonts.size
      };
    } catch (error) {
      return {
        scripts: [],
        styles: [],
        images: [],
        fonts: [],
        total_external: 0,
        error: error.message
      };
    }
  }

  async detectEvalUsage() {
    try {
      const jsFiles = await this.getJSFiles();
      const evalLocations = [];
      let evalDetected = false;

      for (const file of jsFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Check for various eval patterns
        const evalPatterns = [
          /\beval\s*\(/g,
          /new\s+Function\s*\(/g,
          /setTimeout\s*\(\s*["'][^"']*["']/g,
          /setInterval\s*\(\s*["'][^"']*["']/g
        ];

        for (const pattern of evalPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            evalDetected = true;
            evalLocations.push({
              file: path.basename(file),
              pattern: pattern.source,
              count: matches.length,
              matches: matches.slice(0, 5) // Limit to first 5 matches
            });
          }
        }
      }

      return {
        detected: evalDetected,
        locations: evalLocations,
        total_violations: evalLocations.reduce((sum, loc) => sum + loc.count, 0)
      };
    } catch (error) {
      return {
        detected: false,
        locations: [],
        error: error.message
      };
    }
  }

  async generateCSPHeader() {
    const policy = await this.generateCSPPolicy();
    const enforcementMode = this.config.security_monitoring.content_security_policy.enforcement_mode;
    
    let headerName;
    if (enforcementMode === 'report-only') {
      headerName = 'Content-Security-Policy-Report-Only';
    } else {
      headerName = 'Content-Security-Policy';
    }

    return {
      header: headerName,
      value: policy,
      enforcement_mode: enforcementMode
    };
  }

  async implementCSPForDeployment() {
    console.log('🚀 Implementing CSP for deployment...');
    
    const cspHeader = await this.generateCSPHeader();
    const analysis = await this.analyzeCurrentCSPCompliance();
    
    const implementation = {
      timestamp: new Date().toISOString(),
      csp_header: cspHeader,
      compliance_analysis: analysis,
      deployment_ready: analysis.compliance_score >= 80,
      implementation_steps: []
    };

    // Generate meta tag for HTML files
    const metaTag = `<meta http-equiv="${cspHeader.header}" content="${cspHeader.value}">`;
    
    // Add CSP meta tag to HTML files
    const htmlFiles = await this.getHTMLFiles();
    for (const file of htmlFiles) {
      try {
        await this.addCSPMetaTagToFile(file, metaTag);
        implementation.implementation_steps.push({
          action: 'csp_meta_tag_added',
          file: path.basename(file),
          status: 'success'
        });
      } catch (error) {
        implementation.implementation_steps.push({
          action: 'csp_meta_tag_failed',
          file: path.basename(file),
          status: 'error',
          error: error.message
        });
      }
    }

    // Generate server configuration recommendations
    implementation.server_config = this.generateServerConfigRecommendations(cspHeader);
    
    console.log(`🔒 CSP Implementation: ${implementation.deployment_ready ? 'READY' : 'NEEDS WORK'}`);
    console.log(`📊 Compliance Score: ${analysis.compliance_score}%`);

    if (!implementation.deployment_ready) {
      console.log('⚠️  Compliance issues need to be addressed before deployment');
      analysis.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    return implementation;
  }

  async addCSPMetaTagToFile(filePath, metaTag) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Check if CSP meta tag already exists
    if (content.includes('Content-Security-Policy')) {
      console.log(`   CSP already exists in ${path.basename(filePath)}, skipping`);
      return;
    }

    // Insert CSP meta tag in <head> section
    const headRegex = /(<head[^>]*>)/i;
    const updatedContent = content.replace(headRegex, `$1\n    ${metaTag}`);
    
    if (updatedContent !== content) {
      await fs.writeFile(filePath, updatedContent, 'utf8');
      console.log(`   ✅ Added CSP meta tag to ${path.basename(filePath)}`);
    }
  }

  generateServerConfigRecommendations(cspHeader) {
    return {
      nginx: {
        directive: `add_header ${cspHeader.header} "${cspHeader.value}" always;`,
        location: 'server block in nginx.conf'
      },
      apache: {
        directive: `Header always set ${cspHeader.header} "${cspHeader.value}"`,
        location: '.htaccess or virtual host configuration'
      },
      netlify: {
        directive: `${cspHeader.header}: ${cspHeader.value}`,
        location: '_headers file in site root'
      },
      cloudflare: {
        note: 'Configure via Page Rules or Workers',
        example: `response.headers.set('${cspHeader.header}', '${cspHeader.value}');`
      }
    };
  }

  async monitorCSPViolations() {
    console.log('👀 Setting up CSP violation monitoring...');
    
    // This would typically integrate with a real violation reporting endpoint
    // For now, we'll simulate monitoring capabilities
    
    const monitoring = {
      enabled: true,
      endpoint: this.config.security_monitoring.content_security_policy.violation_reporting.endpoint,
      max_reports_per_hour: this.config.security_monitoring.content_security_policy.violation_reporting.max_reports_per_hour,
      violation_patterns: [
        'script-src violations',
        'style-src violations',
        'img-src violations',
        'eval violations',
        'inline-script violations'
      ]
    };

    console.log('👀 CSP Violation Monitoring configured');
    console.log(`📊 Report endpoint: ${monitoring.endpoint}`);
    console.log(`🚫 Rate limit: ${monitoring.max_reports_per_hour} reports/hour`);

    return monitoring;
  }

  async generateCSPReport() {
    const report = {
      framework: 'Security & Compliance Framework v1.0',
      component: 'Content Security Policy Manager',
      timestamp: new Date().toISOString(),
      csp_policy: this.currentPolicy,
      compliance_analysis: await this.analyzeCurrentCSPCompliance(),
      implementation_status: await this.getImplementationStatus(),
      governance_integration: {
        emergency_response: this.config.emergency_security_response.enabled,
        authority: 'security-compliance-auditor',
        escalation: 'technical-architect'
      },
      recommendations: await this.generateSecurityRecommendations()
    };

    const reportPath = path.join(__dirname, 'reports', `csp-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 CSP Report generated: ${reportPath}`);
    return report;
  }

  async getImplementationStatus() {
    const htmlFiles = await this.getHTMLFiles();
    let implementedCount = 0;
    
    for (const file of htmlFiles) {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('Content-Security-Policy')) {
        implementedCount++;
      }
    }

    return {
      total_html_files: htmlFiles.length,
      files_with_csp: implementedCount,
      implementation_percentage: htmlFiles.length > 0 ? Math.round((implementedCount / htmlFiles.length) * 100) : 0,
      deployment_ready: implementedCount === htmlFiles.length
    };
  }

  async generateSecurityRecommendations() {
    const analysis = await this.analyzeCurrentCSPCompliance();
    const recommendations = [];

    if (analysis.inline_scripts.detected) {
      recommendations.push({
        priority: 'high',
        category: 'script_security',
        recommendation: 'Move inline scripts to external files or implement nonce-based CSP',
        impact: 'Reduces XSS attack surface'
      });
    }

    if (analysis.eval_usage.detected) {
      recommendations.push({
        priority: 'critical',
        category: 'code_execution',
        recommendation: 'Remove eval() usage and replace with safer alternatives',
        impact: 'Eliminates arbitrary code execution vulnerabilities'
      });
    }

    if (this.config.security_monitoring.content_security_policy.enforcement_mode === 'report-only') {
      recommendations.push({
        priority: 'medium',
        category: 'csp_enforcement',
        recommendation: 'Transition from report-only to enforcing mode after testing',
        impact: 'Activates CSP protection against attacks'
      });
    }

    recommendations.push({
      priority: 'low',
      category: 'monitoring',
      recommendation: 'Set up real-time CSP violation monitoring and alerting',
      impact: 'Early detection of security threats and policy violations'
    });

    return recommendations;
  }

  // Utility methods
  async getHTMLFiles() {
    const files = ['index.html', 'about.html', 'services.html', 'resources.html', 'impact.html', 'contact.html'];
    const existingFiles = [];
    
    for (const file of files) {
      try {
        await fs.access(file);
        existingFiles.push(file);
      } catch (error) {
        // File doesn't exist, skip
      }
    }
    
    return existingFiles;
  }

  async getJSFiles() {
    const jsFiles = [];
    const jsDirectories = ['js/core/', 'js/effects/', 'js/pages/'];
    
    for (const dir of jsDirectories) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.js')) {
            jsFiles.push(path.join(dir, file));
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
    
    return jsFiles;
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const cspManager = new ContentSecurityPolicyManager();
      await cspManager.initialize();
      
      console.log('🔒 Content Security Policy Manager ready');
      console.log('🚀 Use: npm run security:csp-implement');
      console.log('📊 Use: npm run security:csp-analyze');
      console.log('👀 Use: npm run security:csp-monitor');
      
      // Generate initial report
      await cspManager.generateCSPReport();
      
    } catch (error) {
      console.error('❌ CSP Manager initialization failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = ContentSecurityPolicyManager;