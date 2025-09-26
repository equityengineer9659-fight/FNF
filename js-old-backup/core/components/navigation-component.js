/**
 * PHASE 4.1A: ENHANCED NAVIGATION WEB COMPONENT
 * Progressive enhancement for existing mobile navigation
 * Maintains 100% backward compatibility with current HTML-first implementation
 */

class NavigationComponent extends HTMLElement {
  constructor() {
    super();
    this.isInitialized = false;
    this.mobileToggle = null;
    this.navMenu = null;
    this.isMenuOpen = false;
    this.breakpoint = 768; // Mobile breakpoint threshold
  }

  connectedCallback() {
    // Only initialize if not already done
    if (!this.isInitialized) {
      this.initializeEnhancedNavigation();
      this.isInitialized = true;
    }
  }

  initializeEnhancedNavigation() {
    // Find existing navigation elements (HTML-first approach)
    this.mobileToggle = document.querySelector('.mobile-nav-toggle');
    this.navMenu = document.querySelector('.nav-menu');
    
    if (!this.mobileToggle || !this.navMenu) {
      console.warn('NavigationComponent: Required navigation elements not found');
      return;
    }

    // Enhance existing navigation with Web Components functionality
    this.setupEnhancedInteractions();
    this.setupAccessibilityEnhancements();
    this.setupResponsiveHandling();
    this.setupPerformanceOptimizations();
    
    console.log('✅ Navigation Web Component: Enhanced existing navigation');
  }

  setupEnhancedInteractions() {
    // Remove any existing listeners to avoid duplicates
    const existingHandler = this.mobileToggle.onclick;
    this.mobileToggle.onclick = null;

    // Enhanced click handler with better UX
    this.mobileToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.toggleMobileMenu();
    });

    // Enhanced keyboard support
    this.mobileToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMobileMenu();
      }
    });

    // Click outside to close (enhanced UX)
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.navMenu.contains(e.target) && 
          !this.mobileToggle.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMobileMenu();
        this.mobileToggle.focus(); // Return focus
      }
    });
  }

  setupAccessibilityEnhancements() {
    // Enhanced ARIA attributes
    this.mobileToggle.setAttribute('aria-expanded', 'false');
    this.mobileToggle.setAttribute('aria-controls', 'nav-menu');
    this.mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
    
    this.navMenu.setAttribute('id', 'nav-menu');
    this.navMenu.setAttribute('role', 'navigation');
    this.navMenu.setAttribute('aria-label', 'Main navigation');

    // Focus management for better screen reader experience
    const navLinks = this.navMenu.querySelectorAll('a');
    navLinks.forEach((link, index) => {
      link.setAttribute('tabindex', this.isMenuOpen ? '0' : '-1');
    });
  }

  setupResponsiveHandling() {
    // Enhanced responsive behavior
    const mediaQuery = window.matchMedia(`(max-width: ${this.breakpoint}px)`);
    
    const handleBreakpointChange = (e) => {
      if (!e.matches && this.isMenuOpen) {
        // Desktop mode: ensure menu is visible and close mobile state
        this.closeMobileMenu(false); // Don't animate on breakpoint change
      }
      
      // Update navigation visibility based on breakpoint
      this.updateNavigationVisibility(e.matches);
    };

    mediaQuery.addListener(handleBreakpointChange);
    handleBreakpointChange(mediaQuery); // Initial check
  }

  setupPerformanceOptimizations() {
    // Optimize animations for better performance
    this.navMenu.style.willChange = 'transform, opacity';
    
    // Use requestAnimationFrame for smooth animations
    this.animationFrame = null;
    
    // Precompute frequently used values
    this.navMenuHeight = null;
    
    // Debounce resize events
    this.resizeTimeout = null;
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.updateNavigationLayout();
      }, 150);
    });
  }

  toggleMobileMenu() {
    if (this.isMenuOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  openMobileMenu() {
    if (this.isMenuOpen) return;
    
    this.isMenuOpen = true;
    
    // Update ARIA states
    this.mobileToggle.setAttribute('aria-expanded', 'true');
    this.navMenu.setAttribute('aria-hidden', 'false');
    
    // Add active class for CSS styling
    this.mobileToggle.classList.add('active');
    this.navMenu.classList.add('active');
    
    // Enable tab navigation for menu links
    const navLinks = this.navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.setAttribute('tabindex', '0');
    });
    
    // Focus first menu item
    if (navLinks.length > 0) {
      navLinks[0].focus();
    }
    
    // Performance: Use GPU acceleration
    this.navMenu.style.transform = 'translateZ(0)';
    
    console.log('📱 Mobile menu opened');
  }

  closeMobileMenu(animate = true) {
    if (!this.isMenuOpen) return;
    
    this.isMenuOpen = false;
    
    // Update ARIA states
    this.mobileToggle.setAttribute('aria-expanded', 'false');
    this.navMenu.setAttribute('aria-hidden', 'true');
    
    // Remove active classes
    this.mobileToggle.classList.remove('active');
    this.navMenu.classList.remove('active');
    
    // Disable tab navigation for menu links
    const navLinks = this.navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.setAttribute('tabindex', '-1');
    });
    
    // Performance: Remove GPU acceleration when not needed
    if (animate) {
      setTimeout(() => {
        this.navMenu.style.transform = '';
      }, 300); // Match CSS transition duration
    } else {
      this.navMenu.style.transform = '';
    }
    
    console.log('📱 Mobile menu closed');
  }

  updateNavigationVisibility(isMobile) {
    // Ensure proper visibility states based on breakpoint
    if (isMobile) {
      // Mobile: Show toggle, hide menu by default
      this.mobileToggle.style.display = 'block';
      if (!this.isMenuOpen) {
        this.navMenu.classList.remove('active');
      }
    } else {
      // Desktop: Hide toggle, show menu
      this.mobileToggle.style.display = 'none';
      this.navMenu.classList.remove('active');
      this.navMenu.style.transform = '';
      
      // Enable all nav links for desktop
      const navLinks = this.navMenu.querySelectorAll('a');
      navLinks.forEach(link => {
        link.setAttribute('tabindex', '0');
      });
    }
  }

  updateNavigationLayout() {
    // Recalculate layout-dependent values
    if (this.navMenu) {
      this.navMenuHeight = this.navMenu.scrollHeight;
    }
  }

  // Public API for external control
  open() {
    this.openMobileMenu();
  }

  close() {
    this.closeMobileMenu();
  }

  toggle() {
    this.toggleMobileMenu();
  }

  isOpen() {
    return this.isMenuOpen;
  }

  // Cleanup on disconnect
  disconnectedCallback() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Remove enhanced event listeners (HTML-first navigation still works)
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    console.log('🔧 Navigation Web Component: Cleaned up enhanced features');
  }
}

// Register the custom element
if (!customElements.get('navigation-component')) {
  customElements.define('navigation-component', NavigationComponent);
  console.log('🎯 NavigationComponent registered successfully');
}

// Export for module usage
export default NavigationComponent;