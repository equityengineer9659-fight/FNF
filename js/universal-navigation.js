// universal-navigation.js - Universal navigation for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Add critical styles directly to ensure they apply
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        /* FORCE PROPER FONT SIZES - CRITICAL OVERRIDES */
        .universal-brand-logo,
        h1.universal-brand-logo,
        .brand-logo,
        h1.brand-logo,
        .navbar .brand-logo,
        .custom-nav .brand-logo {
            font-size: 2.5rem !important;
            color: #ffffff !important;
            font-weight: bold !important;
            margin: 0 !important;
            line-height: 1.2 !important;
        }
        
        .universal-nav-link,
        a.universal-nav-link,
        .nav-link,
        a.nav-link,
        .slds-nav-horizontal__item a,
        .navbar .nav-link,
        .custom-nav .slds-nav-horizontal__item a {
            font-size: 18px !important;
            color: #ffffff !important;
            font-weight: bold !important;
            padding: 1rem 1.5rem !important;
        }
        
        /* Ensure proper navbar spacing */
        .navbar.universal-nav,
        .custom-nav {
            padding: 1rem 0 !important;
        }
        
        .navbar.universal-nav .slds-container_fluid,
        .custom-nav .slds-container_fluid {
            padding: 0 2rem !important;
        }
        
        .navbar.universal-nav .slds-p-vertical_small,
        .custom-nav .slds-p-vertical_small {
            padding-top: 0.75rem !important;
            padding-bottom: 0.75rem !important;
        }
        
        .navbar.universal-nav .slds-p-top_small,
        .custom-nav .slds-p-top_small {
            padding-top: 0.75rem !important;
        }
        
        /* Mobile menu button styling */
        .mobile-nav-toggle {
            color: #ffffff !important;
            font-size: 1.5rem !important;
        }
        
        .hamburger-icon {
            color: #ffffff !important;
        }
    `;
    document.head.appendChild(styleTag);
    
    // Create navigation HTML structure matching home page layout
    const navHTML = `
        <nav class="navbar universal-nav custom-nav" role="banner">
            <div class="slds-container_fluid">
                <!-- Top row with logo, centered company name, and navigation -->
                <div class="slds-grid slds-grid_align-spread slds-wrap slds-grid_vertical-align-center slds-p-vertical_small">
                    <!-- Brand Logo - Left -->
                    <div class="slds-col slds-no-flex">
                        <a href="index.html" aria-label="Food-N-Force Home" class="brand-logo-link">
                            <div class="brand-logo-container">
                                <div class="brand-logo-inner">
                                    <span class="brand-logo-text">F-n-F</span>
                                </div>
                            </div>
                        </a>
                    </div>
                    
                    <!-- Centered Company Name -->
                    <div class="slds-col slds-text-align_center company-name-container">
                        <h1 class="brand-logo universal-brand-logo" style="font-size: 2.5rem !important; color: #ffffff !important; font-weight: bold !important; margin: 0 !important; line-height: 1.2 !important;">Food-N-Force</h1>
                    </div>
                    
                    <!-- Mobile Navigation Toggle - Right -->
                    <div class="slds-col slds-no-flex slds-hide slds-show_small">
                        <button 
                            class="mobile-nav-toggle" 
                            aria-label="Toggle navigation menu" 
                            aria-expanded="false"
                            aria-controls="main-nav"
                            style="color: #ffffff !important; font-size: 1.5rem !important;"
                        >
                            <span class="hamburger-icon" style="color: #ffffff !important;">☰</span>
                        </button>
                    </div>
                    
                    <!-- Spacer for desktop -->
                    <div class="slds-col slds-no-flex slds-show slds-hide_small nav-spacer">
                        <!-- Balances the logo -->
                    </div>
                </div>
                
                <!-- Navigation Menu - Centered Below Company Name -->
                <div class="slds-grid slds-grid_align-center slds-p-top_small">
                    <div class="slds-col">
                        <nav class="slds-text-align_center nav-menu-container" role="navigation" aria-label="Main navigation">
                            <ul class="nav-menu slds-nav-horizontal universal-nav-menu" id="main-nav">
                                <li class="slds-nav-horizontal__item">
                                    <a href="index.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">Home</a>
                                </li>
                                <li class="slds-nav-horizontal__item">
                                    <a href="services.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">Services</a>
                                </li>
                                <li class="slds-nav-horizontal__item">
                                    <a href="resources.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">Resources</a>
                                </li>
                                <li class="slds-nav-horizontal__item">
                                    <a href="impact.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">Impact</a>
                                </li>
                                <li class="slds-nav-horizontal__item">
                                    <a href="contact.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">Contact</a>
                                </li>
                                <li class="slds-nav-horizontal__item">
                                    <a href="about.html" class="nav-link universal-nav-link" style="font-size: 18px !important; color: #ffffff !important; font-weight: bold !important; padding: 1rem 1.5rem !important;">About Us</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </nav>
    `;
    
    // Insert navigation at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navHTML);
    
    // Apply additional style fixes after navigation is inserted
    setTimeout(() => {
        // Force apply styles to all nav links
        const navLinks = document.querySelectorAll('.nav-link, .universal-nav-link');
        navLinks.forEach(link => {
            link.style.fontSize = '18px';
            link.style.color = '#ffffff';
            link.style.fontWeight = 'bold';
            link.style.padding = '1rem 1.5rem';
        });
        
        // Force apply styles to brand logo
        const brandLogos = document.querySelectorAll('.brand-logo, .universal-brand-logo');
        brandLogos.forEach(logo => {
            logo.style.fontSize = '2.5rem';
            logo.style.color = '#ffffff';
            logo.style.fontWeight = 'bold';
            logo.style.margin = '0';
            logo.style.lineHeight = '1.2';
        });
    }, 100);
    
    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('show');
            
            // Rotate hamburger icon
            const icon = this.querySelector('.hamburger-icon');
            if (icon) {
                icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(90deg)';
            }
        });
    }
    
    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenuBtn && navMenu) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('.hamburger-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.navbar')) {
            if (mobileMenuBtn && navMenu) {
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('show');
                const icon = mobileMenuBtn.querySelector('.hamburger-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        }
    });
    
    // Add active class to current page link
    const currentPage = window.location.pathname;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Check if we're on the home page
        if ((currentPage === '/' || currentPage === '/index.html' || currentPage.endsWith('/')) && href === 'index.html') {
            link.parentElement.classList.add('slds-is-active');
        }
        // Check other pages
        else if (currentPage.includes(href) && href !== 'index.html') {
            link.parentElement.classList.add('slds-is-active');
        }
    });
    
    // Trigger visibility for service cards (needed for your existing animations)
    setTimeout(() => {
        document.querySelectorAll('.service-card, .focus-area-card, .resource-card').forEach(card => {
            card.classList.add('visible');
        });
    }, 100);
});