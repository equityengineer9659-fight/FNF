
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
