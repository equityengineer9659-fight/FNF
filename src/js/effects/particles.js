/**
 * Dynamic Particle System - particles.js style
 * Multi-directional movement with dynamic interactions
 */

class ParticleSystem {
  constructor(container, options = {}) {
    this.container = container;
    this.particles = [];
    this.animationFrame = null;
    this.isVisible = true;
    this.canvas = null;
    this.ctx = null;

    // Configuration for particles.js-style network
    this.config = {
      count: options.count || 80,
      maxSpeed: options.maxSpeed || 1.0,
      minSpeed: options.minSpeed || 0.3,
      size: options.size || 3,
      sizeVariation: options.sizeVariation || 2,
      opacity: options.opacity || 0.6,
      connectDistance: options.connectDistance || 150,
      connectOpacity: options.connectOpacity || 0.3,
      mouseRadius: options.mouseRadius || 200,
      mouseInteraction: options.mouseInteraction !== false,
      ...options
    };

    // Performance monitoring
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;

    // Bind methods
    this.update = this.update.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Mouse interaction
    this.mouse = { x: null, y: null, radius: this.config.mouseRadius };

    this.init();
  }

  init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Check if particles should be enabled on this page
    if (!this.shouldShowParticles()) {
      return;
    }

    this.createCanvas();
    this.createParticles();
    this.setupEventListeners();
    this.start();
  }

  shouldShowParticles() {
    // Get current page filename from URL
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Exclude particles only on contact page
    const excludedPages = [
      'contact.html'
    ];

    return !excludedPages.includes(currentPage);
  }

  createCanvas() {
    // Clear any existing particle containers first
    const existingContainers = document.querySelectorAll('#particles-container, .fnf-particle-container, #particles-canvas');
    existingContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    // Create canvas for dynamic particles
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particles-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      opacity: 0.8;
    `;

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupEventListeners() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }

  createParticles() {
    this.particles = [];
    const particleCount = this.config.count;

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.maxSpeed,
        vy: (Math.random() - 0.5) * this.config.maxSpeed,
        size: Math.random() * this.config.sizeVariation + this.config.size,
        opacity: Math.random() * 0.3 + 0.2,
        originalX: 0,
        originalY: 0
      });
    }

    // Set original positions
    this.particles.forEach(particle => {
      particle.originalX = particle.x;
      particle.originalY = particle.y;
    });
  }

  start() {
    if (this.animationFrame) {
      return;
    }
    this.isVisible = true;
    this.update();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.isVisible = false;
  }

  update() {
    if (!this.canvas || !this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles.forEach((particle, i) => {
      // Move particle
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx = -particle.vx;
        particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy = -particle.vy;
        particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
      }

      // Mouse interaction - particles.js style
      if (this.config.mouseInteraction && this.mouse.x !== null && this.mouse.y !== null) {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.mouse.radius) {
          // Draw connection to mouse
          const opacity = (1 - distance / this.mouse.radius) * 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();

          // Gentle attraction
          const force = (this.mouse.radius - distance) / this.mouse.radius * 0.3;
          const angle = Math.atan2(dy, dx);
          particle.x -= Math.cos(angle) * force;
          particle.y -= Math.sin(angle) * force;
        }
      }

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      this.ctx.fill();

      // Draw connections to nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const other = this.particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.config.connectDistance) {
          const opacity = (1 - distance / this.config.connectDistance) * this.config.connectOpacity;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(other.x, other.y);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    });

    if (this.isVisible && !document.hidden) {
      this.animationFrame = requestAnimationFrame(this.update);
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  handleResize() {
    // Debounced resize handler
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.canvas) {
        this.resizeCanvas();
        // Reposition particles if they're outside new bounds
        this.particles.forEach(particle => {
          particle.x = Math.min(particle.x, this.canvas.width);
          particle.y = Math.min(particle.y, this.canvas.height);
        });
      }
    }, 250);
  }

  destroy() {
    clearTimeout(this.resizeTimeout);
    this.stop();

    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    this.particles = [];
    this.canvas = null;
    this.ctx = null;
  }

  // Public API methods
  setParticleCount(count) {
    this.config.count = Math.max(0, Math.min(count, 200)); // Max 200 particles

    if (this.particles.length > this.config.count) {
      this.particles = this.particles.slice(0, this.config.count);
    } else if (this.particles.length < this.config.count) {
      // Add more particles
      const needed = this.config.count - this.particles.length;
      for (let i = 0; i < needed; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * this.config.maxSpeed,
          vy: (Math.random() - 0.5) * this.config.maxSpeed,
          size: Math.random() * this.config.sizeVariation + this.config.size,
          opacity: Math.random() * 0.3 + 0.2,
          originalX: 0,
          originalY: 0
        });
      }
    }
  }

  pause() {
    this.stop();
  }

  resume() {
    this.start();
  }

  getStats() {
    return {
      particleCount: this.particles.length,
      targetCount: this.config.count,
      fps: this.fps,
      isVisible: this.isVisible,
      canvasSize: this.canvas ? `${this.canvas.width}x${this.canvas.height}` : 'not initialized'
    };
  }
}

// Factory function for easy initialization
export function createParticleSystem(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`ParticleSystem: Container with id "${containerId}" not found`);
    return null;
  }

  return new ParticleSystem(container, options);
}

// Auto-initialize particles like the reference project
export function initParticles() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  return new ParticleSystem(null);
}

export default ParticleSystem;