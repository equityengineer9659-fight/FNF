/**
 * Smart Scroll System
 * Provides intelligent scroll behavior including:
 * - Navigation auto-hide/show on scroll
 * - Active section highlighting
 * - Smooth scrolling between sections
 * - Scroll-to-top functionality
 */

class SmartScroll {
  constructor(options = {}) {
    this.config = {
      hideOnScroll: options.hideOnScroll !== false, // Default true
      scrollThreshold: options.scrollThreshold || 100,
      navSelector: options.navSelector || '.fnf-nav',
      linkSelector: options.linkSelector || '.fnf-nav__link, a[href^="#"]',
      sectionSelector: options.sectionSelector || 'section[id], main[id]',
      offset: options.offset || 80,
      smoothScrollDuration: options.smoothScrollDuration || 800,
      ...options
    };

    this.isScrolling = false;
    this.lastScrollTop = 0;
    this.navElement = null;
    this.sections = [];
    this.navLinks = [];
    this.scrollToTopButton = null;

    this.init();
  }

  init() {
    this.findElements();
    this.setupEventListeners();
    this.createScrollToTopButton();
    this.createScrollProgressBar();
    this.handleInitialScroll();
  }

  findElements() {
    this.navElement = document.querySelector(this.config.navSelector);
    this.navLinks = Array.from(document.querySelectorAll(this.config.linkSelector));
    this.sections = Array.from(document.querySelectorAll(this.config.sectionSelector));
  }

  setupEventListeners() {
    // Throttled scroll handler
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;

      scrollTimeout = setTimeout(() => {
        this.handleScroll();
        scrollTimeout = null;
      }, 16); // ~60fps
    }, { passive: true });

    // Navigation link click handlers
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        link.addEventListener('click', (e) => this.handleNavClick(e, href));
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      this.updateSectionPositions();
    });
  }

  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (this.config.hideOnScroll && this.navElement) {
      this.handleNavAutoHide(scrollTop);
    }

    this.updateActiveSection(scrollTop);
    this.updateScrollToTopButton(scrollTop);
    this.updateScrollProgressBar(scrollTop);

    this.lastScrollTop = scrollTop;
  }

  handleNavAutoHide(scrollTop) {
    if (!this.navElement) return; // Safety check

    const scrollDelta = scrollTop - this.lastScrollTop;

    if (Math.abs(scrollDelta) < 5) return; // Ignore very small scrolls

    if (scrollTop > this.config.scrollThreshold) {
      if (scrollDelta > 0) {
        // Scrolling down - hide nav
        this.navElement.classList.add('fnf-nav--hidden');
      } else {
        // Scrolling up - show nav
        this.navElement.classList.remove('fnf-nav--hidden');
      }
    } else {
      // At top of page - always show nav
      this.navElement.classList.remove('fnf-nav--hidden');
    }
  }

  updateActiveSection(scrollTop) {
    if (this.sections.length === 0) return;

    const offset = this.config.offset;
    let activeSection = null;

    // Find the current section
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const section = this.sections[i];
      const sectionTop = section.offsetTop - offset;

      if (scrollTop >= sectionTop) {
        activeSection = section;
        break;
      }
    }

    // Update active navigation link
    this.updateActiveNavLink(activeSection);
  }

  updateActiveNavLink(activeSection) {
    if (!activeSection) return;

    const sectionId = activeSection.id;
    const activeLink = this.navLinks.find(link =>
      link.getAttribute('href') === `#${sectionId}`
    );

    // Only update if we find a matching anchor link — never strip
    // aria-current="page" from page-level links (e.g. index.html)
    if (!activeLink) return;

    this.navLinks.forEach(link => {
      if (link.getAttribute('href')?.startsWith('#')) {
        link.classList.remove('fnf-nav__link--active');
        link.removeAttribute('aria-current');
      }
    });

    activeLink.classList.add('fnf-nav__link--active');
    activeLink.setAttribute('aria-current', 'page');
  }

  handleNavClick(event, href) {
    event.preventDefault();

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      this.smoothScrollTo(targetElement);

      // Announce to screen readers
      if (window.fnfAnnounce) {
        window.fnfAnnounce(`Scrolling to ${targetElement.getAttribute('aria-label') || targetId}`);
      }

      // Close mobile menu if open
      const navToggle = document.getElementById('nav-toggle');
      if (navToggle && navToggle.checked) {
        navToggle.checked = false;
      }
    }
  }

  smoothScrollTo(element) {
    const targetPosition = element.offsetTop - this.config.offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    const animateScroll = (currentTime) => {
      if (startTime === null) startTime = currentTime;

      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / this.config.smoothScrollDuration, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + (distance * easedProgress));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        // Focus the target element for accessibility
        element.focus();
      }
    };

    requestAnimationFrame(animateScroll);
  }

  createScrollToTopButton() {
    this.scrollToTopButton = document.createElement('button');
    this.scrollToTopButton.className = 'fnf-scroll-to-top';
    this.scrollToTopButton.innerHTML = '↑';
    this.scrollToTopButton.setAttribute('aria-label', 'Scroll to top');
    this.scrollToTopButton.setAttribute('title', 'Scroll to top');

    // Add styles
    Object.assign(this.scrollToTopButton.style, {
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      width: '3rem',
      height: '3rem',
      borderRadius: '50%',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(39, 245, 231, 0.9)',
      color: '#ffffff',
      fontSize: '1.2rem',
      cursor: 'pointer',
      zIndex: '1000',
      opacity: '0',
      visibility: 'hidden',
      transform: 'translateY(20px)',
      transition: 'all 0.3s ease',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    });

    this.scrollToTopButton.addEventListener('click', () => {
      this.smoothScrollTo(document.body);
    });

    this.scrollToTopButton.addEventListener('mouseenter', () => {
      this.scrollToTopButton.style.background = 'rgba(39, 245, 231, 1)';
      this.scrollToTopButton.style.transform = 'translateY(0) scale(1.1)';
    });

    this.scrollToTopButton.addEventListener('mouseleave', () => {
      this.scrollToTopButton.style.background = 'rgba(39, 245, 231, 0.9)';
      this.scrollToTopButton.style.transform = 'translateY(0) scale(1)';
    });

    document.body.appendChild(this.scrollToTopButton);
  }


  createScrollProgressBar() {
    // Create container for progress bar
    this.progressBarContainer = document.createElement('div');
    this.progressBarContainer.className = 'scroll-progress-container';

    // Create the actual progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'scroll-progress-bar';

    // Style the container
    Object.assign(this.progressBarContainer.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '6px',
      background: 'rgba(255, 255, 255, 0.2)',
      zIndex: '99998',
      pointerEvents: 'none'
    });

    // Style the progress bar
    Object.assign(this.progressBar.style, {
      height: '100%',
      width: '0%',
      background: 'var(--fnf-smart-scroll-gradient)',
      boxShadow: '0 0 10px rgba(39, 245, 231, 0.5)',
      transition: 'width 0.1s ease-out'
    });

    this.progressBarContainer.appendChild(this.progressBar);
    document.body.appendChild(this.progressBarContainer);
  }

  updateScrollToTopButton(scrollTop) {
    if (!this.scrollToTopButton) {
      return;
    }

    const threshold = this.config.scrollThreshold * 2;
    if (scrollTop > threshold) {
      this.scrollToTopButton.style.opacity = '1';
      this.scrollToTopButton.style.visibility = 'visible';
      this.scrollToTopButton.style.transform = 'translateY(0)';
    } else {
      this.scrollToTopButton.style.opacity = '0';
      this.scrollToTopButton.style.visibility = 'hidden';
      this.scrollToTopButton.style.transform = 'translateY(20px)';
    }
  }

  updateScrollProgressBar(scrollTop) {
    if (!this.progressBar) {
      return;
    }

    // Calculate scroll percentage
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

    // Update progress bar width
    this.progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercentage))}%`;

    // Optional: add glow effect when scrolling
    if (scrollPercentage > 0) {
      this.progressBar.style.boxShadow = '0 0 20px rgba(39, 245, 231, 0.8)';
    } else {
      this.progressBar.style.boxShadow = '0 0 10px rgba(39, 245, 231, 0.5)';
    }
  }

  updateSectionPositions() {
    // Recalculate section positions on resize
    this.sections = Array.from(document.querySelectorAll(this.config.sectionSelector));
  }

  handleInitialScroll() {
    // Handle initial page load with hash
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          this.smoothScrollTo(targetElement);
        }
      }, 100);
    }

    // Initial scroll position check
    setTimeout(() => {
      this.handleScroll();
    }, 100);
  }

  // Public API
  scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      this.smoothScrollTo(element);
    }
  }

  showNavigation() {
    if (this.navElement) {
      this.navElement.classList.remove('fnf-nav--hidden');
    }
  }

  hideNavigation() {
    if (this.navElement) {
      this.navElement.classList.add('fnf-nav--hidden');
    }
  }

  destroy() {
    if (this.scrollToTopButton && this.scrollToTopButton.parentNode) {
      this.scrollToTopButton.parentNode.removeChild(this.scrollToTopButton);
    }
    if (this.progressBarContainer && this.progressBarContainer.parentNode) {
      this.progressBarContainer.parentNode.removeChild(this.progressBarContainer);
    }
  }
}

// Export for use in other modules
export default SmartScroll;