import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ParticleSystem, { initParticles, createParticleSystem } from './particles.js';

// Mock canvas context
const mockCtx = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  closePath: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
};

// Mock canvas element
function mockCanvas() {
  const original = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
      const canvas = original(tag);
      canvas.getContext = vi.fn(() => mockCtx);
      // jsdom doesn't support canvas dimensions properly
      Object.defineProperty(canvas, 'width', { writable: true, value: 1024 });
      Object.defineProperty(canvas, 'height', { writable: true, value: 768 });
      return canvas;
    }
    return original(tag);
  });
}

function mockMatchMedia(reducedMotion = false) {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('ParticleSystem', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    mockCanvas();
    mockMatchMedia(false);
    // Default: not contact page
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/index.html' },
    });
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });
  });

  afterEach(() => {
    // Clean up any particle canvases
    document.querySelectorAll('#particles-canvas').forEach(el => el.remove());
  });

  describe('constructor', () => {
    it('should create a particle system with default config', () => {
      const system = new ParticleSystem(null);
      expect(system.config.count).toBe(80);
      expect(system.config.maxSpeed).toBe(1.0);
      expect(system.config.connectDistance).toBe(150);
    });

    it('should accept custom options', () => {
      const system = new ParticleSystem(null, { count: 20, maxSpeed: 2.0 });
      expect(system.config.count).toBe(20);
      expect(system.config.maxSpeed).toBe(2.0);
    });

    it('should create a canvas element in the DOM', () => {
      new ParticleSystem(null);
      const canvas = document.getElementById('particles-canvas');
      expect(canvas).not.toBeNull();
    });
  });

  describe('shouldShowParticles', () => {
    it('should return true for index page', () => {
      const system = new ParticleSystem(null);
      expect(system.shouldShowParticles()).toBe(true);
    });

    it('should return false for contact page', () => {
      window.location = { pathname: '/contact.html' };
      const system = new ParticleSystem(null);
      expect(system.shouldShowParticles()).toBe(false);
    });

    it('should return true for about page', () => {
      window.location = { pathname: '/about.html' };
      const system = new ParticleSystem(null);
      expect(system.shouldShowParticles()).toBe(true);
    });
  });

  describe('reduced motion', () => {
    it('should not create canvas when reduced motion is preferred', () => {
      mockMatchMedia(true);
      new ParticleSystem(null);
      const canvas = document.getElementById('particles-canvas');
      expect(canvas).toBeNull();
    });
  });

  describe('createParticles', () => {
    it('should create the configured number of particles', () => {
      const system = new ParticleSystem(null, { count: 10 });
      expect(system.particles.length).toBe(10);
    });

    it('should give each particle position and velocity', () => {
      const system = new ParticleSystem(null, { count: 5 });
      system.particles.forEach(p => {
        expect(p.x).toBeDefined();
        expect(p.y).toBeDefined();
        expect(p.vx).toBeDefined();
        expect(p.vy).toBeDefined();
        expect(p.size).toBeGreaterThan(0);
      });
    });
  });

  describe('resizeCanvas', () => {
    it('should update canvas dimensions to window size', () => {
      const system = new ParticleSystem(null);
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      system.resizeCanvas();
      expect(system.canvas.width).toBe(1920);
      expect(system.canvas.height).toBe(1080);
    });

    it('should not throw if canvas is null', () => {
      const system = new ParticleSystem(null);
      system.canvas = null;
      expect(() => system.resizeCanvas()).not.toThrow();
    });
  });

  describe('mouse interaction', () => {
    it('should track mouse position', () => {
      const system = new ParticleSystem(null);
      system.handleMouseMove({ clientX: 500, clientY: 300 });
      expect(system.mouse.x).toBe(500);
      expect(system.mouse.y).toBe(300);
    });
  });

  describe('visibility', () => {
    it('should stop animation when hidden', () => {
      const system = new ParticleSystem(null);
      const stopSpy = vi.spyOn(system, 'stop');

      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      system.handleVisibilityChange();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should restart animation when visible', () => {
      const system = new ParticleSystem(null);
      const startSpy = vi.spyOn(system, 'start');

      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      system.handleVisibilityChange();
      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('setParticleCount', () => {
    it('should update particle count', () => {
      const system = new ParticleSystem(null, { count: 10 });
      system.setParticleCount(20);
      expect(system.config.count).toBe(20);
      expect(system.particles.length).toBe(20);
    });

    it('should cap at 200 particles', () => {
      const system = new ParticleSystem(null, { count: 10 });
      system.setParticleCount(500);
      expect(system.config.count).toBe(200);
    });

    it('should not go below 0', () => {
      const system = new ParticleSystem(null, { count: 10 });
      system.setParticleCount(-5);
      expect(system.config.count).toBe(0);
    });

    it('should trim particles if reducing count', () => {
      const system = new ParticleSystem(null, { count: 20 });
      system.setParticleCount(5);
      expect(system.particles.length).toBe(5);
    });
  });

  describe('destroy', () => {
    it('should remove canvas from DOM', () => {
      const system = new ParticleSystem(null);
      expect(document.getElementById('particles-canvas')).not.toBeNull();
      system.destroy();
      expect(document.getElementById('particles-canvas')).toBeNull();
    });

    it('should clear particles array', () => {
      const system = new ParticleSystem(null, { count: 10 });
      system.destroy();
      expect(system.particles).toEqual([]);
    });

    it('should null out canvas and context', () => {
      const system = new ParticleSystem(null);
      system.destroy();
      expect(system.canvas).toBeNull();
      expect(system.ctx).toBeNull();
    });
  });

  describe('start/stop', () => {
    it('should set animationFrame on start', () => {
      const system = new ParticleSystem(null);
      system.stop();
      expect(system.animationFrame).toBeNull();
    });

    it('should not double-start', () => {
      const system = new ParticleSystem(null);
      const frame = system.animationFrame;
      system.start();
      // Should not change if already running
      expect(system.animationFrame).toBe(frame);
    });
  });
});

describe('initParticles', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    mockCanvas();
    mockMatchMedia(false);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/index.html' },
    });
  });

  it('should return a ParticleSystem instance', () => {
    const system = initParticles();
    expect(system).toBeInstanceOf(ParticleSystem);
    if (system) system.destroy();
  });

  it('should return null when reduced motion is preferred', () => {
    mockMatchMedia(true);
    const system = initParticles();
    expect(system).toBeNull();
  });

  it('should reduce particle count on mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    const system = initParticles();
    expect(system).not.toBeNull();
    expect(system.config.count).toBeLessThanOrEqual(40);
    if (system) system.destroy();
  });

  it('should keep default particle count on desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
    const system = initParticles();
    expect(system).not.toBeNull();
    expect(system.config.count).toBe(80);
    if (system) system.destroy();
  });
});

describe('createParticleSystem', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    mockCanvas();
    mockMatchMedia(false);
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/index.html' },
    });
  });

  it('should return null if container not found', () => {
    const system = createParticleSystem('nonexistent');
    expect(system).toBeNull();
  });

  it('should create a system if container exists', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    const system = createParticleSystem('test-container');
    expect(system).toBeInstanceOf(ParticleSystem);
    if (system) system.destroy();
  });
});
