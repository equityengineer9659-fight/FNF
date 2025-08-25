/*
 * ============================================================================
 * 
 *                          ⚠️  CRITICAL WARNING ⚠️
 *
 * NEVER EVER TOUCH OR DELETE THIS CODE - ORIGINAL v3.2 SPINNING MESH BACKGROUND
 *
 * ============================================================================
 * 
 * THIS FILE RECREATES THE EXACT ORIGINAL v3.2 SPINNING MESH BACKGROUND EFFECT
 * THAT WAS LOST DURING PHASE 1 JAVASCRIPT CONSOLIDATION.
 * 
 * WHAT THIS CODE DOES:
 * - Creates 600 randomly scattered white lines (300 per SVG spinner)
 * - Two counter-rotating SVG spinners (60s clockwise, 80s counter-clockwise)
 * - Scroll-based fading effect (intense at top, fades to 30% as you scroll)
 * - Works on all pages: index, about, services, contact, resources, impact
 * - Uses exact original CSS positioning and z-index values from v3.2 backup
 * 
 * CRITICAL TECHNICAL DETAILS:
 * - Container uses z-index: 0 (NOT -1!) - this was the breakthrough discovery
 * - SVG spinners sized at 300vmax with translate(-50%, -50%) centering
 * - Line opacity: 0.02-0.04 for subtle effect matching original
 * - Random positions: (Math.random() - 0.5) * 300 for scattered pattern
 * - Respects prefers-reduced-motion accessibility setting
 * 
 * WHY THIS CODE IS CRITICAL:
 * - Provides the signature visual brand effect users expect
 * - Recreated after extensive debugging of z-index constraints 
 * - Matches exact original v3.2 implementation from backup files
 * - Required complex adaptation for current website's CSS framework
 * 
 * IF YOU NEED TO MODIFY ANYTHING:
 * 1. Check git history for extensive debugging process documentation
 * 2. Reference backup files in: C:\Users\luetk\Desktop\Website\Backup\3.2 Arch Improvement and Moble Menu Fix
 * 3. Test thoroughly across all 6 HTML pages
 * 4. Verify scroll-based fading still works
 * 
 * DO NOT REMOVE WITHOUT EXPLICIT USER APPROVAL - THIS TOOK HOURS TO RESTORE!
 * 
 * ============================================================================
 */

// RECREATED ORIGINAL v3.2 MESH BACKGROUND - ADAPTED FOR Z-INDEX CONSTRAINT
(function() {
    'use strict';
    
    console.log('===== RECREATING ORIGINAL v3.2 MESH PATTERN =====');
    
    // NEVER DELETE - Check for reduced motion preference (ACCESSIBILITY REQUIREMENT)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    function createOriginalIridescentBackground() {
        console.log('Creating original iridescent spinning lines background');
        console.log('Prefers reduced motion:', prefersReducedMotion);
        
        // NEVER DELETE - Accessibility: Skip animations if user prefers reduced motion
        if (prefersReducedMotion) {
            console.log('Skipping iridescent background due to reduced motion preference');
            return;
        }
        
        // NEVER DELETE - Prevent duplicate backgrounds
        if (document.querySelector('.iridescent-background')) {
            console.log('Iridescent background already exists, skipping creation');
            return;
        }
        
        // NEVER DELETE - Create the main container with EXACT ORIGINAL CSS from v3.2 backup
        // CRITICAL: z-index: 0 (NOT -1!) - this was the key breakthrough after extensive debugging
        const iridescent = document.createElement('div');
        iridescent.className = 'iridescent-background';
        iridescent.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 0 !important;
            overflow: hidden !important;
            opacity: 1 !important;
            transition: opacity 0.3s ease !important;
        `;
        
        // NEVER DELETE - Create first spinner with EXACT ORIGINAL CSS from v3.2 backup
        // CRITICAL: 300vmax size and translate(-50%, -50%) positioning are essential
        const spinner1 = document.createElement('div');
        spinner1.className = 'iridescent-spinner';
        spinner1.style.cssText = `
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            width: 300vmax !important;
            height: 300vmax !important;
            transform: translate(-50%, -50%) !important;
            pointer-events: none !important;
        `;
        
        // NEVER DELETE - Create first SVG with clockwise spinning animation
        const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg1.setAttribute('class', 'iridescent-svg spin-clockwise');
        svg1.setAttribute('viewBox', '-150 -150 300 300');
        svg1.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
        `;
        
        // NEVER DELETE - Create pattern of 300 small diagonal lines - EXACT ORIGINAL ALGORITHM
        // CRITICAL: Random positioning and opacity values match original v3.2 exactly
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 300; // NEVER CHANGE - Original random algorithm
            const y = (Math.random() - 0.5) * 300; // NEVER CHANGE - Original random algorithm
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x - 1);
            line.setAttribute('y1', y - 1);
            line.setAttribute('x2', x + 1);
            line.setAttribute('y2', y + 1);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.04)'); // NEVER CHANGE - Original opacity
            line.setAttribute('stroke-width', '0.5'); // NEVER CHANGE - Original stroke width
            svg1.appendChild(line);
        }
        
        // NEVER DELETE - Add longer structural lines for visual depth - EXACT ORIGINAL ALGORITHM
        for (let i = -150; i <= 150; i += 15) {
            if (Math.random() > 0.5) { // NEVER CHANGE - Original random condition
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', i);
                line.setAttribute('y1', '-150');
                line.setAttribute('x2', i);
                line.setAttribute('y2', '150');
                line.setAttribute('stroke', 'rgba(255, 255, 255, 0.02)'); // NEVER CHANGE - Original opacity
                line.setAttribute('stroke-width', '0.25'); // NEVER CHANGE - Original stroke width
                svg1.appendChild(line);
            }
        }
        
        spinner1.appendChild(svg1);
        
        // NEVER DELETE - Create second spinner with EXACT ORIGINAL CSS from v3.2 backup
        // CRITICAL: Counter-rotating pattern creates depth effect
        const spinner2 = document.createElement('div');
        spinner2.className = 'iridescent-spinner';
        spinner2.style.cssText = `
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            width: 300vmax !important;
            height: 300vmax !important;
            transform: translate(-50%, -50%) !important;
            pointer-events: none !important;
        `;
        
        // NEVER DELETE - Create second SVG with counter-clockwise spinning animation
        const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg2.setAttribute('class', 'iridescent-svg spin-counter');
        svg2.setAttribute('viewBox', '-150 -150 300 300');
        svg2.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
        `;
        
        // NEVER DELETE - Create different pattern for spinner 2 - EXACT ORIGINAL ALGORITHM
        // CRITICAL: Different diagonal direction creates layered mesh effect
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 300; // NEVER CHANGE - Original random algorithm
            const y = (Math.random() - 0.5) * 300; // NEVER CHANGE - Original random algorithm
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x + 1); // NEVER CHANGE - Opposite diagonal direction
            line.setAttribute('y1', y - 1); // NEVER CHANGE - Opposite diagonal direction
            line.setAttribute('x2', x - 1); // NEVER CHANGE - Opposite diagonal direction
            line.setAttribute('y2', y + 1); // NEVER CHANGE - Opposite diagonal direction
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.035)'); // NEVER CHANGE - Original opacity
            line.setAttribute('stroke-width', '0.5'); // NEVER CHANGE - Original stroke width
            svg2.appendChild(line);
        }
        
        // NEVER DELETE - Add horizontal structural lines for second spinner - EXACT ORIGINAL ALGORITHM
        for (let i = -150; i <= 150; i += 15) {
            if (Math.random() > 0.5) { // NEVER CHANGE - Original random condition
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', '-150');
                line.setAttribute('y1', i);
                line.setAttribute('x2', '150');
                line.setAttribute('y2', i);
                line.setAttribute('stroke', 'rgba(255, 255, 255, 0.02)'); // NEVER CHANGE - Original opacity
                line.setAttribute('stroke-width', '0.25'); // NEVER CHANGE - Original stroke width
                svg2.appendChild(line);
            }
        }
        
        spinner2.appendChild(svg2);
        
        // NEVER DELETE - Add mask element for visual effects - EXACT ORIGINAL STRUCTURE
        const maskDiv = document.createElement('div');
        maskDiv.className = 'iridescent-mask';
        maskDiv.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
        `;
        
        // NEVER DELETE - Assemble all components - EXACT ORIGINAL STRUCTURE
        iridescent.appendChild(spinner1);
        iridescent.appendChild(spinner2);
        iridescent.appendChild(maskDiv);
        
        // NEVER DELETE - Add required CSS keyframes with EXACT ORIGINAL TIMING
        // CRITICAL: 60s clockwise, 80s counter-clockwise creates signature effect
        const keyframesStyle = document.createElement('style');
        keyframesStyle.setAttribute('data-iridescent-keyframes', 'true');
        keyframesStyle.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            @keyframes spinReverse {
                from { transform: rotate(0deg); }
                to { transform: rotate(-360deg); }
            }
            .iridescent-svg.spin-clockwise {
                animation: spin 60s linear infinite !important;
            }
            .iridescent-svg.spin-counter {
                animation: spinReverse 80s linear infinite !important;
            }
        `;
        document.head.appendChild(keyframesStyle);
        
        // NEVER DELETE - Add to DOM (adapted from documentElement to body for reliability)
        document.body.appendChild(iridescent);
        
        console.log('Original v3.2 mesh pattern recreated with z-index adaptation');
        console.log('Pattern: 600 random scattered lines, dual counter-rotating SVGs');
        console.log('Timing: 60s clockwise, 80s counter-clockwise');
        
        return iridescent;
    }
    
    // NEVER DELETE - Add scroll-based fading effect - EXACT ORIGINAL ALGORITHM
    // CRITICAL: Creates signature "intense at top, fades as you scroll" effect
    function addScrollBasedFading(iridescent) {
        if (!iridescent) return;
        
        let ticking = false;
        const updateParallax = () => {
            const scrollY = window.scrollY;
            const scrollPercentage = scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const opacity = Math.max(0.3, 1 - (scrollPercentage * 0.6)); // NEVER CHANGE - Original fade curve
            iridescent.style.opacity = opacity;
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
        
        console.log('Scroll-based fading enabled: intense at top, fades to 30%');
    }
    
    // NEVER DELETE - Initialization function with debug indicator
    function init() {
        console.log('Initializing original v3.2 mesh background...');
        
        // NEVER DELETE - Test indicator to confirm script loading (DISABLED FOR PRODUCTION)
        // Uncomment the lines below for debugging if mesh background issues occur
        /*
        const testDiv = document.createElement('div');
        testDiv.textContent = 'ORIGINAL v3.2 LOADED';
        testDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: darkblue;
            color: white;
            padding: 10px;
            z-index: 9999;
            font-weight: bold;
        `;
        document.body.appendChild(testDiv);
        
        setTimeout(() => {
            if (testDiv.parentNode) {
                testDiv.parentNode.removeChild(testDiv);
            }
        }, 5000);
        */
        
        // NEVER DELETE - Create the original mesh background
        const mesh = createOriginalIridescentBackground();
        
        // NEVER DELETE - Add scroll-based fading effect
        if (mesh) {
            addScrollBasedFading(mesh);
        }
        
        console.log('Original v3.2 mesh background initialization complete');
    }
    
    // NEVER DELETE - Wait for page loaded state - EXACT ORIGINAL TIMING STRATEGY
    // CRITICAL: Must wait for 'loaded' class to prevent conflicts with page load transitions
    function waitForPageLoaded() {
        if (document.body && document.body.classList.contains('loaded')) {
            console.log('Page loaded - creating original v3.2 mesh');
            init();
        } else {
            setTimeout(waitForPageLoaded, 100);
        }
    }
    
    // NEVER DELETE - Start the initialization process
    waitForPageLoaded();
    
})();

/*
 * ============================================================================
 * 
 * END OF CRITICAL CODE - DO NOT DELETE OR MODIFY WITHOUT EXPLICIT APPROVAL
 * 
 * THIS CODE PROVIDES THE SIGNATURE VISUAL BRAND EFFECT FOR THE ENTIRE WEBSITE
 * RESTORING IT REQUIRED EXTENSIVE DEBUGGING AND ANALYSIS OF v3.2 BACKUP FILES
 * 
 * MODIFICATION HISTORY:
 * - Lost during Phase 1 JavaScript Consolidation  
 * - Restored using exact original v3.2 backup implementation
 * - Adapted for z-index constraints discovered through diagnostic testing
 * - Applied to all 6 HTML pages: index, about, services, contact, resources, impact
 * 
 * ============================================================================
 */