// Premium Effects Script for Food-N-Force Website - REFACTORED VERSION
// Phase 3: Converted 39 style manipulations to CSS classes
(function() {
    'use strict';
    
    console.log('Premium effects script loaded (refactored)');
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Enhanced Parallax Controller (CSS-first approach)
    class ParallaxController {
        constructor() {
            console.log('ParallaxController constructor called');
            this.mousePosition = { x: 0, y: 0 };
            this.iridescent = null;
            this.init();
            
            window.parallaxController = this;
        }
        
        init() {
            console.log('ParallaxController init called');
            this.addPageClassToBody();
            this.applyBackgroundFixesCSS(); // Use CSS classes instead of inline styles
            this.checkPageAndCreateElements();
            this.handleScroll();
            this.addNewsletterPopup();
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
        
        applyBackgroundFixesCSS() {
            // CSS-first approach - add classes instead of inline styles
            const isIndexPage = document.body.classList.contains('index-page') || 
                               window.location.pathname === '/' || 
                               window.location.pathname.endsWith('/index.html');
                               
            const isAboutPage = document.body.classList.contains('about-page') || 
                               window.location.pathname.endsWith('/about.html');
            
            const isServicesPage = document.body.classList.contains('services-page') || 
                                  window.location.pathname.endsWith('/services.html');
                                  
            const isResourcesPage = document.body.classList.contains('resources-page') || 
                                   window.location.pathname.endsWith('/resources.html');
            
            if (isIndexPage || isAboutPage || isServicesPage || isResourcesPage) {
                // Add CSS classes instead of inline styles
                const main = document.querySelector('main');
                if (main) {
                    main.classList.add('premium-transparent-main');
                }
                
                // Add CSS classes to elements that need overflow visible
                document.querySelectorAll('body, main, section, .hero-section').forEach(el => {
                    el.classList.add('premium-visible-overflow');
                });
                
                // Apply section background classes
                setTimeout(() => {
                    document.querySelectorAll('section:not(.hero-section)').forEach((section, i) => {
                        if (i % 2 === 0) {
                            section.classList.add('premium-section-dark-even');
                        } else {
                            section.classList.add('premium-section-dark-odd');
                        }
                    });
                }, 100);
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
            
            console.log('Page checks:', { 
                index: isIndexPage, 
                about: isAboutPage, 
                services: isServicesPage,
                resources: isResourcesPage
            });
            
            if (isIndexPage || isAboutPage || isServicesPage || isResourcesPage) {
                console.log('Creating spinning mesh background for page');
                this.createIridescentBackground();
            }
        }
        
        createIridescentBackground() {
            console.log('Creating iridescent spinning lines background');
            console.log('Prefers reduced motion:', prefersReducedMotion);
            if (prefersReducedMotion) {
                console.log('Skipping iridescent background due to reduced motion preference');
                return;
            }
            
            // Check if background already exists
            if (document.querySelector('.iridescent-background')) {
                console.log('Iridescent background already exists, skipping creation');
                return;
            }
            
            // Create the container with CSS classes
            const iridescent = document.createElement('div');
            iridescent.className = 'iridescent-background';
            this.iridescent = iridescent;
            
            // Create first spinner with CSS classes
            const spinner1 = document.createElement('div');
            spinner1.className = 'iridescent-spinner';
            
            const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg1.setAttribute('class', 'iridescent-svg spin-clockwise');
            svg1.setAttribute('viewBox', '-150 -150 300 300');
            
            // Create pattern of small diagonal lines
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
            
            // Create second spinner with CSS classes
            const spinner2 = document.createElement('div');
            spinner2.className = 'iridescent-spinner';
            
            const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg2.setAttribute('class', 'iridescent-svg spin-counter');
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
            
            // Add mask with CSS class
            const maskDiv = document.createElement('div');
            maskDiv.className = 'iridescent-mask';
            
            // Assemble components
            iridescent.appendChild(spinner1);
            iridescent.appendChild(spinner2);
            iridescent.appendChild(maskDiv);
            
            document.documentElement.appendChild(iridescent);
            
            // Ensure keyframes are available - add fallback if needed
            if (!document.querySelector('style[data-iridescent-keyframes]')) {
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
                `;
                document.head.appendChild(keyframesStyle);
                console.log('Added fallback keyframe animations');
            }
            
            console.log('Iridescent background with scattered lines pattern created');
            console.log('Background element classes:', iridescent.className);
            console.log('SVG1 classes:', svg1.getAttribute('class'));
            console.log('SVG2 classes:', svg2.getAttribute('class'));
            console.log('Background appended to:', document.documentElement.tagName);
            console.log('Background element in DOM:', document.querySelector('.iridescent-background') !== null);
            
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
                    const opacity = Math.max(0.3, 1 - (scrollPercentage * 0.6));
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
        
        addNewsletterPopup() {
            const isAboutPage = document.body.classList.contains('about-page') || 
                               window.location.pathname.toLowerCase().includes('about');
            
            if (!isAboutPage) return;
            
            console.log('FNF Signup popup initialized for about page');
            
            let hasTriggered = false;
            
            const checkScroll = () => {
                if (hasTriggered) return;
                
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPosition = window.scrollY;
                const scrollPercentage = (scrollPosition / scrollHeight) * 100;
                
                if (scrollPercentage >= 30) {
                    hasTriggered = true;
                    console.log('30% scroll reached - showing FNF signup popup');
                    
                    setTimeout(() => {
                        this.createSignupModal();
                    }, 100);
                    
                    window.removeEventListener('scroll', checkScroll);
                }
            };
            
            window.addEventListener('scroll', checkScroll);
            
            setTimeout(() => {
                checkScroll();
            }, 500);
        }
        
        createSignupModal() {
            if (document.querySelector('.fnf-signup-overlay')) return;
            
            // Create modal with CSS classes instead of inline styles
            const overlay = document.createElement('div');
            overlay.className = 'fnf-signup-overlay';
            
            const modalBox = document.createElement('div');
            modalBox.className = 'fnf-signup-box';
            
            modalBox.innerHTML = `
                <button class="fnf-close-btn">&times;</button>
                
                <h2 class="fnf-signup-title">Stay Connected!</h2>
                
                <p class="fnf-signup-description">Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
                
                <form class="fnf-email-form">
                    <input 
                        type="email" 
                        placeholder="Enter your email address" 
                        required
                        class="fnf-email-input"
                    >
                    <button 
                        type="submit" 
                        class="slds-button slds-button_brand fnf-submit-btn"
                    >Subscribe Now</button>
                </form>
            `;
            
            overlay.appendChild(modalBox);
            document.body.appendChild(overlay);
            
            // Animate in using CSS classes
            requestAnimationFrame(() => {
                overlay.classList.add('show');
            });
            
            // Close functionality
            const closeModal = () => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 300);
            };
            
            modalBox.querySelector('.fnf-close-btn').addEventListener('click', closeModal);
            
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
                
                modalBox.innerHTML = `
                    <div style="padding: 2rem;">
                        <h2 style="color: #0176d3; margin-bottom: 1rem; font-size: 1.875rem;">Thank You!</h2>
                        <p style="color: #666; font-size: 1.125rem;">You've been successfully subscribed to our newsletter.</p>
                    </div>
                `;
                
                setTimeout(closeModal, 2000);
            });
        }
        
        addScrollProgress() {
            // Check if scroll progress already exists
            if (document.querySelector('.scroll-progress')) {
                console.log('Scroll progress already exists, skipping creation');
                return;
            }
            
            const progress = document.createElement('div');
            progress.className = 'scroll-progress'; // Use CSS class
            
            document.body.appendChild(progress);
            console.log('Scroll progress bar created and added to page');
            
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
                floatingCTA.className = 'floating-cta'; // Use CSS class
                floatingCTA.innerHTML = `
                    <button class="floating-cta-button">
                        <span class="floating-cta-icon">💬</span>
                        <span class="floating-cta-text">Need Help?</span>
                    </button>
                `;
                
                document.body.appendChild(floatingCTA);
                
                floatingCTA.addEventListener('click', () => {
                    window.location.href = '/contact';
                });
            }
        }
    }
    
    // Scroll-triggered animations (CSS-first approach)
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
            
            // Add reveal to various elements using CSS classes
            const revealElements = document.querySelectorAll('.service-card, .focus-area-card, .measurable-card, h2, h3');
            revealElements.forEach(el => {
                el.classList.add('premium-reveal'); // Use CSS class
                observer.observe(el);
            });
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
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry, index) => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                entry.target.classList.add('visible'); // Use CSS class
                            }, index * 100);
                        }
                    });
                }, { threshold: 0.3 });
                
                timelineItems.forEach(item => observer.observe(item));
            }
        }
    }
    
    // Interactive enhancements (CSS-first approach)
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
                button.classList.add('premium-magnetic-button'); // Use CSS class
                
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
                button.classList.add('premium-ripple-container'); // Use CSS class
                
                button.addEventListener('click', (e) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.className = 'premium-ripple'; // Use CSS class
                    ripple.style.left = `${x}px`;
                    ripple.style.top = `${y}px`;
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                    
                    button.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 600);
                });
            });
        }
        
        addTooltips() {
            const elements = document.querySelectorAll('[title]');
            
            elements.forEach(element => {
                const title = element.getAttribute('title');
                element.removeAttribute('title');
                
                const tooltip = document.createElement('div');
                tooltip.className = 'premium-tooltip'; // Use CSS class
                tooltip.textContent = title;
                
                element.addEventListener('mouseenter', (e) => {
                    document.body.appendChild(tooltip);
                    const rect = element.getBoundingClientRect();
                    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                    tooltip.classList.add('show'); // Use CSS class
                });
                
                element.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('show'); // Use CSS class
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
        console.log('Initializing premium effects (refactored)');
        window.parallaxController = new ParallaxController();
        new ScrollAnimations();
        new InteractiveEnhancements();
    }
    
})();