/**
 * CLEAN MOBILE NAVIGATION - GLOBAL SOLUTION
 * Works across all pages without embedded JavaScript
 */
(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.fnfMobileNavClean) return;
    window.fnfMobileNavClean = true;
    
    let isOpen = false;
    
    function initMobileNavigation() {
        const toggle = document.querySelector('.mobile-nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!toggle || !navMenu) return;
        
        // Show desktop navigation
        if (window.innerWidth > 768) {
            navMenu.style.display = 'flex';
        } else {
            navMenu.style.display = 'none';
        }
        
        // Mobile toggle functionality
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            isOpen = !isOpen;
            
            if (isOpen && window.innerWidth <= 768) {
                // Create simple dropdown
                const dropdown = document.createElement('div');
                dropdown.id = 'mobile-dropdown';
                dropdown.innerHTML = `
                    <div style="position: fixed; top: 80px; left: 20px; right: 20px; background: white; border: 2px solid #0176d3; padding: 20px; z-index: 99999; box-shadow: 0 5px 15px rgba(0,0,0,0.3); border-radius: 8px;">
                        <a href="index.html" style="display: block; padding: 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">Home</a>
                        <a href="services.html" style="display: block; padding: 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">Services</a>
                        <a href="resources.html" style="display: block; padding: 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">Resources</a>
                        <a href="impact.html" style="display: block; padding: 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">Impact</a>
                        <a href="contact.html" style="display: block; padding: 12px; color: #333; text-decoration: none; border-bottom: 1px solid #eee;">Contact</a>
                        <a href="about.html" style="display: block; padding: 12px; color: #333; text-decoration: none;">About Us</a>
                    </div>
                `;
                document.body.appendChild(dropdown);
                
                // Close on outside click
                setTimeout(() => {
                    document.addEventListener('click', closeOnOutsideClick);
                }, 100);
                
            } else {
                closeDropdown();
            }
        });
        
        // Close dropdown function
        function closeDropdown() {
            const dropdown = document.getElementById('mobile-dropdown');
            if (dropdown) {
                dropdown.remove();
                document.removeEventListener('click', closeOnOutsideClick);
                isOpen = false;
            }
        }
        
        // Close on outside click
        function closeOnOutsideClick(e) {
            const dropdown = document.getElementById('mobile-dropdown');
            if (dropdown && !dropdown.contains(e.target) && !toggle.contains(e.target)) {
                closeDropdown();
            }
        }
        
        // Close on window resize to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                closeDropdown();
                navMenu.style.display = 'flex';
            } else if (!isOpen) {
                navMenu.style.display = 'none';
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileNavigation);
    } else {
        initMobileNavigation();
    }
})();