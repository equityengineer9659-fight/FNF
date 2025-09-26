/**
 * Fallback Particle System - For local file access without modules
 * Simple particles.js-style system that works without ES6 imports
 */
function initFallbackParticles() {
  // Check if particles should be shown on this page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const excludedPages = ['contact.html'];

  if (excludedPages.includes(currentPage)) {
    console.log('🚫 Particles disabled on contact page');
    return;
  }

  // Simple particles.js-style system without modules
  const canvas = document.createElement('canvas');
  canvas.id = 'fallback-particles-canvas';
  canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1;
        opacity: 0.8;
    `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const mouse = { x: null, y: null };

  // Configuration
  const config = {
    count: 80,
    maxSpeed: 1.0,
    minSpeed: 0.3,
    size: 3,
    connectDistance: 150,
    mouseRadius: 200
  };

  // Create particles
  for (let i = 0; i < config.count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.maxSpeed,
      vy: (Math.random() - 0.5) * config.maxSpeed,
      size: Math.random() * 2 + config.size,
      opacity: Math.random() * 0.3 + 0.3
    });
  }

  // Mouse tracking
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Resize handler
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, i) => {
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) {
        particle.vx = -particle.vx;
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > canvas.height) {
        particle.vy = -particle.vy;
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      }

      // Mouse interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.mouseRadius) {
          // Draw connection to mouse
          const opacity = (1 - distance / config.mouseRadius) * 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Gentle attraction
          const force = (config.mouseRadius - distance) / config.mouseRadius * 0.3;
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * force;
          particle.y -= Math.sin(angle) * force;
        }
      }

      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      ctx.fill();

      // Draw connections to nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.connectDistance) {
          const opacity = (1 - distance / config.connectDistance) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(animate);
  }

  animate();
  console.log('✨ Fallback particle system initialized');
}

/**
 * Fallback Counter System - For local file access without modules
 */
function initFallbackCounters() {
  console.log('🔢 Initializing fallback counter system...');

  // Find counter elements
  const counterElements = document.querySelectorAll('.fnf-stat-number[data-target], .stat-number[data-target]');
  console.log('🔢 Found counter elements:', counterElements.length);

  if (counterElements.length === 0) {
    console.log('🔢 No counter elements found');
    return;
  }

  // Simple intersection observer for counters
  const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -50px 0px'
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('🔢 Starting counter animation for:', entry.target);
        animateFallbackCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all counter elements
  counterElements.forEach(counter => {
    counterObserver.observe(counter);
  });

  console.log('🔢 Fallback counter system initialized');
}

function animateFallbackCounter(element) {
  const target = parseInt(element.dataset.target);
  const format = element.dataset.format || '';
  const suffix = element.dataset.suffix || '';
  const duration = 2000; // 2 seconds
  const start = performance.now();

  console.log('🔢 Animating fallback counter:', {
    target,
    format,
    suffix,
    currentText: element.textContent
  });

  const formatNumber = (value) => {
    switch (format) {
    case 'percentage':
      return value + '%';
    case 'plus':
      return value + '+';
    case 'million':
      return value + 'M+';
    case 'thousand':
      return value + 'K+';
    default:
      return value + suffix;
    }
  };

  const updateCounter = (currentTime) => {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(target * easeOut);

    element.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = formatNumber(target);
      console.log('🔢 Counter animation completed for:', element);
    }
  };

  requestAnimationFrame(updateCounter);
}

// Auto-initialize fallback system
(function() {
  let checkAttempts = 0;
  const maxAttempts = 5;

  function checkForModules() {
    checkAttempts++;

    if (window.modulesLoaded || window.fnfApp) {
      console.log('✅ Modules loaded successfully');
      return;
    }

    if (checkAttempts >= maxAttempts) {
      console.log('🔄 Modules failed to load, initializing fallback systems...');
      initFallbackParticles();
      initFallbackCounters();
      return;
    }

    // Check again in 200ms
    setTimeout(checkForModules, 200);
  }

  // Start checking after a brief delay
  setTimeout(checkForModules, 100);
})();