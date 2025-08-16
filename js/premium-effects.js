/* ============================================
   Phase 3: Premium Experience Features JavaScript
   ADDS interactions WITHOUT changing content
   Works WITH existing Phase 1 and Phase 2 scripts
   ============================================ */

(function() {
    'use strict';

    // Wait for other scripts to initialize
    const initDelay = 200;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // 1. PARALLAX CONTROLLER
    // ============================================
    
    class ParallaxController {
        constructor() {
            if (prefersReducedMotion) return;
            
            this.elements = [];
            this.init();
        }

        init() {
            // Add parallax class to hero sections
            const heroSections = document.querySelectorAll('.hero-section, .section-padding:first-child');
            heroSections.forEach(section => {
                section.classList.add('parallax-container');
            });

            // Create floating elements - now on both index and services pages
            if (document.body.classList.contains('index-page') || 
                document.body.classList.contains('services-page')) {
                this.createFloatingElements();
            }
            
            // Handle scroll
            this.handleScroll();
        }

        createFloatingElements() {
            // Add subtle floating shapes
            const shapes = ['circle', 'triangle', 'square'];
            const container = document.createElement('div');
            container.className = 'parallax-shapes';
            container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;';
            
            // Different configurations for different pages
            const isServicesPage = document.body.classList.contains('services-page');
            const shapeCount = isServicesPage ? 4 : 3; // More shapes on services page
            
            for (let i = 0; i < shapeCount; i++) {
                const shape = document.createElement('div');
                const shapeType = shapes[i % shapes.length];
                shape.className = `parallax-float shape-${shapeType}`;
                
                // Adjust positioning for services page
                const topPosition = isServicesPage ? (15 + i * 20) : (20 + i * 25);
                const leftPosition = isServicesPage ? (5 + i * 25) : (10 + i * 30);
                
                shape.style.cssText = `
                    position: absolute;
                    width: ${100 + i * 50}px;
                    height: ${100 + i * 50}px;
                    top: ${topPosition}%;
                    left: ${leftPosition}%;
                    opacity: ${isServicesPage ? 0.05 : 0.03};
                    background: linear-gradient(135deg, #0176d3, #0099cc);
                    border-radius: ${shapeType === 'circle' ? '50%' : '10px'};
                    transform: ${shapeType === 'triangle' ? 'rotate(45deg)' : 'none'};
                `;
                container.appendChild(shape);
            }
            
            document.body.appendChild(container);
        }

        handleScroll() {
            let ticking = false;
            
            const updateParallax = () => {
                const scrolled = window.pageYOffset;
                
                document.querySelectorAll('.parallax-float').forEach((el, index) => {
                    const speed = 0.5 + (index * 0.2);
                    el.style.transform = `translateY(${scrolled * speed}px)`;
                });
                
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
        }
    }

    // ============================================
    // 2. ENHANCED INTERACTIONS
    // ============================================
    
    class PremiumInteractions {
        constructor() {
            this.init();
        }

        init() {
            this.addMeshGradients();
            this.enhance3DCards();
            this.addShineEffects();
            this.addDepthShadows();
        }

        addMeshGradients() {
            // Add mesh gradient to sections
            const sections = document.querySelectorAll('.section-gray, .hero-section');
            sections.forEach(section => {
                section.classList.add('mesh-gradient');
            });
        }

        enhance3DCards() {
            // Add 3D tilt to cards
            const cards = document.querySelectorAll('.service-card, .focus-area-card, .resource-card');
            
            cards.forEach(card => {
                card.classList.add('card-3d-tilt');
                
                card.addEventListener('mousemove', (e) => {
                    if (prefersReducedMotion) return;
                    
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                });
            });
        }

        addShineEffects() {
            // Add shine effect to buttons
            const buttons = document.querySelectorAll('.slds-button');
            buttons.forEach(btn => {
                btn.classList.add('shine-hover');
            });
        }

        addDepthShadows() {
            // Add depth shadows to cards on hover
            const cards = document.querySelectorAll('.slds-box, .service-card, .focus-area-card');
            cards.forEach(card => {
                card.classList.add('depth-shadow');
            });
        }
    }

    // ============================================
    // 3. CONVERSION OPTIMIZATION
    // ============================================
    
    class ConversionOptimizer {
        constructor() {
            this.init();
        }

        init() {
            this.createFloatingCTA();
            this.setupExitIntent();
            this.addMagneticButtons();
        }

        createFloatingCTA() {
            // Don't show on contact page
            if (document.body.classList.contains('contact-page')) return;
            
            const floatingCTA = document.createElement('div');
            floatingCTA.className = 'floating-cta';
            floatingCTA.innerHTML = `
                <a href="contact.html" class="floating-cta-button">
                    <span>💬</span>
                    <span>Let's Talk</span>
                </a>
            `;
            
            document.body.appendChild(floatingCTA);
            
            // Show after scrolling
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    floatingCTA.classList.add('visible');
                } else {
                    floatingCTA.classList.remove('visible');
                }
            });
        }

        setupExitIntent() {
            // Only on index page
            if (!document.body.classList.contains('index-page')) return;
            
            const modal = document.createElement('div');
            modal.className = 'exit-modal';
            modal.innerHTML = `
                <div class="exit-modal-content">
                    <button class="exit-modal-close" style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    <h3 style="margin-bottom: 20px;">Wait! Before You Go...</h3>
                    <p style="margin-bottom: 20px;">Get our free guide: "5 Digital Transformation Quick Wins for Food Banks"</p>
                    <form class="exit-modal-form" style="display: flex; gap: 10px;">
                        <input type="email" placeholder="Your email address" required style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <button type="submit" class="slds-button slds-button_brand">Send Guide</button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Exit intent detection
            let exitIntentShown = false;
            document.addEventListener('mouseout', (e) => {
                if (!exitIntentShown && e.clientY <= 0 && e.relatedTarget == null) {
                    exitIntentShown = true;
                    modal.classList.add('active');
                }
            });
            
            // Close modal
            modal.querySelector('.exit-modal-close').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        addMagneticButtons() {
            // Add magnetic effect to CTA buttons
            const ctaButtons = document.querySelectorAll('.slds-button_brand, .magnetic-button');
            
            ctaButtons.forEach(button => {
                button.addEventListener('mousemove', (e) => {
                    if (prefersReducedMotion) return;
                    
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'translate(0, 0)';
                });
            });
        }
    }

    // ============================================
    // 4. PROGRESS ANIMATIONS
    // ============================================
    
    class ProgressAnimator {
        constructor() {
            this.init();
        }

        init() {
            this.createProgressBars();
            this.animateOnScroll();
        }

        createProgressBars() {
            // Convert data attributes to progress bars
            const elements = document.querySelectorAll('[data-progress]');
            
            elements.forEach(el => {
                const progress = el.getAttribute('data-progress');
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.innerHTML = `<div class="progress-fill" style="--progress: ${progress / 100}"></div>`;
                
                el.appendChild(progressBar);
            });
        }

        animateOnScroll() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const progressFills = entry.target.querySelectorAll('.progress-fill');
                        progressFills.forEach(fill => {
                            fill.classList.add('animated');
                        });
                    }
                });
            }, { threshold: 0.5 });
            
            document.querySelectorAll('.progress-bar').forEach(bar => {
                observer.observe(bar);
            });
        }
    }

    // ============================================
    // 5. PREMIUM REVEALS
    // ============================================
    
    class PremiumReveals {
        constructor() {
            this.init();
        }

        init() {
            this.addRevealClasses();
            this.setupObserver();
        }

        addRevealClasses() {
            // Add premium reveal to sections
            const sections = document.querySelectorAll('section h2, section h3');
            sections.forEach(heading => {
                heading.classList.add('premium-reveal');
            });
        }

        setupObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            }, { threshold: 0.2 });
            
            document.querySelectorAll('.premium-reveal').forEach(el => {
                observer.observe(el);
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function initPhase3Enhancements() {
        // Add page class for styling
        document.body.classList.add('phase3-enhanced');
        
        // Initialize all enhancement classes
        new ParallaxController();
        new PremiumInteractions();
        new ConversionOptimizer();
        new ProgressAnimator();
        new PremiumReveals();
        
        // Add page transition
        document.body.classList.add('page-transition-premium');
        
        console.log('Phase 3 premium enhancements initialized');
    }

    // Wait for DOM and other scripts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initPhase3Enhancements, initDelay);
        });
    } else {
        setTimeout(initPhase3Enhancements, initDelay);
    }

})();