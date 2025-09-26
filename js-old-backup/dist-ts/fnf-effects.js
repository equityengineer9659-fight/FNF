/**
 * Food-N-Force Effects Module
 * Consolidated animations, visual effects, and interactions
 * Replaces: animations.js, slds-enhancements.js, premium-effects-refactored.js,
 *           slds-cool-effects.js, premium-background-effects.js
 */
class FoodNForceEffects {
    constructor() {
        this.isInitialized = false;
        this.observers = [];
        this.eventListeners = [];
        this.animations = new Map();
        this.particles = [];
        this.performanceMetrics = {
            fps: 0,
            frameCount: 0,
            lastFrameTime: 0,
            animationFrameId: null
        };
        // Wait for core to be ready
        if (window.fnfCore?.isReady()) {
            this.init();
        }
        else {
            document.addEventListener('fnf:core:ready', () => this.init());
        }
    }
    init() {
        if (this.isInitialized)
            return;
        console.log('🎨 Initializing Food-N-Force Effects...');
        try {
            this.capabilities = window.fnfCore.getCapabilities();
            this.prefersReducedMotion = window.fnfCore.prefersReducedMotion;
            this.setupPerformanceMonitoring();
            this.setupIntersectionObservers();
            this.initializeScrollEffects();
            this.initializeCardEffects();
            this.initializeStatsCounters();
            this.initializeFormAnimations();
            this.initializeButtonEffects();
            this.initializePremiumEffects();
            this.setupEventListeners();
            this.isInitialized = true;
            window.fnfCore.registerModule('effects', this);
            console.log('✅ Food-N-Force Effects initialized successfully');
            // Mark effects as loaded
            document.body.classList.add('fnf-effects-loaded');
        }
        catch (error) {
            console.error('❌ Effects initialization failed:', error);
        }
    }
    setupPerformanceMonitoring() {
        if (!this.capabilities.requestIdleCallback || this.prefersReducedMotion) {
            return;
        }
        let frameCount = 0;
        let lastTime = performance.now();
        const monitorFrame = (currentTime) => {
            frameCount++;
            if (currentTime - lastTime >= 1000) {
                this.performanceMetrics.fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                // Adaptive quality based on performance
                this.adaptiveQuality();
            }
            this.performanceMetrics.animationFrameId = requestAnimationFrame(monitorFrame);
        };
        requestAnimationFrame(monitorFrame);
    }
    adaptiveQuality() {
        if (this.performanceMetrics.fps < 30) {
            // Reduce particle count and animation complexity
            this.reduceEffectsQuality();
            console.warn('🐌 Reduced effects quality due to low FPS:', this.performanceMetrics.fps);
        }
        else if (this.performanceMetrics.fps > 50 && this.particles.length < 15) {
            // Restore quality if performance improves
            this.restoreEffectsQuality();
        }
    }
    reduceEffectsQuality() {
        // Remove half of the particles
        const particlesToRemove = Math.floor(this.particles.length * 0.5);
        for (let i = 0; i < particlesToRemove; i++) {
            const particle = this.particles.pop();
            if (particle?.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }
        // Disable complex animations
        document.body.classList.add('fnf-reduced-quality');
    }
    restoreEffectsQuality() {
        document.body.classList.remove('fnf-reduced-quality');
        // Recreate particles if needed
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && this.particles.length < 10) {
            this.createHeroParticles();
        }
    }
    setupIntersectionObservers() {
        if (!this.capabilities.intersectionObserver) {
            this.showAllElements();
            return;
        }
        // Main animation observer
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        // Stats observer with stricter settings
        this.statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('fnf-counted')) {
                    this.animateStats(entry.target);
                    this.statsObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px'
        });
        this.observers.push(this.animationObserver, this.statsObserver);
    }
    showAllElements() {
        // Fallback for browsers without IntersectionObserver
        const elements = document.querySelectorAll(`
            .focus-area-card, .service-card, .resource-card, 
            .testimonial-card, .value-card, .expertise-card,
            .measurable-card, .stat-item
        `);
        elements.forEach(el => {
            el.classList.add('fnf-visible', 'fnf-animated');
        });
    }
    initializeScrollEffects() {
        // Navigation scroll effect
        this.setupNavigationScrollEffect();
        // Smooth scrolling for anchor links
        this.setupSmoothScrolling();
        // Scroll progress indicator
        this.setupScrollProgress();
        // Parallax effects
        if (!this.prefersReducedMotion) {
            this.setupParallaxEffects();
        }
    }
    setupNavigationScrollEffect() {
        const navbar = document.querySelector('.fnf-navigation, .navbar');
        if (!navbar)
            return;
        let lastScroll = 0;
        let ticking = false;
        const updateNavbar = () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            }
            else {
                navbar.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
            ticking = false;
        };
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(updateNavbar);
                ticking = true;
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.eventListeners.push({ element: window, event: 'scroll', handler: scrollHandler });
    }
    setupSmoothScrolling() {
        const clickHandler = (e) => {
            if (e.target.matches('a[href^="#"]')) {
                const targetId = e.target.getAttribute('href');
                if (targetId === '#')
                    return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: this.prefersReducedMotion ? 'auto' : 'smooth',
                        block: 'start'
                    });
                }
            }
        };
        document.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: document, event: 'click', handler: clickHandler });
    }
    setupScrollProgress() {
        if (document.querySelector('.fnf-scroll-progress'))
            return;
        const progressBar = document.createElement('div');
        progressBar.className = 'fnf-scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #0176d3, #1ab3e8);
            z-index: 9999;
            transition: width 0.1s ease-out;
        `;
        document.body.appendChild(progressBar);
        let ticking = false;
        const updateProgress = () => {
            const scrolled = window.pageYOffset;
            const height = document.documentElement.scrollHeight - window.innerHeight;
            const progress = Math.min((scrolled / height) * 100, 100);
            progressBar.style.width = progress + '%';
            ticking = false;
        };
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(updateProgress);
                ticking = true;
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.eventListeners.push({ element: window, event: 'scroll', handler: scrollHandler });
    }
    setupParallaxEffects() {
        const heroSections = document.querySelectorAll('.hero-section, .hero');
        if (!heroSections.length)
            return;
        const elements = Array.from(heroSections).map(section => ({
            element: section,
            speed: 0.5
        }));
        let ticking = false;
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            elements.forEach(({ element, speed }) => {
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            ticking = false;
        };
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.eventListeners.push({ element: window, event: 'scroll', handler: scrollHandler });
    }
    initializeCardEffects() {
        const cards = document.querySelectorAll(`
            .focus-area-card, .service-card, .resource-card,
            .testimonial-card, .value-card, .expertise-card,
            .measurable-card
        `);
        cards.forEach(card => {
            this.setupCardInteractions(card);
            this.observeCardForAnimation(card);
        });
    }
    setupCardInteractions(card) {
        // Enhanced hover effects
        let hoverTimeout;
        const mouseenterHandler = () => {
            clearTimeout(hoverTimeout);
            card.classList.add('fnf-hovering');
            if (!this.prefersReducedMotion) {
                this.triggerCardGlow(card);
                this.setupMagneticIcon(card);
            }
        };
        const mouseleaveHandler = () => {
            hoverTimeout = setTimeout(() => {
                card.classList.remove('fnf-hovering');
                this.removeCardGlow(card);
                this.resetMagneticIcon(card);
            }, 300);
        };
        const clickHandler = (e) => {
            if (e.target === card || !e.target.matches('a, button')) {
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }
        };
        card.addEventListener('mouseenter', mouseenterHandler);
        card.addEventListener('mouseleave', mouseleaveHandler);
        card.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: card, event: 'mouseenter', handler: mouseenterHandler }, { element: card, event: 'mouseleave', handler: mouseleaveHandler }, { element: card, event: 'click', handler: clickHandler });
        // Card tilt effect for premium experience
        if (!this.prefersReducedMotion) {
            this.setupCardTilt(card);
        }
    }
    setupCardTilt(card) {
        const mousemoveHandler = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        };
        const mouseleaveHandler = () => {
            card.style.transform = '';
        };
        card.addEventListener('mousemove', mousemoveHandler);
        card.addEventListener('mouseleave', mouseleaveHandler);
        this.eventListeners.push({ element: card, event: 'mousemove', handler: mousemoveHandler }, { element: card, event: 'mouseleave', handler: mouseleaveHandler });
    }
    setupMagneticIcon(card) {
        const icon = card.querySelector('.icon-wrapper, .focus-area-icon, .service-icon, .resource-icon, .expertise-icon, .value-icon');
        if (!icon)
            return;
        const mousemoveHandler = (e) => {
            const rect = card.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const iconCenterX = iconRect.left + iconRect.width / 2 - rect.left;
            const iconCenterY = iconRect.top + iconRect.height / 2 - rect.top;
            const deltaX = (x - iconCenterX) / 10;
            const deltaY = (y - iconCenterY) / 10;
            icon.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.1)`;
        };
        card.addEventListener('mousemove', mousemoveHandler);
        this.eventListeners.push({ element: card, event: 'mousemove', handler: mousemoveHandler });
    }
    resetMagneticIcon(card) {
        const icon = card.querySelector('.icon-wrapper, .focus-area-icon, .service-icon, .resource-icon, .expertise-icon, .value-icon');
        if (icon) {
            icon.style.transform = '';
        }
    }
    triggerCardGlow(card) {
        card.classList.add('fnf-premium-glow');
        setTimeout(() => {
            card.classList.remove('fnf-premium-glow');
        }, 2000);
    }
    removeCardGlow(card) {
        card.classList.remove('fnf-premium-glow');
    }
    observeCardForAnimation(card) {
        if (this.animationObserver) {
            card.classList.add('fnf-animate-on-scroll');
            this.animationObserver.observe(card);
        }
    }
    animateElement(element) {
        if (element.classList.contains('fnf-animated'))
            return;
        element.classList.add('fnf-visible', 'fnf-animated');
        // Special handling for different element types
        if (element.classList.contains('stat-item')) {
            this.animateStats(element);
        }
        // Staggered animation for groups
        const siblings = element.parentElement.querySelectorAll('.fnf-animate-on-scroll');
        const index = Array.from(siblings).indexOf(element);
        if (index > 0) {
            element.style.animationDelay = `${index * 100}ms`;
        }
    }
    initializeStatsCounters() {
        // Find all stat elements
        const statElements = document.querySelectorAll(`
            .stat-number[data-target],
            .stat-number[data-count],
            .metric-number
        `);
        statElements.forEach(stat => {
            if (this.statsObserver) {
                this.statsObserver.observe(stat.closest('.stat-item') || stat);
            }
        });
    }
    animateStats(statContainer) {
        if (statContainer.classList.contains('fnf-counted'))
            return;
        statContainer.classList.add('fnf-counted', 'fnf-visible');
        const numberElement = statContainer.querySelector('.stat-number, .metric-number');
        if (!numberElement)
            return;
        this.animateNumber(numberElement);
    }
    animateNumber(element) {
        const text = element.textContent.trim();
        const target = this.extractNumber(text);
        const suffix = this.extractSuffix(text);
        if (target === 0)
            return;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;
        element.classList.add('fnf-counting');
        const timer = setInterval(() => {
            step++;
            current = Math.min(Math.floor(increment * step), target);
            element.textContent = current + suffix;
            if (step >= steps || current >= target) {
                element.textContent = target + suffix;
                element.classList.remove('fnf-counting');
                clearInterval(timer);
            }
        }, duration / steps);
    }
    extractNumber(text) {
        const cleaned = text.replace(/[^0-9]/g, '');
        return parseInt(cleaned) || 0;
    }
    extractSuffix(text) {
        if (text.includes('+'))
            return '+';
        if (text.includes('%'))
            return '%';
        if (text.includes('M'))
            return 'M+';
        if (text.includes('K'))
            return 'K+';
        return '';
    }
    initializeFormAnimations() {
        const formGroups = document.querySelectorAll('.slds-form-element');
        formGroups.forEach(group => {
            const input = group.querySelector('.slds-input, .slds-textarea, .slds-select');
            if (!input)
                return;
            // Floating label effect
            const focusHandler = () => {
                group.classList.add('fnf-focused');
            };
            const blurHandler = () => {
                group.classList.remove('fnf-focused');
                if (input.value) {
                    group.classList.add('fnf-has-value');
                }
                else {
                    group.classList.remove('fnf-has-value');
                }
            };
            input.addEventListener('focus', focusHandler);
            input.addEventListener('blur', blurHandler);
            this.eventListeners.push({ element: input, event: 'focus', handler: focusHandler }, { element: input, event: 'blur', handler: blurHandler });
            // Check initial state
            if (input.value) {
                group.classList.add('fnf-has-value');
            }
        });
    }
    initializeButtonEffects() {
        const buttons = document.querySelectorAll('.slds-button');
        buttons.forEach(button => {
            this.setupRippleEffect(button);
            this.setupMagneticEffect(button);
        });
    }
    setupRippleEffect(button) {
        const clickHandler = (e) => {
            const ripple = document.createElement('span');
            ripple.className = 'fnf-ripple';
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: fnf-ripple 0.6s ease-out;
                pointer-events: none;
            `;
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        };
        button.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: button, event: 'click', handler: clickHandler });
    }
    setupMagneticEffect(button) {
        if (this.prefersReducedMotion || !button.classList.contains('slds-button_brand'))
            return;
        const mousemoveHandler = (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        };
        const mouseleaveHandler = () => {
            button.style.transform = '';
        };
        button.addEventListener('mousemove', mousemoveHandler);
        button.addEventListener('mouseleave', mouseleaveHandler);
        this.eventListeners.push({ element: button, event: 'mousemove', handler: mousemoveHandler }, { element: button, event: 'mouseleave', handler: mouseleaveHandler });
    }
    initializePremiumEffects() {
        // Create hero particles
        this.createHeroParticles();
        // Setup modal/popup effects
        this.setupModalEffects();
        // Setup background effects
        this.setupBackgroundEffects();
    }
    createHeroParticles() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection || this.prefersReducedMotion)
            return;
        // Check if particles already exist
        if (heroSection.querySelector('.fnf-particle-container'))
            return;
        const particleContainer = document.createElement('div');
        particleContainer.className = 'fnf-particle-container';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: -1;
        `;
        heroSection.appendChild(particleContainer);
        // Create particles based on viewport size
        const particleCount = window.innerWidth > 1200 ? 15 : window.innerWidth > 768 ? 10 : 5;
        for (let i = 0; i < particleCount; i++) {
            this.createParticle(particleContainer, i);
        }
    }
    createParticle(container, index) {
        const particle = document.createElement('div');
        particle.className = 'fnf-particle';
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 5;
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: fnf-float ${duration}s ${delay}s infinite ease-in-out;
        `;
        container.appendChild(particle);
        this.particles.push(particle);
    }
    setupModalEffects() {
        // Newsletter popup for about page
        if (document.body.classList.contains('about-page')) {
            this.setupNewsletterPopup();
        }
    }
    setupNewsletterPopup() {
        let hasTriggered = false;
        const checkScroll = () => {
            if (hasTriggered)
                return;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPosition = window.scrollY;
            const scrollPercentage = (scrollPosition / scrollHeight) * 100;
            if (scrollPercentage >= 30) {
                hasTriggered = true;
                setTimeout(() => this.createNewsletterModal(), 100);
                window.removeEventListener('scroll', checkScroll);
            }
        };
        window.addEventListener('scroll', checkScroll, { passive: true });
        this.eventListeners.push({ element: window, event: 'scroll', handler: checkScroll });
        // Also trigger after 30 seconds
        setTimeout(checkScroll, 30000);
    }
    createNewsletterModal() {
        if (document.querySelector('.fnf-newsletter-overlay'))
            return;
        const overlay = document.createElement('div');
        overlay.className = 'fnf-newsletter-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        const modal = document.createElement('div');
        modal.className = 'fnf-newsletter-modal';
        modal.innerHTML = `
            <button class="fnf-close-btn" aria-label="Close newsletter signup">&times;</button>
            <h2>Stay Connected!</h2>
            <p>Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
            <form class="fnf-newsletter-form">
                <input type="email" placeholder="Enter your email address" required>
                <button type="submit" class="slds-button slds-button_brand">Subscribe Now</button>
            </form>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        // Close functionality
        const closeModal = () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        };
        modal.querySelector('.fnf-close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay)
                closeModal();
        });
        // Form submission
        const form = modal.querySelector('.fnf-newsletter-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.querySelector('input').value;
            console.log('Newsletter signup:', email);
            modal.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <h2 style="color: #0176d3; margin-bottom: 1rem;">Thank You!</h2>
                    <p>You've been successfully subscribed to our newsletter.</p>
                </div>
            `;
            setTimeout(closeModal, 2000);
        });
    }
    setupBackgroundEffects() {
        // Setup iridescent background for specific pages
        const shouldShowBackground = document.body.classList.contains('index-page') ||
            document.body.classList.contains('about-page') ||
            document.body.classList.contains('services-page') ||
            document.body.classList.contains('resources-page');
        if (shouldShowBackground && !this.prefersReducedMotion) {
            this.createIridescentBackground();
        }
    }
    createIridescentBackground() {
        if (document.querySelector('.fnf-iridescent-background'))
            return;
        const container = document.createElement('div');
        container.className = 'fnf-iridescent-background';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -10;
            opacity: 0.3;
        `;
        // Create two spinning SVG patterns
        const svg1 = this.createSpinningPattern('spin-clockwise');
        const svg2 = this.createSpinningPattern('spin-counter');
        container.appendChild(svg1);
        container.appendChild(svg2);
        document.documentElement.appendChild(container);
        // Add scroll-based opacity change
        let ticking = false;
        const updateOpacity = () => {
            const scrollPercentage = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            const opacity = Math.max(0.1, 0.3 - (scrollPercentage * 0.2));
            container.style.opacity = opacity;
            ticking = false;
        };
        const scrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(updateOpacity);
                ticking = true;
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        this.eventListeners.push({ element: window, event: 'scroll', handler: scrollHandler });
    }
    createSpinningPattern(animationClass) {
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
        `;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', `fnf-spinning-pattern ${animationClass}`);
        svg.setAttribute('viewBox', '-150 -150 300 300');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
            animation: ${animationClass === 'spin-clockwise' ? 'fnf-spin' : 'fnf-spin-reverse'} 60s linear infinite;
        `;
        // Create pattern of lines
        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 300;
            const y = (Math.random() - 0.5) * 300;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            if (animationClass === 'spin-clockwise') {
                line.setAttribute('x1', x - 1);
                line.setAttribute('y1', y - 1);
                line.setAttribute('x2', x + 1);
                line.setAttribute('y2', y + 1);
            }
            else {
                line.setAttribute('x1', x + 1);
                line.setAttribute('y1', y - 1);
                line.setAttribute('x2', x - 1);
                line.setAttribute('y2', y + 1);
            }
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.03)');
            line.setAttribute('stroke-width', '0.5');
            svg.appendChild(line);
        }
        container.appendChild(svg);
        return container;
    }
    setupEventListeners() {
        // Motion preference changes
        const motionHandler = (e) => {
            document.addEventListener('fnf:motion:changed', (e) => {
                this.prefersReducedMotion = e.detail.prefersReducedMotion;
                if (this.prefersReducedMotion) {
                    this.disableMotionEffects();
                }
                else {
                    this.enableMotionEffects();
                }
            });
        };
        // Visibility changes
        document.addEventListener('fnf:visibility:changed', (e) => {
            if (e.detail.hidden) {
                this.pauseAnimations();
            }
            else {
                this.resumeAnimations();
            }
        });
        // Resize handling
        let resizeTimeout;
        const resizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push({ element: window, event: 'resize', handler: resizeHandler });
    }
    disableMotionEffects() {
        document.body.classList.add('fnf-reduced-motion');
        // Remove particles
        this.particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        this.particles = [];
        // Remove background effects
        const background = document.querySelector('.fnf-iridescent-background');
        if (background) {
            background.remove();
        }
    }
    enableMotionEffects() {
        document.body.classList.remove('fnf-reduced-motion');
        this.createHeroParticles();
        this.setupBackgroundEffects();
    }
    pauseAnimations() {
        if (this.performanceMetrics.animationFrameId) {
            cancelAnimationFrame(this.performanceMetrics.animationFrameId);
        }
    }
    resumeAnimations() {
        if (!this.prefersReducedMotion) {
            this.setupPerformanceMonitoring();
        }
    }
    handleResize() {
        // Recreate particles for new viewport
        const particleContainer = document.querySelector('.fnf-particle-container');
        if (particleContainer) {
            this.particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
            this.particles = [];
            const particleCount = window.innerWidth > 1200 ? 15 : window.innerWidth > 768 ? 10 : 5;
            for (let i = 0; i < particleCount; i++) {
                this.createParticle(particleContainer, i);
            }
        }
    }
    // Public API
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    forceAnimateElement(element) {
        this.animateElement(element);
    }
    // Cleanup method
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler, capture }) => {
            element.removeEventListener(event, handler, capture);
        });
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        // Remove particles
        this.particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        // Cancel animation frame
        if (this.performanceMetrics.animationFrameId) {
            cancelAnimationFrame(this.performanceMetrics.animationFrameId);
        }
        // Remove created elements
        const elementsToRemove = [
            '.fnf-scroll-progress',
            '.fnf-particle-container',
            '.fnf-iridescent-background',
            '.fnf-newsletter-overlay'
        ];
        elementsToRemove.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.remove();
            }
        });
        this.isInitialized = false;
        console.log('🧹 Food-N-Force Effects cleaned up');
    }
}
// Initialize effects
const initEffects = () => {
    if (!window.fnfEffects) {
        window.fnfEffects = new FoodNForceEffects();
    }
};
// Initialize when core is ready or immediately if core already exists
if (window.fnfCore?.isReady()) {
    initEffects();
}
else {
    document.addEventListener('fnf:core:ready', initEffects);
}
// Fallback initialization after a delay
setTimeout(() => {
    if (!window.fnfEffects) {
        initEffects();
    }
}, 2000);
// Export for module usage
window.FoodNForceEffects = FoodNForceEffects;
//# sourceMappingURL=fnf-effects.js.map