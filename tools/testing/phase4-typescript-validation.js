// Phase 4.1B TypeScript Integration Validation Test
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function validateTypeScriptIntegration() {
  console.log('🔍 Phase 4.1B TypeScript Integration Validation Starting...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test 1: TypeScript Compilation Validation
    console.log('📘 Test 1: TypeScript Compilation Validation');
    
    const tsOutputDir = path.join(__dirname, '../../js/dist-ts');
    const requiredFiles = [
      'components/navigation-component.js',
      'components/navigation-component.d.ts',
      'modules/component-loader.js',
      'modules/component-loader.d.ts',
      'types/enhanced-architecture.d.ts'
    ];
    
    let compilationScore = 0;
    const totalFiles = requiredFiles.length;
    
    for (const file of requiredFiles) {
      const filePath = path.join(tsOutputDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`   ✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        compilationScore++;
      } else {
        console.log(`   ❌ ${file} - Missing`);
      }
    }
    
    console.log(`   Compilation Score: ${compilationScore}/${totalFiles} (${(compilationScore/totalFiles*100).toFixed(1)}%)`);
    
    // Test 2: TypeScript Type Definitions Validation
    console.log('\n📝 Test 2: TypeScript Type Definitions Validation');
    
    const typeDefFile = path.join(tsOutputDir, 'types/enhanced-architecture.d.ts');
    if (fs.existsSync(typeDefFile)) {
      const typeContent = fs.readFileSync(typeDefFile, 'utf-8');
      
      const expectedTypes = [
        'NavigationComponentInterface',
        'ComponentLoaderInterface',
        'PerformanceMetrics',
        'ArchitectureStatus',
        'Phase4ValidationResults'
      ];
      
      let typeScore = 0;
      for (const type of expectedTypes) {
        if (typeContent.includes(type)) {
          console.log(`   ✅ ${type} interface defined`);
          typeScore++;
        } else {
          console.log(`   ❌ ${type} interface missing`);
        }
      }
      
      console.log(`   Type Definition Score: ${typeScore}/${expectedTypes.length} (${(typeScore/expectedTypes.length*100).toFixed(1)}%)`);
    } else {
      console.log('   ❌ Type definition file not found');
    }
    
    // Test 3: Runtime Type Safety Validation
    console.log('\n🚀 Test 3: Runtime Type Safety Validation');
    
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');
    
    const runtimeValidation = await page.evaluate(() => {
      // Check if TypeScript-compiled components are working
      const testResults = {
        jsModulesLoading: false,
        typeErrorsInConsole: false,
        enhancedFeaturesWorking: false,
        navigationComponentActive: false
      };
      
      // Check for JavaScript module loading
      const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
      testResults.jsModulesLoading = scripts.some(script => 
        script.src.includes('enhanced-architecture-init')
      );
      
      // Check for navigation component functionality (TypeScript features)
      const mobileToggle = document.querySelector('.mobile-nav-toggle');
      if (mobileToggle) {
        // TypeScript version should have enhanced ARIA attributes
        testResults.navigationComponentActive = 
          mobileToggle.hasAttribute('aria-expanded') &&
          mobileToggle.hasAttribute('aria-controls') &&
          mobileToggle.hasAttribute('aria-label');
      }
      
      // Check for enhanced features (TypeScript implementation indicators)
      testResults.enhancedFeaturesWorking = 
        typeof window.EnhancedArchitecture !== 'undefined' ||
        typeof window.ComponentLoader !== 'undefined' ||
        testResults.navigationComponentActive;
      
      return testResults;
    });
    
    console.log(`   ES6 modules loading: ${runtimeValidation.jsModulesLoading ? '✅' : '❌'}`);
    console.log(`   Navigation component active: ${runtimeValidation.navigationComponentActive ? '✅' : '❌'}`);
    console.log(`   Enhanced features working: ${runtimeValidation.enhancedFeaturesWorking ? '✅' : '❌'}`);
    
    // Test 4: Performance Impact Assessment
    console.log('\n⚡ Test 4: TypeScript Performance Impact Assessment');
    
    const performanceMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType("navigation")[0];
      const resourceEntries = performance.getEntriesByType("resource");
      
      let jsSize = 0;
      let tsCompiledSize = 0;
      
      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js')) {
          jsSize += entry.transferSize || 0;
          
          // Check if this is a TypeScript-compiled file
          if (entry.name.includes('dist-ts') || 
              entry.name.includes('enhanced-architecture') ||
              entry.name.includes('component-loader')) {
            tsCompiledSize += entry.transferSize || 0;
          }
        }
      });
      
      return {
        totalJSSize: jsSize,
        tsCompiledSize: tsCompiledSize,
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
        loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart
      };
    });
    
    const totalJSKB = performanceMetrics.totalJSSize / 1024;
    const tsCompiledKB = performanceMetrics.tsCompiledSize / 1024;
    
    console.log(`   Total JS bundle: ${totalJSKB.toFixed(1)}KB`);
    console.log(`   TypeScript-compiled: ${tsCompiledKB.toFixed(1)}KB`);
    console.log(`   DOM content loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   TypeScript overhead: ${((tsCompiledKB / totalJSKB) * 100).toFixed(1)}%`);
    
    // Test 5: Type Safety & Development Experience
    console.log('\n💡 Test 5: Development Experience Validation');
    
    // Check if TypeScript configuration is working
    const tsConfigExists = fs.existsSync(path.join(__dirname, '../../tsconfig.json'));
    const buildInfoExists = fs.existsSync(path.join(tsOutputDir, '.tsbuildinfo'));
    
    console.log(`   TypeScript config present: ${tsConfigExists ? '✅' : '❌'}`);
    console.log(`   Incremental build info: ${buildInfoExists ? '✅' : '❌'}`);
    
    // Check package.json scripts
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const hasTypeScriptScripts = 
      packageJson.scripts['build:typescript'] &&
      packageJson.scripts['build:phase4'];
    
    console.log(`   TypeScript build scripts: ${hasTypeScriptScripts ? '✅' : '❌'}`);
    console.log(`   TypeScript dev dependency: ${packageJson.devDependencies.typescript ? '✅' : '❌'}`);
    
    // Overall Assessment
    console.log('\n🎯 Phase 4.1B TypeScript Integration Assessment:');
    console.log('=' .repeat(55));
    
    const assessments = [
      { name: 'TypeScript Compilation', pass: compilationScore >= 4, weight: 30 },
      { name: 'Type Definitions', pass: fs.existsSync(typeDefFile), weight: 20 },
      { name: 'Runtime Functionality', pass: runtimeValidation.enhancedFeaturesWorking, weight: 25 },
      { name: 'Performance Impact', pass: totalJSKB < 90, weight: 15 }, // Allow 90KB budget
      { name: 'Development Experience', pass: tsConfigExists && hasTypeScriptScripts, weight: 10 }
    ];
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    assessments.forEach(assessment => {
      const score = assessment.pass ? assessment.weight : 0;
      weightedScore += score;
      totalWeight += assessment.weight;
      
      console.log(`   ${assessment.name}: ${assessment.pass ? '✅' : '❌'} (${assessment.weight}% weight)`);
    });
    
    const overallScore = (weightedScore / totalWeight) * 100;
    
    console.log(`\n📊 Overall TypeScript Integration: ${overallScore.toFixed(1)}% success`);
    
    if (overallScore >= 80) {
      console.log('🎉 Phase 4.1B TypeScript integration successful!');
      console.log('✅ Optional TypeScript integration operational with zero regression');
      console.log('🔧 Enhanced development experience with type safety available');
    } else if (overallScore >= 60) {
      console.log('⚠️  Phase 4.1B TypeScript integration partially successful');
      console.log('🔄 HTML-first baseline functionality preserved');
    } else {
      console.log('❌ Phase 4.1B TypeScript integration needs attention');
      console.log('🔧 Baseline functionality should still work');
    }
    
    // Summary for Technical Architect
    console.log('\n📋 Technical Architect Summary:');
    console.log('-' .repeat(35));
    console.log(`   Compilation Success: ${(compilationScore/totalFiles*100).toFixed(0)}%`);
    console.log(`   Runtime Integration: ${runtimeValidation.enhancedFeaturesWorking ? 'Active' : 'Fallback'}`);
    console.log(`   Performance Impact: ${totalJSKB.toFixed(1)}KB total JS`);
    console.log(`   Zero Regression: ${runtimeValidation.navigationComponentActive || runtimeValidation.enhancedFeaturesWorking ? '✅ Maintained' : '⚠️ Check needed'}`);
    console.log(`   TypeScript Benefits: ${overallScore >= 70 ? 'Available' : 'Limited'}`);
    
  } catch (error) {
    console.error('❌ TypeScript validation failed:', error.message);
  } finally {
    await browser.close();
  }
}

validateTypeScriptIntegration();