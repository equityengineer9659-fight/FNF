/**
 * Navigation Height Diagnostic Script
 * Measures actual navigation height and checks clearance implementation
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Navigation Height Diagnostic Starting...');
    
    // Wait for navigation to be injected
    setTimeout(() => {
        const navbar = document.querySelector('.navbar.universal-nav');
        
        if (!navbar) {
            console.error('❌ Navigation not found!');
            return;
        }
        
        console.log('✅ Navigation found');
        
        // Measure actual navigation height
        const rect = navbar.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(navbar);
        
        console.log('📏 Navigation Measurements:');
        console.log('  - Height:', rect.height + 'px');
        console.log('  - Padding top:', computedStyle.paddingTop);
        console.log('  - Padding bottom:', computedStyle.paddingBottom);
        console.log('  - Position:', computedStyle.position);
        console.log('  - Z-index:', computedStyle.zIndex);
        
        // Check if main content has proper clearance
        const main = document.querySelector('main');
        if (main) {
            const mainStyle = window.getComputedStyle(main);
            const mainRect = main.getBoundingClientRect();
            
            console.log('📏 Main Content Measurements:');
            console.log('  - Padding top:', mainStyle.paddingTop);
            console.log('  - Top position from viewport:', mainRect.top + 'px');
            console.log('  - Expected clearance needed:', rect.height + 'px');
            
            // Check if content is being overlapped
            const overlap = rect.bottom > mainRect.top;
            console.log('⚠️  Content Overlap Status:', overlap ? 'OVERLAPPED' : 'CLEAR');
            
            if (overlap) {
                const overlapAmount = rect.bottom - mainRect.top;
                console.log('🚨 Overlap amount:', overlapAmount + 'px');
                console.log('💡 Suggested fix: Add', Math.ceil(overlapAmount + 20) + 'px padding-top to main');
            }
        }
        
        // Check CSS variables
        const rootStyle = getComputedStyle(document.documentElement);
        console.log('🎨 CSS Variables:');
        console.log('  - --fnf-nav-height:', rootStyle.getPropertyValue('--fnf-nav-height').trim());
        console.log('  - --fnf-nav-clearance-desktop:', rootStyle.getPropertyValue('--fnf-nav-clearance-desktop').trim());
        console.log('  - --fnf-nav-clearance-mobile:', rootStyle.getPropertyValue('--fnf-nav-clearance-mobile').trim());
        
        // Check first section specifically
        const firstSection = document.querySelector('main section:first-child, main .section-padding:first-child');
        if (firstSection) {
            const sectionRect = firstSection.getBoundingClientRect();
            const sectionStyle = window.getComputedStyle(firstSection);
            
            console.log('📏 First Section Measurements:');
            console.log('  - Top position:', sectionRect.top + 'px');
            console.log('  - Padding top:', sectionStyle.paddingTop);
            console.log('  - Margin top:', sectionStyle.marginTop);
            
            const sectionOverlap = rect.bottom > sectionRect.top;
            console.log('⚠️  First Section Overlap:', sectionOverlap ? 'OVERLAPPED' : 'CLEAR');
        }
        
        // Generate recommended fix
        const recommendedClearance = Math.ceil(rect.height + 24); // Height + 24px buffer
        console.log('🔧 RECOMMENDED FIX:');
        console.log(`  Add this CSS: main { padding-top: ${recommendedClearance}px !important; }`);
        console.log(`  Or update variable: --fnf-nav-height: ${Math.ceil(rect.height)}px;`);
        
    }, 1000); // Wait 1 second for navigation to load
});