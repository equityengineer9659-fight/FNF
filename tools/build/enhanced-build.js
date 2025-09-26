/**
 * PHASE 4.1A: ENHANCED BUILD TOOLING
 * Simple build system for the Enhanced HTML-First Architecture
 * Maintains minimal overhead while enabling ES6 modules and Web Components
 */

const fs = require('fs').promises;
const path = require('path');

class EnhancedBuildTool {
  constructor() {
    this.buildStart = Date.now();
    this.sourceDir = path.resolve('./js/core');
    this.outputDir = path.resolve('./js/dist');
    this.buildStats = {
      filesProcessed: 0,
      totalSize: 0,
      errors: []
    };
  }

  async build() {
    console.log('🔨 Phase 4.1A Enhanced Build Starting...');
    console.log(`📂 Source: ${this.sourceDir}`);
    console.log(`📦 Output: ${this.outputDir}`);
    
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();
      
      // Copy enhanced architecture files
      await this.copyEnhancedFiles();
      
      // Create module bundle
      await this.createModuleBundle();
      
      // Generate build report
      this.generateBuildReport();
      
      const buildTime = Date.now() - this.buildStart;
      console.log(`✅ Enhanced build completed in ${buildTime}ms`);
      
    } catch (error) {
      console.error('❌ Enhanced build failed:', error);
      throw error;
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }
  }

  async copyEnhancedFiles() {
    console.log('📋 Copying enhanced architecture files...');
    
    const filesToCopy = [
      'enhanced-architecture-init.js',
      'modules/component-loader.js',
      'components/navigation-component.js'
    ];

    for (const file of filesToCopy) {
      const sourcePath = path.join(this.sourceDir, file);
      const outputPath = path.join(this.outputDir, path.basename(file));
      
      try {
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(outputPath, content);
        
        this.buildStats.filesProcessed++;
        this.buildStats.totalSize += content.length;
        
        console.log(`✅ Copied: ${file} (${content.length} bytes)`);
        
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
        this.buildStats.errors.push(`Copy failed: ${file}`);
      }
    }
  }

  async createModuleBundle() {
    console.log('📦 Creating module bundle...');
    
    // Create a simple bundle that can be loaded as a single file
    const bundleContent = `
/**
 * PHASE 4.1A: ENHANCED ARCHITECTURE BUNDLE
 * Combined bundle for browsers that don't support ES6 modules
 * Includes graceful fallbacks and progressive enhancement
 */

(function() {
  'use strict';
  
  // Check for modern browser support
  const hasModuleSupport = 'noModule' in document.createElement('script');
  const hasCustomElements = typeof window.customElements !== 'undefined';
  
  console.log('🔍 Enhanced Architecture Bundle: Checking browser support...');
  console.log('   ES6 Modules:', hasModuleSupport);
  console.log('   Web Components:', hasCustomElements);
  
  if (!hasModuleSupport || !hasCustomElements) {
    console.log('⚠️ Enhanced features not fully supported - using HTML-first fallback');
    
    // Ensure basic mobile navigation works
    document.addEventListener('DOMContentLoaded', function() {
      const mobileToggle = document.querySelector('.mobile-nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      if (mobileToggle && navMenu && !mobileToggle.onclick) {
        mobileToggle.onclick = function() {
          navMenu.classList.toggle('active');
          this.classList.toggle('active');
          console.log('📱 Fallback mobile navigation active');
        };
        
        console.log('🔧 HTML-first navigation fallback initialized');
      }
    });
    
    return; // Exit early for non-supporting browsers
  }
  
  // For supporting browsers, load the enhanced architecture
  console.log('🚀 Loading enhanced architecture...');
  
  // Dynamically import the enhanced architecture
  if (typeof import === 'function') {
    import('./enhanced-architecture-init.js')
      .then(() => {
        console.log('✅ Enhanced architecture loaded successfully');
      })
      .catch((error) => {
        console.error('❌ Enhanced architecture failed to load:', error);
        console.log('🔄 Falling back to HTML-first functionality');
      });
  } else {
    // Fallback for older module implementations
    const script = document.createElement('script');
    script.type = 'module';
    script.src = './enhanced-architecture-init.js';
    script.onload = () => console.log('✅ Enhanced architecture loaded via script tag');
    script.onerror = () => console.log('❌ Enhanced architecture script failed to load');
    document.head.appendChild(script);
  }
  
})();
`;

    const bundlePath = path.join(this.outputDir, 'enhanced-bundle.js');
    await fs.writeFile(bundlePath, bundleContent);
    
    this.buildStats.filesProcessed++;
    this.buildStats.totalSize += bundleContent.length;
    
    console.log(`✅ Created bundle: enhanced-bundle.js (${bundleContent.length} bytes)`);
  }

  generateBuildReport() {
    const buildTime = Date.now() - this.buildStart;
    const totalSizeKB = (this.buildStats.totalSize / 1024).toFixed(2);
    
    const report = {
      buildTime: `${buildTime}ms`,
      filesProcessed: this.buildStats.filesProcessed,
      totalSize: `${totalSizeKB}KB`,
      errors: this.buildStats.errors,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📊 Enhanced Build Report:');
    console.log('========================');
    console.log(`   Build Time: ${report.buildTime}`);
    console.log(`   Files Processed: ${report.filesProcessed}`);
    console.log(`   Total Size: ${report.totalSize}`);
    console.log(`   Errors: ${report.errors.length}`);
    
    if (report.errors.length > 0) {
      console.log('\n❌ Build Errors:');
      report.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Save report to file
    const reportPath = path.join(this.outputDir, 'build-report.json');
    fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      .then(() => console.log(`📄 Build report saved: ${reportPath}`))
      .catch(err => console.error('❌ Failed to save build report:', err));
  }
}

// CLI execution
if (require.main === module) {
  const builder = new EnhancedBuildTool();
  builder.build()
    .then(() => {
      console.log('🎉 Enhanced build completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Enhanced build failed:', error);
      process.exit(1);
    });
}

module.exports = EnhancedBuildTool;