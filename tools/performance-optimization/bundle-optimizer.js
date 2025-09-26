/**
 * Bundle Size Optimization and Monitoring System
 * Food-N-Force Performance Optimization Framework v1.0
 * 
 * Automated bundle analysis, optimization, and monitoring
 * Authority: performance-optimizer + technical-architect
 * 
 * Features:
 * - Real-time bundle size monitoring with trend analysis
 * - Automated optimization recommendations
 * - Dead code detection and removal suggestions
 * - CSS and JavaScript optimization strategies
 * - Critical resource prioritization
 * - Performance budget enforcement integration
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

const readFileAsync = promisify(fs.readFile);
const statAsync = promisify(fs.stat);

class BundleOptimizer {
    constructor(configPath = null) {
        // Load configuration
        const defaultConfig = path.join(__dirname, 'performance-framework-config.json');
        const configFile = configPath || defaultConfig;
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Initialize optimization state
        this.currentBundles = {};
        this.optimizationHistory = [];
        this.detectedIssues = [];
        this.optimizationRecommendations = [];
        
        // Bundle analysis configuration
        this.analysisConfig = {
            cssMinSizeThreshold: 1024,     // 1KB minimum for analysis
            jsMinSizeThreshold: 2048,      // 2KB minimum for analysis
            duplicateThreshold: 0.8,       // 80% similarity threshold
            unusedCodeThreshold: 0.1,      // 10% unused code threshold
            compressionAnalysis: true,      // Analyze gzip/brotli potential
            criticalPathAnalysis: true      // Analyze critical resource paths
        };
        
        // Optimization strategies
        this.optimizationStrategies = {
            css: {
                removeUnusedRules: true,
                mergeDuplicateRules: true,
                optimizeSelectors: true,
                inlineCriticalCSS: true,
                compressWhitespace: true
            },
            javascript: {
                removeUnusedCode: true,
                treeShaking: true,
                codeSplitting: true,
                minification: true,
                compressionOptimization: true
            },
            resources: {
                imageLazyLoading: true,
                fontOptimization: true,
                preloadCriticalResources: true,
                eliminateRenderBlocking: true
            }
        };
        
        // Budget thresholds from config
        this.budgetThresholds = this.config.performance_budgets.resource_budgets;
        
        console.log('📦 Bundle Optimizer initialized');
        console.log(`   CSS Budget: ${Math.round(this.budgetThresholds.css_bundle_size / 1024)}KB`);
        console.log(`   JS Budget: ${Math.round(this.budgetThresholds.javascript_bundle_size / 1024)}KB`);
    }
    
    /**
     * Analyze current bundle sizes and composition
     */
    async analyzeBundles() {
        console.log('📊 Analyzing current bundles...');
        
        const bundleAnalysis = {
            timestamp: new Date().toISOString(),
            css: await this.analyzeCSSBundles(),
            javascript: await this.analyzeJavaScriptBundles(),
            images: await this.analyzeImageAssets(),
            fonts: await this.analyzeFontAssets(),
            total: { size: 0, files: 0, compressionPotential: 0 }
        };
        
        // Calculate totals
        bundleAnalysis.total.size = 
            bundleAnalysis.css.totalSize + 
            bundleAnalysis.javascript.totalSize + 
            bundleAnalysis.images.totalSize + 
            bundleAnalysis.fonts.totalSize;
        
        bundleAnalysis.total.files = 
            bundleAnalysis.css.files.length + 
            bundleAnalysis.javascript.files.length + 
            bundleAnalysis.images.files.length + 
            bundleAnalysis.fonts.files.length;
        
        bundleAnalysis.total.compressionPotential = 
            bundleAnalysis.css.compressionPotential + 
            bundleAnalysis.javascript.compressionPotential;
        
        // Budget compliance check
        bundleAnalysis.budgetCompliance = this.checkBudgetCompliance(bundleAnalysis);
        
        // Store analysis
        this.currentBundles = bundleAnalysis;
        
        // Generate recommendations
        this.optimizationRecommendations = await this.generateOptimizationRecommendations(bundleAnalysis);
        
        console.log(`📊 Bundle analysis complete:`);
        console.log(`   Total Size: ${Math.round(bundleAnalysis.total.size / 1024)}KB`);
        console.log(`   Files: ${bundleAnalysis.total.files}`);
        console.log(`   Compression Potential: ${Math.round(bundleAnalysis.total.compressionPotential / 1024)}KB`);
        
        return bundleAnalysis;
    }
    
    /**
     * Analyze CSS bundle composition and optimization opportunities
     */
    async analyzeCSSBundles() {
        const cssFiles = await this.findFiles('css/**/*.css');
        const cssAnalysis = {
            files: [],
            totalSize: 0,
            duplicateRules: [],
            unusedRules: [],
            compressionPotential: 0,
            criticalCSS: { identified: false, size: 0 }
        };
        
        for (const filePath of cssFiles) {
            try {
                const stats = await statAsync(filePath);
                const content = await readFileAsync(filePath, 'utf8');
                
                const fileAnalysis = {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    rules: this.extractCSSRules(content),
                    selectors: this.extractCSSSelectors(content),
                    properties: this.extractCSSProperties(content),
                    mediaQueries: this.extractMediaQueries(content),
                    compressionRatio: this.estimateCompressionRatio(content),
                    lastModified: stats.mtime.toISOString()
                };
                
                fileAnalysis.estimatedCompressedSize = Math.round(fileAnalysis.size * fileAnalysis.compressionRatio);
                fileAnalysis.compressionSavings = fileAnalysis.size - fileAnalysis.estimatedCompressedSize;
                
                cssAnalysis.files.push(fileAnalysis);
                cssAnalysis.totalSize += stats.size;
                cssAnalysis.compressionPotential += fileAnalysis.compressionSavings;
                
                // Detect duplicates across files
                cssAnalysis.duplicateRules.push(...this.detectDuplicateRules(fileAnalysis, cssAnalysis.files));
                
            } catch (error) {
                console.warn(`⚠️  Could not analyze CSS file ${filePath}: ${error.message}`);
            }
        }
        
        // Analyze critical CSS potential
        cssAnalysis.criticalCSS = await this.analyzeCriticalCSSPotential(cssAnalysis.files);
        
        return cssAnalysis;
    }
    
    /**
     * Analyze JavaScript bundle composition
     */
    async analyzeJavaScriptBundles() {
        const jsFiles = await this.findFiles('js/**/*.js');
        const jsAnalysis = {
            files: [],
            totalSize: 0,
            duplicateFunctions: [],
            unusedCode: [],
            compressionPotential: 0,
            codeSplittingOpportunities: []
        };
        
        for (const filePath of jsFiles) {
            try {
                const stats = await statAsync(filePath);
                const content = await readFileAsync(filePath, 'utf8');
                
                const fileAnalysis = {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    functions: this.extractJavaScriptFunctions(content),
                    imports: this.extractJavaScriptImports(content),
                    exports: this.extractJavaScriptExports(content),
                    dependencies: this.analyzeDependencies(content),
                    compressionRatio: this.estimateCompressionRatio(content),
                    lastModified: stats.mtime.toISOString()
                };
                
                fileAnalysis.estimatedCompressedSize = Math.round(fileAnalysis.size * fileAnalysis.compressionRatio);
                fileAnalysis.compressionSavings = fileAnalysis.size - fileAnalysis.estimatedCompressedSize;
                
                jsAnalysis.files.push(fileAnalysis);
                jsAnalysis.totalSize += stats.size;
                jsAnalysis.compressionPotential += fileAnalysis.compressionSavings;
                
                // Detect code splitting opportunities
                if (fileAnalysis.size > 10240) { // Files > 10KB
                    jsAnalysis.codeSplittingOpportunities.push({
                        file: filePath,
                        size: fileAnalysis.size,
                        reason: 'Large file candidate for code splitting'
                    });
                }
                
            } catch (error) {
                console.warn(`⚠️  Could not analyze JS file ${filePath}: ${error.message}`);
            }
        }
        
        return jsAnalysis;
    }
    
    /**
     * Analyze image assets
     */
    async analyzeImageAssets() {
        const imageFiles = await this.findFiles('**/*.{jpg,jpeg,png,gif,webp,svg}');
        const imageAnalysis = {
            files: [],
            totalSize: 0,
            optimizationPotential: 0,
            formatRecommendations: []
        };
        
        for (const filePath of imageFiles) {
            try {
                const stats = await statAsync(filePath);
                const extension = path.extname(filePath).toLowerCase();
                
                const imageInfo = {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    format: extension,
                    optimizationPotential: this.estimateImageOptimizationPotential(extension, stats.size),
                    lastModified: stats.mtime.toISOString()
                };
                
                imageAnalysis.files.push(imageInfo);
                imageAnalysis.totalSize += stats.size;
                imageAnalysis.optimizationPotential += imageInfo.optimizationPotential;
                
                // Format recommendations
                if (extension === '.png' && stats.size > 50000) {
                    imageAnalysis.formatRecommendations.push({
                        file: filePath,
                        current: 'PNG',
                        recommended: 'WebP',
                        estimatedSavings: Math.round(stats.size * 0.3) // ~30% savings
                    });
                }
                
            } catch (error) {
                console.warn(`⚠️  Could not analyze image ${filePath}: ${error.message}`);
            }
        }
        
        return imageAnalysis;
    }
    
    /**
     * Analyze font assets
     */
    async analyzeFontAssets() {
        const fontFiles = await this.findFiles('**/*.{woff,woff2,ttf,otf}');
        const fontAnalysis = {
            files: [],
            totalSize: 0,
            optimizationRecommendations: []
        };
        
        for (const filePath of fontFiles) {
            try {
                const stats = await statAsync(filePath);
                const extension = path.extname(filePath).toLowerCase();
                
                const fontInfo = {
                    path: filePath,
                    name: path.basename(filePath),
                    size: stats.size,
                    format: extension,
                    lastModified: stats.mtime.toISOString()
                };
                
                fontAnalysis.files.push(fontInfo);
                fontAnalysis.totalSize += stats.size;
                
                // Format recommendations
                if (extension === '.ttf') {
                    fontAnalysis.optimizationRecommendations.push({
                        file: filePath,
                        recommendation: 'Convert TTF to WOFF2 for better compression',
                        estimatedSavings: Math.round(stats.size * 0.5)
                    });
                }
                
            } catch (error) {
                console.warn(`⚠️  Could not analyze font ${filePath}: ${error.message}`);
            }
        }
        
        return fontAnalysis;
    }
    
    /**
     * Extract CSS rules from content
     */
    extractCSSRules(content) {
        // Simple regex-based extraction (could be enhanced with CSS parser)
        const rules = content.match(/[^{}]+\{[^{}]*\}/g) || [];
        return rules.map(rule => ({
            selector: rule.split('{')[0].trim(),
            properties: rule.split('{')[1].replace('}', '').trim(),
            hash: crypto.createHash('md5').update(rule).digest('hex')
        }));
    }
    
    /**
     * Extract CSS selectors
     */
    extractCSSSelectors(content) {
        const selectors = content.match(/[^{}]+(?=\{)/g) || [];
        return selectors.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    /**
     * Extract CSS properties
     */
    extractCSSProperties(content) {
        const properties = content.match(/[a-z-]+\s*:/g) || [];
        return [...new Set(properties.map(p => p.replace(':', '').trim()))];
    }
    
    /**
     * Extract media queries
     */
    extractMediaQueries(content) {
        const mediaQueries = content.match(/@media[^{]+/g) || [];
        return mediaQueries.map(mq => mq.trim());
    }
    
    /**
     * Extract JavaScript functions
     */
    extractJavaScriptFunctions(content) {
        const functions = content.match(/function\s+\w+\s*\([^)]*\)|const\s+\w+\s*=\s*\([^)]*\)\s*=>/g) || [];
        return functions.map(func => ({
            signature: func,
            hash: crypto.createHash('md5').update(func).digest('hex')
        }));
    }
    
    /**
     * Extract JavaScript imports
     */
    extractJavaScriptImports(content) {
        const imports = content.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || [];
        return imports.map(imp => imp.trim());
    }
    
    /**
     * Extract JavaScript exports
     */
    extractJavaScriptExports(content) {
        const exports = content.match(/export\s+.*?[;\n]|module\.exports\s*=.*?[;\n]/g) || [];
        return exports.map(exp => exp.trim());
    }
    
    /**
     * Analyze JavaScript dependencies
     */
    analyzeDependencies(content) {
        const requires = content.match(/require\(['"][^'"]+['"]\)/g) || [];
        const imports = content.match(/from\s+['"][^'"]+['"]/g) || [];
        
        return {
            requires: requires.map(req => req.match(/['"]([^'"]+)['"]/)[1]),
            imports: imports.map(imp => imp.match(/['"]([^'"]+)['"]/)[1])
        };
    }
    
    /**
     * Estimate compression ratio for text content
     */
    estimateCompressionRatio(content) {
        // Simple estimation based on content characteristics
        const repetitionFactor = this.calculateRepetitionFactor(content);
        const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
        
        // Base compression ratio for gzip
        let compressionRatio = 0.7;
        
        // Adjust based on repetition and whitespace
        compressionRatio -= (repetitionFactor * 0.3);
        compressionRatio -= (whitespaceRatio * 0.2);
        
        return Math.max(0.3, Math.min(0.9, compressionRatio));
    }
    
    /**
     * Calculate repetition factor in content
     */
    calculateRepetitionFactor(content) {
        const lines = content.split('\n');
        const uniqueLines = [...new Set(lines)];
        return 1 - (uniqueLines.length / lines.length);
    }
    
    /**
     * Estimate image optimization potential
     */
    estimateImageOptimizationPotential(format, size) {
        const optimizationFactors = {
            '.jpg': 0.15,   // 15% optimization potential
            '.jpeg': 0.15,
            '.png': 0.25,   // 25% optimization potential
            '.gif': 0.10,   // 10% optimization potential
            '.webp': 0.05,  // 5% optimization potential (already optimized)
            '.svg': 0.30    // 30% optimization potential
        };
        
        const factor = optimizationFactors[format] || 0.10;
        return Math.round(size * factor);
    }
    
    /**
     * Detect duplicate CSS rules
     */
    detectDuplicateRules(currentFile, existingFiles) {
        const duplicates = [];
        
        for (const rule of currentFile.rules) {
            for (const existingFile of existingFiles) {
                if (existingFile.path === currentFile.path) continue;
                
                const duplicate = existingFile.rules?.find(r => r.hash === rule.hash);
                if (duplicate) {
                    duplicates.push({
                        rule: rule.selector,
                        file1: currentFile.path,
                        file2: existingFile.path,
                        estimatedSavings: rule.properties.length
                    });
                }
            }
        }
        
        return duplicates;
    }
    
    /**
     * Analyze critical CSS potential
     */
    async analyzeCriticalCSSPotential(cssFiles) {
        // Simple heuristic: CSS rules with common critical selectors
        const criticalSelectors = [
            'body', 'html', 'h1', 'h2', '.hero', '.header', '.navigation',
            '.main', '.content', '.above-fold', '.critical'
        ];
        
        let criticalSize = 0;
        let totalCriticalRules = 0;
        
        for (const file of cssFiles) {
            for (const rule of file.rules || []) {
                const isCritical = criticalSelectors.some(selector => 
                    rule.selector.includes(selector)
                );
                
                if (isCritical) {
                    criticalSize += rule.selector.length + rule.properties.length;
                    totalCriticalRules++;
                }
            }
        }
        
        return {
            identified: totalCriticalRules > 0,
            size: criticalSize,
            rules: totalCriticalRules,
            percentage: cssFiles.reduce((total, file) => total + file.size, 0) > 0 
                ? (criticalSize / cssFiles.reduce((total, file) => total + file.size, 0)) * 100 
                : 0
        };
    }
    
    /**
     * Check budget compliance
     */
    checkBudgetCompliance(bundleAnalysis) {
        return {
            css: {
                current: bundleAnalysis.css.totalSize,
                budget: this.budgetThresholds.css_bundle_size,
                compliant: bundleAnalysis.css.totalSize <= this.budgetThresholds.css_bundle_size,
                overage: Math.max(0, bundleAnalysis.css.totalSize - this.budgetThresholds.css_bundle_size)
            },
            javascript: {
                current: bundleAnalysis.javascript.totalSize,
                budget: this.budgetThresholds.javascript_bundle_size,
                compliant: bundleAnalysis.javascript.totalSize <= this.budgetThresholds.javascript_bundle_size,
                overage: Math.max(0, bundleAnalysis.javascript.totalSize - this.budgetThresholds.javascript_bundle_size)
            },
            total: {
                current: bundleAnalysis.total.size,
                budget: this.budgetThresholds.total_bundle_size,
                compliant: bundleAnalysis.total.size <= this.budgetThresholds.total_bundle_size,
                overage: Math.max(0, bundleAnalysis.total.size - this.budgetThresholds.total_bundle_size)
            }
        };
    }
    
    /**
     * Generate optimization recommendations
     */
    async generateOptimizationRecommendations(bundleAnalysis) {
        const recommendations = [];
        
        // CSS Optimization Recommendations
        if (!bundleAnalysis.budgetCompliance.css.compliant) {
            recommendations.push({
                priority: 'HIGH',
                category: 'CSS Bundle Size',
                issue: `CSS bundle ${Math.round(bundleAnalysis.budgetCompliance.css.overage / 1024)}KB over budget`,
                recommendation: 'Implement CSS optimization strategies',
                actions: [
                    'Remove unused CSS rules',
                    'Merge duplicate selectors',
                    'Implement critical CSS inlining',
                    'Enable gzip compression'
                ],
                estimatedSavings: bundleAnalysis.css.compressionPotential,
                authority: 'performance-optimizer',
                effort: 'MEDIUM'
            });
        }
        
        // JavaScript Optimization Recommendations
        if (!bundleAnalysis.budgetCompliance.javascript.compliant) {
            recommendations.push({
                priority: 'HIGH',
                category: 'JavaScript Bundle Size',
                issue: `JavaScript bundle ${Math.round(bundleAnalysis.budgetCompliance.javascript.overage / 1024)}KB over budget`,
                recommendation: 'Implement JavaScript optimization strategies',
                actions: [
                    'Enable code splitting',
                    'Remove unused code',
                    'Implement tree shaking',
                    'Optimize compression'
                ],
                estimatedSavings: bundleAnalysis.javascript.compressionPotential,
                authority: 'performance-optimizer',
                effort: 'HIGH'
            });
        }
        
        // Code Splitting Opportunities
        if (bundleAnalysis.javascript.codeSplittingOpportunities.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Code Splitting',
                issue: `${bundleAnalysis.javascript.codeSplittingOpportunities.length} files identified for code splitting`,
                recommendation: 'Implement dynamic imports and code splitting',
                actions: bundleAnalysis.javascript.codeSplittingOpportunities.map(opp => 
                    `Split ${path.basename(opp.file)} (${Math.round(opp.size / 1024)}KB)`
                ),
                estimatedSavings: bundleAnalysis.javascript.codeSplittingOpportunities.reduce((sum, opp) => sum + (opp.size * 0.3), 0),
                authority: 'performance-optimizer',
                effort: 'HIGH'
            });
        }
        
        // Image Optimization
        if (bundleAnalysis.images.optimizationPotential > 10240) { // > 10KB savings potential
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Image Optimization',
                issue: `${Math.round(bundleAnalysis.images.optimizationPotential / 1024)}KB image optimization potential`,
                recommendation: 'Optimize images and implement modern formats',
                actions: [
                    'Convert large PNGs to WebP',
                    'Optimize JPEG compression',
                    'Implement lazy loading',
                    'Use responsive images'
                ],
                estimatedSavings: bundleAnalysis.images.optimizationPotential,
                authority: 'performance-optimizer',
                effort: 'LOW'
            });
        }
        
        // Critical CSS Recommendation
        if (bundleAnalysis.css.criticalCSS.identified && bundleAnalysis.css.criticalCSS.percentage < 20) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Critical CSS',
                issue: 'Low critical CSS coverage detected',
                recommendation: 'Implement critical CSS inlining strategy',
                actions: [
                    'Identify above-the-fold styles',
                    'Inline critical CSS in HTML',
                    'Defer non-critical CSS loading',
                    'Optimize critical path rendering'
                ],
                estimatedSavings: bundleAnalysis.css.totalSize * 0.3, // Estimated performance improvement
                authority: 'performance-optimizer',
                effort: 'MEDIUM'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Find files matching pattern
     */
    async findFiles(pattern) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Use find command to get files
            const { stdout } = await execAsync(`find . -name "${pattern}" -type f | grep -v node_modules | head -50`);
            return stdout.trim().split('\n').filter(line => line && !line.includes('node_modules'));
        } catch (error) {
            console.warn(`Could not find files for pattern ${pattern}: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Generate optimization report
     */
    generateOptimizationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            bundleAnalysis: this.currentBundles,
            recommendations: this.optimizationRecommendations,
            prioritizedActions: this.prioritizeOptimizations(),
            estimatedTotalSavings: this.calculateTotalEstimatedSavings(),
            budgetStatus: this.currentBundles?.budgetCompliance || null,
            nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'reports', 'bundle-optimization', `bundle-optimization-${Date.now()}.json`);
        try {
            fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`📊 Bundle optimization report saved: ${reportPath}`);
        } catch (error) {
            console.warn(`⚠️  Could not save optimization report: ${error.message}`);
        }
        
        return report;
    }
    
    /**
     * Prioritize optimizations by impact and effort
     */
    prioritizeOptimizations() {
        return this.optimizationRecommendations
            .map(rec => ({
                ...rec,
                score: this.calculateOptimizationScore(rec)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Top 5 optimizations
    }
    
    /**
     * Calculate optimization score (impact vs effort)
     */
    calculateOptimizationScore(recommendation) {
        const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const effortWeights = { LOW: 3, MEDIUM: 2, HIGH: 1 };
        
        const priorityScore = priorityWeights[recommendation.priority] || 1;
        const effortScore = effortWeights[recommendation.effort] || 1;
        const savingsScore = Math.min(3, Math.floor(recommendation.estimatedSavings / 10240)); // Per 10KB savings
        
        return priorityScore + effortScore + savingsScore;
    }
    
    /**
     * Calculate total estimated savings across all recommendations
     */
    calculateTotalEstimatedSavings() {
        return this.optimizationRecommendations.reduce((total, rec) => total + (rec.estimatedSavings || 0), 0);
    }
    
    /**
     * Print optimization summary
     */
    printOptimizationSummary() {
        if (!this.currentBundles) {
            console.log('No bundle analysis available. Run analyzeBundles() first.');
            return;
        }
        
        console.log('\n📦 BUNDLE OPTIMIZATION SUMMARY');
        console.log('==============================');
        console.log(`Total Bundle Size: ${Math.round(this.currentBundles.total.size / 1024)}KB`);
        console.log(`Total Files: ${this.currentBundles.total.files}`);
        
        // Budget status
        const budgetStatus = this.currentBundles.budgetCompliance;
        console.log('\n💰 Budget Compliance:');
        console.log(`   CSS: ${Math.round(budgetStatus.css.current / 1024)}KB / ${Math.round(budgetStatus.css.budget / 1024)}KB ${budgetStatus.css.compliant ? '✅' : '❌'}`);
        console.log(`   JS: ${Math.round(budgetStatus.javascript.current / 1024)}KB / ${Math.round(budgetStatus.javascript.budget / 1024)}KB ${budgetStatus.javascript.compliant ? '✅' : '❌'}`);
        console.log(`   Total: ${Math.round(budgetStatus.total.current / 1024)}KB / ${Math.round(budgetStatus.total.budget / 1024)}KB ${budgetStatus.total.compliant ? '✅' : '❌'}`);
        
        // Top recommendations
        const prioritized = this.prioritizeOptimizations();
        if (prioritized.length > 0) {
            console.log('\n🔧 Top Optimization Opportunities:');
            prioritized.slice(0, 3).forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec.recommendation} (${Math.round(rec.estimatedSavings / 1024)}KB savings)`);
            });
        }
        
        // Total potential savings
        const totalSavings = this.calculateTotalEstimatedSavings();
        console.log(`\n💾 Total Optimization Potential: ${Math.round(totalSavings / 1024)}KB`);
        
        if (totalSavings > 10240) { // > 10KB
            console.log('🚀 Significant optimization opportunities identified!');
        }
    }
    
    /**
     * CLI interface for bundle optimization
     */
    static async runCLI() {
        const args = process.argv.slice(2);
        const optimizer = new BundleOptimizer();
        
        if (args[0] === 'analyze') {
            // Run bundle analysis
            await optimizer.analyzeBundles();
            optimizer.printOptimizationSummary();
            
            // Generate report
            const report = optimizer.generateOptimizationReport();
            
            // Exit with appropriate code
            if (!report.budgetStatus.total.compliant) {
                console.error('❌ Bundle size exceeds budget limits');
                process.exit(1);
            } else {
                console.log('✅ Bundle sizes within budget limits');
                process.exit(0);
            }
            
        } else if (args[0] === 'report') {
            // Generate detailed report
            await optimizer.analyzeBundles();
            const report = optimizer.generateOptimizationReport();
            console.log(JSON.stringify(report, null, 2));
            
        } else {
            // Default: analyze and summarize
            console.log('🚀 Analyzing bundle composition and optimization opportunities...');
            await optimizer.analyzeBundles();
            optimizer.printOptimizationSummary();
        }
    }
}

// CLI execution
if (require.main === module) {
    BundleOptimizer.runCLI().catch(error => {
        console.error('❌ Bundle optimization failed:', error);
        process.exit(1);
    });
}

module.exports = BundleOptimizer;