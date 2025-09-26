/**
 * PHASE 4.1B: TYPESCRIPT TYPE DEFINITIONS
 * Type definitions for Enhanced HTML-First Architecture
 * Optional integration - provides IntelliSense without breaking existing JavaScript
 */

// Global type declarations for the Enhanced Architecture
declare global {
  interface Window {
    EnhancedArchitecture?: EnhancedArchitectureManager;
    ComponentLoader?: ComponentLoaderInterface;
    EnhancedArchitectureStatus?: ArchitectureStatus;
    announceToScreenReader?: (message: string) => void;
  }

  namespace JSX {
    interface IntrinsicElements {
      'navigation-component': NavigationComponentAttributes;
    }
  }
}

// Component Loader Interface
export interface ComponentLoaderInterface {
  loadedComponents: Map<string, any>;
  componentRegistry: Map<string, ComponentConfig>;
  isInitialized: boolean;
  
  initialize(): Promise<void>;
  loadComponent(componentName: string): Promise<any>;
  loadComponentManually(componentName: string, targetElement?: Element): Promise<any>;
  getPerformanceMetrics(): PerformanceMetrics;
  cleanup(): void;
}

// Component Configuration
export interface ComponentConfig {
  module: () => Promise<any>;
  selector: string;
  priority: number;
  autoInit: boolean;
}

// Performance Metrics
export interface PerformanceMetrics {
  totalInitializationTime: number;
  componentsLoaded: number;
  loadTimes: Record<string, number>;
  initTimes: Record<string, number>;
  averageLoadTime: number;
}

// Architecture Status
export interface ArchitectureStatus {
  initialized: boolean;
  initTime: number;
  features: FeatureSupport;
  browserSupport: BrowserSupport;
  componentsLoaded: number;
}

// Feature Support
export interface FeatureSupport {
  webComponents: boolean;
  es6Modules: boolean;
  progressiveEnhancement: boolean;
}

// Browser Support
export interface BrowserSupport {
  customElements: boolean;
  modules: boolean;
  es6: boolean;
}

// Enhanced Architecture Manager
export interface EnhancedArchitectureManager {
  isInitialized: boolean;
  features: FeatureSupport;
  browserSupport: BrowserSupport;
  
  initialize(): Promise<void>;
  getStatus(): ArchitectureStatus;
}

// Navigation Component Types
export interface NavigationComponentAttributes {
  class?: string;
  style?: string;
  id?: string;
}

export interface NavigationComponentInterface extends HTMLElement {
  isInitialized: boolean;
  mobileToggle: Element | null;
  navMenu: Element | null;
  isMenuOpen: boolean;
  breakpoint: number;
  
  // Public API methods
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  
  // Internal methods
  initializeEnhancedNavigation(): void;
  toggleMobileMenu(): void;
  openMobileMenu(): void;
  closeMobileMenu(animate?: boolean): void;
}

// Component Events
export interface NavigationToggleEvent extends CustomEvent {
  detail: {
    isOpen: boolean;
    toggleElement: Element;
    menuElement: Element;
  };
}

// Build Tool Types
export interface BuildStats {
  filesProcessed: number;
  totalSize: number;
  errors: string[];
}

export interface BuildReport {
  buildTime: string;
  filesProcessed: number;
  totalSize: string;
  errors: string[];
  timestamp: string;
}

// Phase 4 Validation Types
export interface ValidationResult {
  name: string;
  pass: boolean;
  details?: any;
}

export interface Phase4ValidationResults {
  performanceBudget: ValidationResult;
  mobileNavigationP0: ValidationResult;
  sldsCompliance: ValidationResult;
  specialEffects: ValidationResult;
  overallStatus: {
    passed: number;
    total: number;
    percentage: number;
  };
}

// Performance Budget Types
export interface PerformanceBudgetMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  totalCssSize: number;
  totalJsSize: number;
  totalBundleSize: number;
}

export interface BudgetThresholds {
  totalBundleSize: number; // 290KB for Phase 4
  cssSize: number; // 27KB for Phase 4  
  jsSize: number; // 21KB for Phase 4
  loadTime: number; // 2000ms
}

// SLDS Compliance Types
export interface SLDSComplianceMetrics {
  sldsUtilityCount: number;
  totalClassCount: number;
  sldsTokenCount: number;
  totalStyleCount: number;
  overallSldsCompliance: number;
}

// Special Effects Types
export interface SpecialEffectsStatus {
  logoEffects: {
    hasLogo: boolean;
    hasAnimations: boolean;
    hasTransforms: boolean;
    hasGradients: boolean;
  };
  glassmorphism: boolean;
  backgroundEffects: boolean;
  blueGradients: boolean;
  totalEffectsActive: number;
}

// Mobile Navigation Types
export interface MobileNavigationStatus {
  navbar: boolean;
  navMenu: boolean;
  mobileToggle: boolean;
  navLinks: number;
  logo: boolean;
  navbarVisible: boolean;
  toggleVisible: boolean;
}

// Touch Target Validation
export interface TouchTargetInfo {
  element: string;
  width: number;
  height: number;
  minDimension: number;
  visible: boolean;
  interactive: boolean;
}

// Accessibility Enhancement Types
export interface AccessibilityFeatures {
  ariaLiveRegions: boolean;
  keyboardNavigation: boolean;
  focusManagement: boolean;
  screenReaderSupport: boolean;
}

// Error Handling Types
export interface ComponentError extends Error {
  componentName?: string;
  phase?: string;
  recoverable?: boolean;
}

// Utility Types for Optional Integration
export type OptionalComponent<T> = T | null | undefined;
export type ComponentCallback<T = void> = () => T | Promise<T>;
export type ComponentEventHandler<T extends Event = Event> = (event: T) => void;

// Export everything as a module
export {};

// Re-export for convenience
export type {
  ComponentLoaderInterface as ComponentLoader,
  NavigationComponentInterface as NavigationComponent,
  EnhancedArchitectureManager as EnhancedArchitecture
};