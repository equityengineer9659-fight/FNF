/**
 * About Page Layout Fix
 * Forces "What We Bring" section to match "Our Core Values" styling
 * This file MUST load AFTER slds-enhancements.js
 * 
 * The main issue: H3 elements are set to display:flex which breaks margin spacing
 * This script ensures H3 elements remain display:block with proper margins
 */

(function() {
    'use strict';
    
    // Only run on About page
    if (!document.body.classList.contains('about-page')) return;
    
    console.log('About page spacing fix initializing...');
    
    // Function to apply correct spacing and styling
    function applyCorrectStyling() {
        // Fix all h3 elements in expertise and value cards
        document.querySelectorAll('.expertise-card h3, .value-card h3').forEach(h3 => {
            // Remove any existing inline styles first
            h3.removeAttribute('style');
            
            // Apply correct styles with setAttribute for maximum priority
            h3.setAttribute('style', `
                display: block !important;
                text-align: center !important;
                margin: 0 0 2rem 0 !important;
                padding: 0.75rem 1.5rem !important;
                line-height: 1.3 !important;
                font-size: 1.25rem !important;
                font-weight: 600 !important;
                min-height: auto !important;
                align-items: unset !important;
                justify-content: unset !important;
                flex: none !important;
                background-color: rgba(1, 118, 211, 0.1) !important;
                border: 1px solid rgba(1, 118, 211, 0.2) !important;
                border-radius: 6px !important;
                position: relative !important;
                top: -0.5rem !important;
                transition: all 0.3s ease !important;
            `);
        });
        
        // Ensure paragraphs have correct spacing
        document.querySelectorAll('.expertise-card p, .value-card p').forEach(p => {
            p.removeAttribute('style');
            p.setAttribute('style', `
                margin: 0 !important;
                padding: 0 !important;
                line-height: 1.5 !important;
                display: block !important;
            `);
        });
        
        // Ensure icons have proper spacing
        document.querySelectorAll('.expertise-icon, .value-icon').forEach(icon => {
            icon.style.marginBottom = '1.5rem !important';
        });
    }
    
    // Apply immediately
    applyCorrectStyling();
    
    // Apply after various delays to catch any delayed scripts
    setTimeout(applyCorrectStyling, 100);
    setTimeout(applyCorrectStyling, 500);
    setTimeout(applyCorrectStyling, 1000);
    setTimeout(applyCorrectStyling, 2000);
    
    // Add hover effects
    function addHoverEffects() {
        document.querySelectorAll('.expertise-card, .value-card').forEach(card => {
            // Remove existing listeners to avoid duplicates
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
            
            // Add new listeners
            card.addEventListener('mouseenter', handleMouseEnter);
            card.addEventListener('mouseleave', handleMouseLeave);
        });
    }
    
    function handleMouseEnter(e) {
        const h3 = e.currentTarget.querySelector('h3');
        if (h3) {
            h3.style.backgroundColor = 'rgba(1, 118, 211, 0.15) !important';
            h3.style.borderColor = 'rgba(1, 118, 211, 0.3) !important';
            h3.style.transform = 'translateY(-2px) !important';
            h3.style.boxShadow = '0 4px 8px rgba(1, 118, 211, 0.2) !important';
        }
    }
    
    function handleMouseLeave(e) {
        const h3 = e.currentTarget.querySelector('h3');
        if (h3) {
            h3.style.backgroundColor = 'rgba(1, 118, 211, 0.1) !important';
            h3.style.borderColor = 'rgba(1, 118, 211, 0.2) !important';
            h3.style.transform = 'translateY(0) !important';
            h3.style.boxShadow = 'none !important';
        }
    }
    
    // Apply hover effects
    addHoverEffects();
    setTimeout(addHoverEffects, 1000);
    
    // Monitor for any changes using MutationObserver
    const observer = new MutationObserver((mutations) => {
        let needsFix = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.matches('.expertise-card h3, .value-card h3, .expertise-card p, .value-card p')) {
                    needsFix = true;
                }
            }
        });
        if (needsFix) {
            // Small delay to let other scripts finish
            setTimeout(applyCorrectStyling, 10);
            setTimeout(addHoverEffects, 20);
        }
    });
    
    // Observe all cards
    document.querySelectorAll('.expertise-card, .value-card').forEach(card => {
        observer.observe(card, { 
            attributes: true, 
            attributeFilter: ['style'],
            subtree: true 
        });
    });
    
    // Fix on scroll (in case slds-enhancements.js triggers on scroll)
    let scrollTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            applyCorrectStyling();
            addHoverEffects();
        }, 100);
    }, { passive: true });
    
    // Fix on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            applyCorrectStyling();
            addHoverEffects();
        }, 100);
    }, { passive: true });
    
    // Add permanent CSS as backup
    const permanentStyles = document.createElement('style');
    permanentStyles.id = 'about-page-permanent-spacing-fix';
    permanentStyles.textContent = `
        /* PERMANENT ABOUT PAGE SPACING FIX */
        /* Force H3 to be block display, not flex, with visible background styling */
        body.about-page .expertise-card h3,
        body.about-page .value-card h3 {
            display: block !important;
            text-align: center !important;
            margin: 0 0 2rem 0 !important;
            padding: 0.75rem 1.5rem !important;
            line-height: 1.3 !important;
            font-size: 1.25rem !important;
            font-weight: 600 !important;
            min-height: auto !important;
            align-items: unset !important;
            justify-content: unset !important;
            background-color: rgba(1, 118, 211, 0.1) !important;
            border: 1px solid rgba(1, 118, 211, 0.2) !important;
            border-radius: 6px !important;
            position: relative !important;
            top: -0.5rem !important;
            transition: all 0.3s ease !important;
        }
        
        /* Hover effect */
        body.about-page .expertise-card:hover h3,
        body.about-page .value-card:hover h3 {
            background-color: rgba(1, 118, 211, 0.15) !important;
            border-color: rgba(1, 118, 211, 0.3) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(1, 118, 211, 0.2) !important;
        }
        
        body.about-page .expertise-card p,
        body.about-page .value-card p {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
            display: block !important;
        }
        
        /* Ensure icons have proper spacing */
        body.about-page .expertise-icon,
        body.about-page .value-icon {
            margin: 0 auto 1.5rem !important;
        }
    `;
    
    // Remove any existing permanent fix and add new one
    document.querySelectorAll('#about-page-permanent-spacing-fix').forEach(el => el.remove());
    document.body.appendChild(permanentStyles);
    
    console.log('About page spacing fix initialized successfully');
})();