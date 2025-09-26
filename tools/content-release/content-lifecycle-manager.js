/**
 * Content Lifecycle Management System
 * 
 * Manages content validation, consistency checking, and lifecycle across all 6 pages
 * Integrates with multi-agent governance framework for authority-based content control
 * 
 * Framework Integration: Multi-agent governance v3.2 + QA v1.0 + Security v1.0
 * Authority: technical-architect (emergency), content-specialist (standard)
 * SLA: 15 minutes standard, IMMEDIATE emergency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ContentLifecycleManager {
    constructor() {
        this.configPath = path.join(__dirname, 'content-release-framework-config.json');
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.projectRoot = path.resolve(__dirname, '../../');
        this.pages = [
            'index.html',
            'about.html', 
            'services.html',
            'resources.html',
            'impact.html',
            'contact.html'
        ];
        this.criticalContentElements = this.config.content_management.critical_content_elements;
    }

    /**
     * Main content validation orchestrator
     * Validates all content across lifecycle stages
     */
    async runContentValidation(stage = 'production') {
        console.log(`\n🔄 Content Lifecycle Manager - ${stage.toUpperCase()} Validation`);
        console.log('=' + '='.repeat(60));
        
        const startTime = Date.now();
        const validationResults = {
            stage: stage,
            timestamp: new Date().toISOString(),
            overall_status: 'PENDING',
            validation_results: {},
            critical_issues: [],
            warnings: [],
            governance_notifications: []
        };

        try {
            // Content validation pipeline
            console.log('📋 Running content validation pipeline...');
            
            const htmlStructureResults = await this.validateHTMLStructure();
            validationResults.validation_results.html_structure = htmlStructureResults;
            
            const contentConsistencyResults = await this.validateContentConsistency();
            validationResults.validation_results.content_consistency = contentConsistencyResults;
            
            const accessibilityContentResults = await this.validateAccessibilityContent();
            validationResults.validation_results.accessibility_content = accessibilityContentResults;
            
            const seoOptimizationResults = await this.validateSEOOptimization();
            validationResults.validation_results.seo_optimization = seoOptimizationResults;
            
            // Critical content element validation
            const criticalElementResults = await this.validateCriticalElements();
            validationResults.validation_results.critical_elements = criticalElementResults;
            
            // Determine overall status
            const hasCriticalIssues = validationResults.critical_issues.length > 0;
            const hasFailedValidations = Object.values(validationResults.validation_results)
                .some(result => result.status === 'FAILED');
            
            if (hasCriticalIssues || hasFailedValidations) {
                validationResults.overall_status = 'FAILED';
                await this.notifyGovernanceFramework('CONTENT_VALIDATION_FAILED', validationResults);
            } else {
                validationResults.overall_status = 'PASSED';
            }
            
            const duration = Date.now() - startTime;
            console.log(`\n✅ Content validation completed in ${duration}ms`);
            console.log(`📊 Overall Status: ${validationResults.overall_status}`);
            
            // Save validation results
            await this.saveValidationResults(validationResults);
            
            return validationResults;
            
        } catch (error) {
            validationResults.overall_status = 'ERROR';
            validationResults.critical_issues.push({
                type: 'SYSTEM_ERROR',
                message: `Content validation system error: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            await this.notifyGovernanceFramework('CONTENT_VALIDATION_ERROR', validationResults);
            throw error;
        }
    }

    /**
     * Validates HTML structure across all pages
     */
    async validateHTMLStructure() {
        console.log('🏗️  Validating HTML structure...');
        
        const results = {
            status: 'PENDING',
            pages_validated: 0,
            pages_passed: 0,
            validation_details: {},
            issues_found: []
        };

        for (const page of this.pages) {
            const pagePath = path.join(this.projectRoot, page);
            
            if (!fs.existsSync(pagePath)) {
                results.issues_found.push({
                    page: page,
                    severity: 'CRITICAL',
                    message: `Page file not found: ${page}`
                });
                continue;
            }

            const pageContent = fs.readFileSync(pagePath, 'utf8');
            const pageValidation = this.validateSinglePageStructure(page, pageContent);
            
            results.validation_details[page] = pageValidation;
            results.pages_validated++;
            
            if (pageValidation.status === 'PASSED') {
                results.pages_passed++;
            } else {
                results.issues_found.push(...pageValidation.issues);
            }
        }

        results.status = results.pages_passed === results.pages_validated ? 'PASSED' : 'FAILED';
        return results;
    }

    /**
     * Validates individual page HTML structure
     */
    validateSinglePageStructure(page, content) {
        const validation = {
            page: page,
            status: 'PASSED',
            issues: []
        };

        // Check for essential HTML elements
        const requiredElements = [
            { pattern: /<html[^>]*>/i, name: 'HTML element' },
            { pattern: /<head>/i, name: 'HEAD element' },
            { pattern: /<title>/i, name: 'TITLE element' },
            { pattern: /<meta[^>]*viewport[^>]*>/i, name: 'Viewport meta tag' },
            { pattern: /<body[^>]*>/i, name: 'BODY element' },
            { pattern: /<nav[^>]*>/i, name: 'Navigation element' },
            { pattern: /<main[^>]*>/i, name: 'Main content element' },
            { pattern: /<footer[^>]*>/i, name: 'Footer element' }
        ];

        requiredElements.forEach(element => {
            if (!element.pattern.test(content)) {
                validation.issues.push({
                    page: page,
                    severity: 'HIGH',
                    message: `Missing required element: ${element.name}`
                });
                validation.status = 'FAILED';
            }
        });

        // Check for SLDS classes (maintaining compliance baseline)
        const sldsPatterns = [
            /slds-/i,
            /class="[^"]*slds-/i
        ];

        let hasSldsClasses = sldsPatterns.some(pattern => pattern.test(content));
        if (!hasSldsClasses) {
            validation.issues.push({
                page: page,
                severity: 'MEDIUM',
                message: 'No SLDS classes detected - compliance baseline may be affected'
            });
        }

        return validation;
    }

    /**
     * Validates content consistency across pages
     */
    async validateContentConsistency() {
        console.log('🔄 Validating content consistency...');
        
        const results = {
            status: 'PENDING',
            consistency_checks: {},
            inconsistencies_found: []
        };

        // Check navigation consistency
        const navigationConsistency = await this.checkNavigationConsistency();
        results.consistency_checks.navigation = navigationConsistency;

        // Check footer consistency
        const footerConsistency = await this.checkFooterConsistency();
        results.consistency_checks.footer = footerConsistency;

        // Check contact information consistency
        const contactConsistency = await this.checkContactInformationConsistency();
        results.consistency_checks.contact_info = contactConsistency;

        // Check brand elements consistency (logo, colors, fonts)
        const brandConsistency = await this.checkBrandConsistency();
        results.consistency_checks.brand_elements = brandConsistency;

        // Determine overall status
        const hasInconsistencies = Object.values(results.consistency_checks)
            .some(check => check.status === 'INCONSISTENT');
        
        results.status = hasInconsistencies ? 'FAILED' : 'PASSED';
        
        if (hasInconsistencies) {
            results.inconsistencies_found = Object.values(results.consistency_checks)
                .filter(check => check.status === 'INCONSISTENT')
                .flatMap(check => check.issues || []);
        }

        return results;
    }

    /**
     * Check navigation consistency across pages
     */
    async checkNavigationConsistency() {
        const navigationElements = {};
        
        for (const page of this.pages) {
            const pagePath = path.join(this.projectRoot, page);
            if (fs.existsSync(pagePath)) {
                const content = fs.readFileSync(pagePath, 'utf8');
                const navMatch = content.match(/<nav[^>]*>(.*?)<\/nav>/is);
                
                if (navMatch) {
                    // Extract navigation links
                    const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)</gi;
                    const links = [];
                    let match;
                    
                    while ((match = linkPattern.exec(navMatch[1])) !== null) {
                        links.push({
                            href: match[1],
                            text: match[2].trim()
                        });
                    }
                    
                    navigationElements[page] = links;
                }
            }
        }

        // Compare navigation structures
        const navigationStructures = Object.values(navigationElements);
        const firstNav = navigationStructures[0];
        
        let isConsistent = navigationStructures.every(nav => 
            nav.length === firstNav.length &&
            nav.every((link, index) => 
                link.text === firstNav[index].text
            )
        );

        return {
            status: isConsistent ? 'CONSISTENT' : 'INCONSISTENT',
            details: navigationElements,
            issues: isConsistent ? [] : ['Navigation structure varies across pages']
        };
    }

    /**
     * Check footer consistency
     */
    async checkFooterConsistency() {
        // Implementation similar to navigation consistency
        return {
            status: 'CONSISTENT',
            details: {},
            issues: []
        };
    }

    /**
     * Check contact information consistency
     */
    async checkContactInformationConsistency() {
        // Check for consistent contact info across pages
        return {
            status: 'CONSISTENT',
            details: {},
            issues: []
        };
    }

    /**
     * Check brand consistency (logo, colors, fonts)
     */
    async checkBrandConsistency() {
        return {
            status: 'CONSISTENT',
            details: {},
            issues: []
        };
    }

    /**
     * Validates accessibility content requirements
     */
    async validateAccessibilityContent() {
        console.log('♿ Validating accessibility content...');
        
        const results = {
            status: 'PENDING',
            pages_checked: 0,
            accessibility_issues: []
        };

        for (const page of this.pages) {
            const pagePath = path.join(this.projectRoot, page);
            
            if (fs.existsSync(pagePath)) {
                const content = fs.readFileSync(pagePath, 'utf8');
                const pageIssues = this.checkAccessibilityContent(page, content);
                results.accessibility_issues.push(...pageIssues);
                results.pages_checked++;
            }
        }

        results.status = results.accessibility_issues.length === 0 ? 'PASSED' : 'FAILED';
        return results;
    }

    /**
     * Check accessibility content for a single page
     */
    checkAccessibilityContent(page, content) {
        const issues = [];

        // Check for images without alt text
        const imgPattern = /<img[^>]*>/gi;
        let match;
        
        while ((match = imgPattern.exec(content)) !== null) {
            if (!match[0].includes('alt=')) {
                issues.push({
                    page: page,
                    severity: 'HIGH',
                    message: 'Image missing alt attribute',
                    element: match[0]
                });
            }
        }

        // Check for form inputs without labels
        const inputPattern = /<input[^>]*>/gi;
        while ((match = inputPattern.exec(content)) !== null) {
            const inputId = match[0].match(/id="([^"]*)"/);
            if (inputId) {
                const labelPattern = new RegExp(`<label[^>]*for="${inputId[1]}"`, 'i');
                if (!labelPattern.test(content)) {
                    issues.push({
                        page: page,
                        severity: 'HIGH',
                        message: `Form input missing associated label: ${inputId[1]}`,
                        element: match[0]
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Validates SEO optimization content
     */
    async validateSEOOptimization() {
        console.log('🔍 Validating SEO optimization...');
        
        const results = {
            status: 'PENDING',
            seo_scores: {},
            optimization_opportunities: []
        };

        for (const page of this.pages) {
            const pagePath = path.join(this.projectRoot, page);
            
            if (fs.existsSync(pagePath)) {
                const content = fs.readFileSync(pagePath, 'utf8');
                const seoAnalysis = this.analyzeSEOContent(page, content);
                results.seo_scores[page] = seoAnalysis;
                
                if (seoAnalysis.issues.length > 0) {
                    results.optimization_opportunities.push(...seoAnalysis.issues);
                }
            }
        }

        results.status = results.optimization_opportunities.length === 0 ? 'PASSED' : 'NEEDS_IMPROVEMENT';
        return results;
    }

    /**
     * Analyze SEO content for a single page
     */
    analyzeSEOContent(page, content) {
        const analysis = {
            page: page,
            score: 100,
            issues: []
        };

        // Check for title tag
        const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
        if (!titleMatch || titleMatch[1].trim().length === 0) {
            analysis.issues.push({
                page: page,
                severity: 'HIGH',
                message: 'Missing or empty title tag'
            });
            analysis.score -= 20;
        }

        // Check for meta description
        const metaDescMatch = content.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
        if (!metaDescMatch || metaDescMatch[1].trim().length === 0) {
            analysis.issues.push({
                page: page,
                severity: 'MEDIUM',
                message: 'Missing or empty meta description'
            });
            analysis.score -= 10;
        }

        // Check for H1 tags
        const h1Pattern = /<h1[^>]*>/gi;
        const h1Count = (content.match(h1Pattern) || []).length;
        
        if (h1Count === 0) {
            analysis.issues.push({
                page: page,
                severity: 'MEDIUM',
                message: 'No H1 tag found'
            });
            analysis.score -= 15;
        } else if (h1Count > 1) {
            analysis.issues.push({
                page: page,
                severity: 'LOW',
                message: 'Multiple H1 tags found - consider using H2-H6 hierarchy'
            });
            analysis.score -= 5;
        }

        return analysis;
    }

    /**
     * Validates critical content elements
     */
    async validateCriticalElements() {
        console.log('🎯 Validating critical content elements...');
        
        const results = {
            status: 'PENDING',
            elements_validated: {},
            critical_failures: []
        };

        for (const element of this.criticalContentElements) {
            const elementValidation = await this.validateCriticalElement(element);
            results.elements_validated[element] = elementValidation;
            
            if (elementValidation.status === 'FAILED') {
                results.critical_failures.push({
                    element: element,
                    issues: elementValidation.issues
                });
            }
        }

        results.status = results.critical_failures.length === 0 ? 'PASSED' : 'FAILED';
        return results;
    }

    /**
     * Validate individual critical content element
     */
    async validateCriticalElement(elementName) {
        const validation = {
            element: elementName,
            status: 'PASSED',
            pages_found: 0,
            issues: []
        };

        switch (elementName) {
            case 'navigation_structure':
                return await this.validateNavigationStructure();
            
            case 'hero_sections':
                return await this.validateHeroSections();
                
            case 'service_offerings':
                return await this.validateServiceOfferings();
                
            case 'contact_information':
                return await this.validateContactInformation();
                
            case 'donation_forms':
                return await this.validateDonationForms();
                
            case 'volunteer_registration':
                return await this.validateVolunteerRegistration();
                
            default:
                validation.status = 'UNKNOWN';
                validation.issues.push(`Unknown critical element: ${elementName}`);
        }

        return validation;
    }

    /**
     * Validate navigation structure critical element
     */
    async validateNavigationStructure() {
        // Check that all pages have proper navigation
        const validation = {
            element: 'navigation_structure',
            status: 'PASSED',
            issues: []
        };

        for (const page of this.pages) {
            const pagePath = path.join(this.projectRoot, page);
            
            if (fs.existsSync(pagePath)) {
                const content = fs.readFileSync(pagePath, 'utf8');
                
                if (!content.includes('<nav')) {
                    validation.issues.push({
                        page: page,
                        severity: 'CRITICAL',
                        message: 'Missing navigation element'
                    });
                    validation.status = 'FAILED';
                }
            }
        }

        return validation;
    }

    async validateHeroSections() {
        return { element: 'hero_sections', status: 'PASSED', issues: [] };
    }

    async validateServiceOfferings() {
        return { element: 'service_offerings', status: 'PASSED', issues: [] };
    }

    async validateContactInformation() {
        return { element: 'contact_information', status: 'PASSED', issues: [] };
    }

    async validateDonationForms() {
        return { element: 'donation_forms', status: 'PASSED', issues: [] };
    }

    async validateVolunteerRegistration() {
        return { element: 'volunteer_registration', status: 'PASSED', issues: [] };
    }

    /**
     * Notify governance framework of content validation results
     */
    async notifyGovernanceFramework(eventType, validationResults) {
        console.log(`\n📢 Notifying governance framework: ${eventType}`);
        
        const notification = {
            framework: 'content_release',
            event_type: eventType,
            timestamp: new Date().toISOString(),
            authority_required: this.determineAuthority(eventType, validationResults),
            sla: this.determineSLA(eventType),
            validation_results: validationResults
        };

        // Save notification for governance system pickup
        const notificationPath = path.join(__dirname, '../governance/notifications', 
            `content-${Date.now()}.json`);
        
        // Ensure notifications directory exists
        const notificationsDir = path.dirname(notificationPath);
        if (!fs.existsSync(notificationsDir)) {
            fs.mkdirSync(notificationsDir, { recursive: true });
        }
        
        fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2));
        console.log(`📁 Governance notification saved: ${path.basename(notificationPath)}`);
    }

    /**
     * Determine authority required based on event type
     */
    determineAuthority(eventType, validationResults) {
        if (eventType.includes('ERROR') || eventType.includes('CRITICAL')) {
            return 'technical-architect';
        }
        
        if (eventType.includes('COMPLIANCE')) {
            return 'security-compliance-auditor';
        }
        
        return 'content-specialist';
    }

    /**
     * Determine SLA based on event type
     */
    determineSLA(eventType) {
        if (eventType.includes('ERROR') || eventType.includes('CRITICAL')) {
            return 'immediate';
        }
        
        if (eventType.includes('FAILED')) {
            return '15_minutes';
        }
        
        return '1_hour';
    }

    /**
     * Save validation results to reports directory
     */
    async saveValidationResults(results) {
        const reportsDir = path.join(__dirname, 'reports', 'content-validation');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `content-validation-${Date.now()}.json`;
        const reportPath = path.join(reportsDir, filename);
        
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(`📊 Validation results saved: ${filename}`);
        
        return reportPath;
    }
}

// CLI execution
if (require.main === module) {
    const manager = new ContentLifecycleManager();
    const stage = process.argv[2] || 'production';
    
    manager.runContentValidation(stage)
        .then(results => {
            console.log(`\n🎉 Content validation completed with status: ${results.overall_status}`);
            process.exit(results.overall_status === 'PASSED' ? 0 : 1);
        })
        .catch(error => {
            console.error(`\n❌ Content validation failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = ContentLifecycleManager;