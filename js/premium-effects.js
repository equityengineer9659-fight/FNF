// Premium Effects Script for Food-N-Force Website - NO FLOATING SHAPES VERSION
(function() {
    'use strict';
    
    console.log('Premium effects script loaded');
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Enhanced Parallax Controller (Now only handles spinning mesh)
    class ParallaxController {
        constructor() {
            console.log('ParallaxController constructor called');
            this.mousePosition = { x: 0, y: 0 };
            this.iridescent = null; // Store reference for scroll opacity
            this.init();
            
            // Store instance globally for debugging
            window.parallaxController = this;
        }
        
        init() {
            console.log('ParallaxController init called');
            this.addPageClassToBody();
            this.applyBackgroundFixes(); // Apply fixes BEFORE creating elements
            this.checkPageAndCreateElements();
            this.handleScroll();
            // Disable exit intent to prevent conflicts
            // this.addExitIntent(); 
            this.addNewsletterPopup(); // Newsletter popup for about page only
            this.addScrollProgress();
            this.addFloatingCTA();
            this.fixTransparentText();
        }
        
        addPageClassToBody() {
            const path = window.location.pathname;
            const pageName = path.split('/').pop().replace('.html', '') || 'index';
            document.body.classList.add(`${pageName}-page`);
            console.log('Body classes at construction:', document.body.className);
        }
        
        applyBackgroundFixes() {
            // CRITICAL: Apply all the fixes we discovered
            const isIndexPage = document.body.classList.contains('index-page') || 
                               window.location.pathname === '/' || 
                               window.location.pathname.endsWith('/index.html');
                               
            const isAboutPage = document.body.classList.contains('about-page') || 
                               window.location.pathname.endsWith('/about.html');
            
            const isServicesPage = document.body.classList.contains('services-page') || 
                                  window.location.pathname.endsWith('/services.html');
                                  
            const isResourcesPage = document.body.classList.contains('resources-page') || 
                                   window.location.pathname.endsWith('/resources.html');
            
            // UPDATED: Apply to index, about, services, and resources pages
            if (isIndexPage || isAboutPage || isServicesPage || isResourcesPage) {
                // Set body to transparent
                document.body.style.setProperty('background-color', 'transparent', 'important');
                
                // Set dark background on html element
                document.documentElement.style.setProperty('background-color', '#0a0a0a', 'important');
                
                // Make main transparent if it exists
                const main = document.querySelector('main');
                if (main) {
                    main.style.setProperty('background-color', 'transparent', 'important');
                }
                
                // Fix overflow on all containers
                document.querySelectorAll('body, main, section, .hero-section').forEach(el => {
                    el.style.setProperty('overflow', 'visible', 'important');
                });
                
                // Make sections semi-transparent
                setTimeout(() => {
                    document.querySelectorAll('section:not(.hero-section)').forEach((section, i) => {
                        if (i % 2 === 0) {
                            section.style.setProperty('background-color', 'rgba(10, 10, 10, 0.92)', 'important');
                        } else {
                            section.style.setProperty('background-color', 'rgba(26, 26, 26, 0.92)', 'important');
                        }
                    });
                }, 100);
                
                // Add CSS override to ensure body stays transparent
                const styleOverride = document.createElement('style');
                styleOverride.textContent = `
                    body.index-page,
                    body.about-page,
                    body.services-page,
                    body.resources-page {
                        background-color: transparent !important;
                    }
                    
                    /* Ensure sections are semi-transparent */
                    .index-page section:not(.hero-section),
                    .about-page section:not(.hero-section),
                    .services-page section:not(.hero-section),
                    .resources-page section:not(.hero-section) {
                        background-color: rgba(10, 10, 10, 0.92) !important;
                    }
                    
                    .index-page section:nth-of-type(even):not(.hero-section),
                    .about-page section:nth-of-type(even):not(.hero-section),
                    .services-page section:nth-of-type(even):not(.hero-section),
                    .resources-page section:nth-of-type(even):not(.hero-section) {
                        background-color: rgba(26, 26, 26, 0.92) !important;
                    }
                `;
                document.head.appendChild(styleOverride);
            }
        }
        
        checkPageAndCreateElements() {
            const bodyClasses = document.body.className;
            console.log('Body classes:', bodyClasses);
            
            // Check which page we're on
            const isIndexPage = bodyClasses.includes('index-page') || 
                               window.location.pathname === '/' || 
                               window.location.pathname.endsWith('/index.html') ||
                               window.location.pathname.endsWith('/index');
                               
            const isAboutPage = bodyClasses.includes('about-page') || 
                               window.location.pathname.endsWith('/about.html') ||
                               window.location.pathname.endsWith('/about');
                               
            const isServicesPage = bodyClasses.includes('services-page') || 
                                  window.location.pathname.endsWith('/services.html') ||
                                  window.location.pathname.endsWith('/services');
                                  
            const isResourcesPage = bodyClasses.includes('resources-page') || 
                                   window.location.pathname.endsWith('/resources.html') ||
                                   window.location.pathname.endsWith('/resources');
                                  
            const isContactPage = bodyClasses.includes('contact-page') || 
                                 window.location.pathname.endsWith('/contact.html') ||
                                 window.location.pathname.endsWith('/contact');
            
            console.log('Page checks:', { 
                index: isIndexPage, 
                about: isAboutPage, 
                services: isServicesPage,
                resources: isResourcesPage,
                contact: isContactPage 
            });
            
            // UPDATED: Create spinning mesh for specific pages, NO floating elements anywhere
            if (isIndexPage || isAboutPage || isServicesPage || isResourcesPage) {
                console.log('Creating spinning mesh background for page');
                this.createIridescentBackground(); // Create fine mesh spinning effect
            }
            // NO floating elements on ANY page including contact
        }
        
        createIridescentBackground() {
            console.log('Creating iridescent spinning lines background');
            if (prefersReducedMotion) return;
            
            // Create the container
            const iridescent = document.createElement('div');
            iridescent.className = 'iridescent-background';
            iridescent.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
                overflow: hidden;
                opacity: 1;
                transition: opacity 0.3s ease;
            `;
            
            // Store reference for scroll opacity
            this.iridescent = iridescent;
            
            // Create first spinner with scattered small lines (matching original pattern)
            const spinner1 = document.createElement('div');
            spinner1.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 300vmax;
                height: 300vmax;
                transform: translate(-50%, -50%);
            `;
            
            // Create SVG for spinner 1
            const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg1.style.cssText = `
                width: 100%;
                height: 100%;
                animation: spin 60s linear infinite;
            `;
            svg1.setAttribute('viewBox', '-150 -150 300 300');
            
            // Create pattern of small diagonal lines (like the original x1="1", y1="1", x2="-1", y2="-1")
            for (let i = 0; i < 300; i++) {
                const x = (Math.random() - 0.5) * 300;
                const y = (Math.random() - 0.5) * 300;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x - 1);
                line.setAttribute('y1', y - 1);
                line.setAttribute('x2', x + 1);
                line.setAttribute('y2', y + 1);
                line.setAttribute('stroke', 'rgba(255, 255, 255, 0.04)');
                line.setAttribute('stroke-width', '0.5');
                svg1.appendChild(line);
            }
            
            // Add some longer lines for structure
            for (let i = -150; i <= 150; i += 15) {
                if (Math.random() > 0.5) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', i);
                    line.setAttribute('y1', '-150');
                    line.setAttribute('x2', i);
                    line.setAttribute('y2', '150');
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.02)');
                    line.setAttribute('stroke-width', '0.25');
                    svg1.appendChild(line);
                }
            }
            
            spinner1.appendChild(svg1);
            
            // Create second spinner
            const spinner2 = document.createElement('div');
            spinner2.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 300vmax;
                height: 300vmax;
                transform: translate(-50%, -50%);
            `;
            
            // Create SVG for spinner 2
            const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg2.style.cssText = `
                width: 100%;
                height: 100%;
                animation: spinReverse 80s linear infinite;
            `;
            svg2.setAttribute('viewBox', '-150 -150 300 300');
            
            // Create different pattern for spinner 2
            for (let i = 0; i < 300; i++) {
                const x = (Math.random() - 0.5) * 300;
                const y = (Math.random() - 0.5) * 300;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x + 1);
                line.setAttribute('y1', y - 1);
                line.setAttribute('x2', x - 1);
                line.setAttribute('y2', y + 1);
                line.setAttribute('stroke', 'rgba(255, 255, 255, 0.035)');
                line.setAttribute('stroke-width', '0.5');
                svg2.appendChild(line);
            }
            
            // Add some horizontal lines for structure
            for (let i = -150; i <= 150; i += 15) {
                if (Math.random() > 0.5) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', '-150');
                    line.setAttribute('y1', i);
                    line.setAttribute('x2', '150');
                    line.setAttribute('y2', i);
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.02)');
                    line.setAttribute('stroke-width', '0.25');
                    svg2.appendChild(line);
                }
            }
            
            spinner2.appendChild(svg2);
            
            // Add both spinners to container
            iridescent.appendChild(spinner1);
            iridescent.appendChild(spinner2);
            
            // Add subtle radial fade mask
            const maskDiv = document.createElement('div');
            maskDiv.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(
                    circle at center,
                    transparent 0%,
                    transparent 50%,
                    rgba(10, 10, 10, 0.05) 80%,
                    rgba(10, 10, 10, 0.2) 100%
                );
                pointer-events: none;
            `;
            iridescent.appendChild(maskDiv);
            
            // Attach to documentElement
            document.documentElement.appendChild(iridescent);
            
            // Add the spin animations if they don't exist
            if (!document.querySelector('style[data-spin-animation]')) {
                const style = document.createElement('style');
                style.setAttribute('data-spin-animation', 'true');
                style.textContent = `
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes spinReverse {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(-360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Also disable the competing hero gradient animation
            const disableGradient = document.createElement('style');
            disableGradient.textContent = '.hero-section::before { animation: none !important; }';
            document.head.appendChild(disableGradient);
            
            console.log('Iridescent background with scattered lines pattern created');
        }
        
        fixTransparentText() {
            // Fix transparent text issue
            const allText = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li');
            allText.forEach(element => {
                if (element.textContent.trim()) {
                    const computed = window.getComputedStyle(element);
                    if (computed.color === 'transparent' || 
                        computed.color === 'rgba(0, 0, 0, 0)' || 
                        parseFloat(computed.opacity) < 0.1) {
                        
                        element.style.setProperty('color', 'white', 'important');
                        element.style.setProperty('opacity', '1', 'important');
                    }
                }
            });
        }
        
        handleScroll() {
            if (prefersReducedMotion) return;
            
            let ticking = false;
            
            const updateParallax = () => {
                const scrollY = window.scrollY;
                
                // Update iridescent background opacity based on scroll
                if (this.iridescent) {
                    const scrollPercentage = scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                    const opacity = Math.max(0.3, 1 - (scrollPercentage * 0.6)); // Fade from 1 to 0.3
                    this.iridescent.style.opacity = opacity;
                }
                
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
        }
        
        // NEW: Clean newsletter popup implementation
        addNewsletterPopup() {
            // Only run on about page
            const isAboutPage = document.body.classList.contains('about-page') || 
                               window.location.pathname.toLowerCase().includes('about');
            
            if (!isAboutPage) return;
            
            console.log('FNF Signup popup initialized for about page');
            
            // Set up scroll trigger
            let hasTriggered = false;
            
            const checkScroll = () => {
                if (hasTriggered) return;
                
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPosition = window.scrollY;
                const scrollPercentage = (scrollPosition / scrollHeight) * 100;
                
                // Trigger at 30% scroll
                if (scrollPercentage >= 30) {
                    hasTriggered = true;
                    console.log('30% scroll reached - showing FNF signup popup');
                    
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                        this.createSignupModal();
                    }, 100);
                    
                    // Remove scroll listener after triggering
                    window.removeEventListener('scroll', checkScroll);
                }
            };
            
            // Add scroll listener
            window.addEventListener('scroll', checkScroll);
            
            // Also check immediately in case user is already scrolled down (e.g., refreshed page)
            setTimeout(() => {
                checkScroll();
            }, 500);
        }
        
        createSignupModal() {
            // Check if modal already exists
            if (document.querySelector('.fnf-signup-overlay')) return;
            
            // Create modal with unique class names to avoid conflicts
            const overlay = document.createElement('div');
            overlay.className = 'fnf-signup-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            const modalBox = document.createElement('div');
            modalBox.className = 'fnf-signup-box';
            modalBox.style.cssText = `
                background: white;
                padding: 3rem;
                border-radius: 12px;
                max-width: 450px;
                width: 90%;
                text-align: center;
                position: relative;
                transform: translateY(-30px);
                transition: transform 0.3s ease;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            `;
            
            modalBox.innerHTML = `
                <button class="fnf-close-btn" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 30px;
                    cursor: pointer;
                    color: #999;
                    padding: 5px;
                    line-height: 1;
                    transition: color 0.2s;
                ">&times;</button>
                
                <h2 style="
                    color: #333;
                    margin-bottom: 1rem;
                    font-size: 1.875rem;
                    font-weight: 600;
                ">Stay Connected!</h2>
                
                <p style="
                    color: #666;
                    margin-bottom: 1.75rem;
                    font-size: 1.125rem;
                    line-height: 1.5;
                ">Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
                
                <form class="fnf-email-form" style="margin-top: 1.5rem;">
                    <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        required
                        class="fnf-email-input"
                        style="
                            width: 100%;
                            padding: 1rem;
                            margin-bottom: 1rem;
                            border: 2px solid #e5e5e5;
                            border-radius: 6px;
                            font-size: 1rem;
                            box-sizing: border-box;
                            transition: border-color 0.3s;
                        "
                    >
                    <button 
                        type="submit" 
                        class="slds-button slds-button_brand fnf-submit-btn"
                        style="
                            width: 100%;
                            padding: 1rem;
                            font-size: 1.05rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                        "
                    >Subscribe Now</button>
                </form>
            `;
            
            // Add hover styles
            const hoverStyles = document.createElement('style');
            hoverStyles.textContent = `
                .fnf-close-btn:hover {
                    color: #333 !important;
                }
                
                .fnf-email-input:focus {
                    outline: none;
                    border-color: #0176d3 !important;
                    box-shadow: 0 0 0 3px rgba(1, 118, 211, 0.1);
                }
                
                .fnf-submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(1, 118, 211, 0.3);
                }
            `;
            
            document.head.appendChild(hoverStyles);
            overlay.appendChild(modalBox);
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                modalBox.style.transform = 'translateY(0)';
            });
            
            // Close functionality
            const closeModal = () => {
                overlay.style.opacity = '0';
                modalBox.style.transform = 'translateY(-30px)';
                
                setTimeout(() => {
                    overlay.remove();
                    hoverStyles.remove();
                }, 300);
            };
            
            // Close button
            modalBox.querySelector('.fnf-close-btn').addEventListener('click', closeModal);
            
            // Click outside to close
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                }
            });
            
            // Form submission
            const form = modalBox.querySelector('.fnf-email-form');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = form.querySelector('.fnf-email-input').value;
                console.log('Newsletter signup:', email);
                
                // Show success message
                modalBox.innerHTML = `
                    <div style="padding: 2rem;">
                        <h2 style="color: #0176d3; margin-bottom: 1rem; font-size: 1.875rem;">Thank You!</h2>
                        <p style="color: #666; font-size: 1.125rem;">You've been successfully subscribed to our newsletter.</p>
                    </div>
                `;
                
                // Auto close after 2 seconds
                setTimeout(closeModal, 2000);
            });
        }
        
        addScrollProgress() {
            const progress = document.createElement('div');
            progress.className = 'scroll-progress';
            progress.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 3px;
                background: linear-gradient(to right, #0176d3, #0099cc);
                z-index: 50;
                transition: width 0.1s;
            `;
            
            document.body.appendChild(progress);
            
            window.addEventListener('scroll', () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPosition = window.scrollY;
                const scrollPercentage = (scrollPosition / scrollHeight) * 100;
                progress.style.width = `${scrollPercentage}%`;
            });
        }
        
        addFloatingCTA() {
            const pages = ['services', 'resources', 'impact'];
            const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
            
            if (pages.includes(currentPage)) {
                const floatingCTA = document.createElement('div');
                floatingCTA.className = 'floating-cta';
                floatingCTA.innerHTML = `
                    <button class="floating-cta-button">
                        <span class="floating-cta-icon">💬</span>
                        <span class="floating-cta-text">Need Help?</span>
                    </button>
                `;
                
                const style = document.createElement('style');
                style.textContent = `
                    .floating-cta {
                        position: fixed;
                        bottom: 30px;
                        right: 30px;
                        z-index: 1000;
                        animation: floatCTA 3s ease-in-out infinite;
                    }
                    
                    @keyframes floatCTA {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    .floating-cta-button {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 15px 25px;
                        background: linear-gradient(135deg, #0176d3, #0099cc);
                        color: white;
                        border: none;
                        border-radius: 50px;
                        cursor: pointer;
                        box-shadow: 0 5px 20px rgba(1, 118, 211, 0.3);
                        transition: all 0.3s;
                        font-size: 16px;
                        font-weight: 500;
                    }
                    
                    .floating-cta-button:hover {
                        transform: scale(1.05);
                        box-shadow: 0 8px 30px rgba(1, 118, 211, 0.4);
                    }
                    
                    .floating-cta-icon {
                        font-size: 20px;
                    }
                    
                    @media (max-width: 768px) {
                        .floating-cta-text {
                            display: none;
                        }
                        
                        .floating-cta-button {
                            width: 60px;
                            height: 60px;
                            padding: 0;
                            justify-content: center;
                        }
                    }
                `;
                
                document.head.appendChild(style);
                document.body.appendChild(floatingCTA);
                
                floatingCTA.addEventListener('click', () => {
                    window.location.href = '/contact';
                });
            }
        }
    }
    
    // Scroll-triggered animations
    class ScrollAnimations {
        constructor() {
            this.init();
        }
        
        init() {
            this.addScrollReveal();
            this.addCounterAnimations();
            this.addTimelineAnimation();
        }
        
        addScrollReveal() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Add reveal to various elements
            const revealElements = document.querySelectorAll('.service-card, .focus-area-card, .metric-card, h2, h3');
            revealElements.forEach(el => {
                el.classList.add('premium-reveal');
                observer.observe(el);
            });
            
            // Add CSS for reveal
            const style = document.createElement('style');
            style.textContent = `
                .premium-reveal {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: opacity 0.6s, transform 0.6s;
                }
                
                .premium-reveal.revealed {
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
        
        addCounterAnimations() {
            const counters = document.querySelectorAll('.metric-number');
            
            const animateCounter = (counter) => {
                const target = parseInt(counter.textContent);
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            counters.forEach(counter => observer.observe(counter));
        }
        
        addTimelineAnimation() {
            const timelineItems = document.querySelectorAll('.timeline-item');
            
            if (timelineItems.length > 0) {
                const style = document.createElement('style');
                style.textContent = `
                    .timeline-item {
                        position: relative;
                        opacity: 0;
                        transform: translateX(-50px);
                        transition: all 0.6s;
                    }
                    
                    .timeline-item.visible {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    
                    .timeline-item::before {
                        content: '';
                        position: absolute;
                        left: -20px;
                        top: 50%;
                        width: 10px;
                        height: 10px;
                        background: #0176d3;
                        border-radius: 50%;
                        transform: translateY(-50%);
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    
                    .timeline-item.visible::before {
                        opacity: 1;
                    }
                `;
                document.head.appendChild(style);
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry, index) => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                entry.target.classList.add('visible');
                            }, index * 100);
                        }
                    });
                }, { threshold: 0.3 });
                
                timelineItems.forEach(item => observer.observe(item));
            }
        }
    }
    
    // Interactive enhancements
    class InteractiveEnhancements {
        constructor() {
            this.init();
        }
        
        init() {
            this.addMagneticButtons();
            this.addRippleEffect();
            this.addTooltips();
        }
        
        addMagneticButtons() {
            const buttons = document.querySelectorAll('.slds-button_brand, .hero-cta');
            
            buttons.forEach(button => {
                button.addEventListener('mousemove', (e) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'translate(0, 0)';
                });
            });
        }
        
        addRippleEffect() {
            const buttons = document.querySelectorAll('.slds-button');
            
            buttons.forEach(button => {
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                
                button.addEventListener('click', (e) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.style.cssText = `
                        position: absolute;
                        left: ${x}px;
                        top: ${y}px;
                        width: 0;
                        height: 0;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.5);
                        transform: translate(-50%, -50%);
                        animation: ripple 0.6s ease-out;
                    `;
                    
                    button.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });
            });
            
            // Add ripple animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        width: 200px;
                        height: 200px;
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        addTooltips() {
            const elements = document.querySelectorAll('[title]');
            
            elements.forEach(element => {
                const title = element.getAttribute('title');
                element.removeAttribute('title');
                
                const tooltip = document.createElement('div');
                tooltip.className = 'premium-tooltip';
                tooltip.textContent = title;
                tooltip.style.cssText = `
                    position: absolute;
                    background: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    font-size: 14px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s;
                    z-index: 1000;
                `;
                
                element.addEventListener('mouseenter', (e) => {
                    document.body.appendChild(tooltip);
                    const rect = element.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                    tooltip.style.opacity = '1';
                });
                
                element.addEventListener('mouseleave', () => {
                    tooltip.style.opacity = '0';
                    setTimeout(() => tooltip.remove(), 300);
                });
            });
        }
    }
    
    // Initialize all premium effects
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPremiumEffects);
    } else {
        initPremiumEffects();
    }
    
    function initPremiumEffects() {
        console.log('Initializing premium effects');
        // Store ParallaxController instance globally for debugging
        window.parallaxController = new ParallaxController();
        new ScrollAnimations();
        new InteractiveEnhancements();
        
        // Add combined card header and expertise section styles
        const combinedCardStyles = document.createElement('style');
        combinedCardStyles.textContent = `
            /* Card Header Styles with Hover Effects */
            /* Apply to ALL card headers globally with enhanced spacing */
            
            /* Target all headers within card-like containers */
            [class*="card"] h3,
            [class*="box"] h3,
            .value-card h3,
            .service-card h3,
            .focus-area-card h3,
            .resource-card h3,
            .featured-box h3,
            .testimonial-card h3,
            .expertise-card h3 {
                background: rgba(1, 118, 211, 0.1) !important;
                border: 1px solid rgba(1, 118, 211, 0.2) !important;
                border-radius: 8px !important;
                padding: 16px 24px !important; /* Increased padding for better effect visibility */
                margin-bottom: 1.5rem !important; /* More spacing below headers */
                margin-top: 0.5rem !important; /* Add top margin for hover effect space */
                color: #fff !important; /* White text for dark backgrounds */
                font-size: 1.25rem !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                display: block !important;
                text-align: center !important;
                position: relative !important;
                transform: translateY(0) !important;
                cursor: pointer !important;
            }
            
            /* Hover effect - headers jump up with enhanced visibility */
            [class*="card"]:hover h3,
            [class*="box"]:hover h3,
            .value-card:hover h3,
            .service-card:hover h3,
            .focus-area-card:hover h3,
            .resource-card:hover h3,
            .featured-box:hover h3,
            .testimonial-card:hover h3,
            .expertise-card:hover h3 {
                background-color: rgba(1, 118, 211, 0.2) !important;
                border-color: rgba(1, 118, 211, 0.4) !important;
                transform: translateY(-6px) !important; /* More dramatic upward movement */
                box-shadow: 0 8px 16px rgba(1, 118, 211, 0.3) !important;
            }
            
            /* Direct h3 hover for better responsiveness */
            [class*="card"] h3:hover,
            [class*="box"] h3:hover {
                background-color: rgba(1, 118, 211, 0.2) !important;
                border-color: rgba(1, 118, 211, 0.4) !important;
                transform: translateY(-6px) !important;
                box-shadow: 0 8px 16px rgba(1, 118, 211, 0.3) !important;
            }
            
            /* Ensure smooth transition back */
            [class*="card"] h3:active,
            [class*="box"] h3:active {
                transform: translateY(-2px) !important;
            }
            
            /* ============================================ */
            /* Expertise Section Equal Height Columns and Header Styling */
            /* ============================================ */
            
            /* Target the actual SLDS grid structure for expertise section */
            .section-gray .slds-grid {
                display: flex !important;
                align-items: stretch !important;
                gap: 2rem !important;
            }
            
            /* Individual expertise columns - equal height and centered */
            .section-gray .slds-grid > .slds-col {
                display: flex !important;
                flex-direction: column !important;
                flex: 1 1 0 !important;
                min-width: 0 !important; /* Prevent overflow */
                padding: 0 1rem !important;
            }
            
            /* Expertise section headers - matching global card header style */
            .section-gray h3.slds-text-heading_medium {
                background: rgba(1, 118, 211, 0.1) !important;
                border: 1px solid rgba(1, 118, 211, 0.2) !important;
                border-radius: 8px !important;
                padding: 16px 24px !important;
                margin-bottom: 1.5rem !important;
                margin-top: 0.5rem !important;
                color: #fff !important; /* White text for dark background */
                font-size: 1.25rem !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                display: block !important;
                text-align: center !important;
                position: relative !important;
                transform: translateY(0) !important;
                cursor: pointer !important;
            }
            
            /* Hover effect for expertise headers */
            .section-gray .slds-col:hover h3 {
                background-color: rgba(1, 118, 211, 0.2) !important;
                border-color: rgba(1, 118, 211, 0.4) !important;
                transform: translateY(-6px) !important;
                box-shadow: 0 8px 16px rgba(1, 118, 211, 0.3) !important;
            }
            
            /* List styling within expertise sections - NO BULLETS */
            .expertise-list {
                list-style: none !important;
                padding: 0 !important;
                margin: 0 !important;
                flex-grow: 1 !important; /* Make lists fill available space */
            }
            
            .expertise-list li {
                padding: 0.5rem 0 !important;
                line-height: 1.5 !important;
                color: rgba(255, 255, 255, 0.9) !important; /* Light text for dark background */
                margin: 0 !important;
                list-style: none !important;
                position: relative !important;
                padding-left: 0 !important; /* No indent */
            }
            
            /* Remove any pseudo-elements that might add bullets */
            .expertise-list li::before {
                display: none !important;
                content: none !important;
            }
            
            /* Ensure proper vertical alignment */
            .section-gray .slds-container_large {
                padding: 3rem 1rem !important;
            }
            
            /* Force equal height columns */
            .section-gray .slds-grid {
                min-height: 400px !important; /* Minimum height to ensure alignment */
            }
            
            /* Center the content within columns */
            .section-gray .slds-col > * {
                width: 100% !important;
            }
            
            /* Responsive behavior */
            @media (max-width: 768px) {
                .section-gray .slds-grid {
                    flex-direction: column !important;
                    min-height: auto !important;
                }
                
                .section-gray .slds-col {
                    margin-bottom: 2rem !important;
                }
            }
        `;
        document.head.appendChild(combinedCardStyles);
    }
    
})();