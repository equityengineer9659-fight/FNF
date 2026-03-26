# Monitoring & Error Tracking Implementation

## Overview
Comprehensive error monitoring and performance tracking system for the Food-N-Force website.

## Features

### Error Tracking
- ✅ Global error handler for JavaScript errors
- ✅ Unhandled promise rejection capture
- ✅ Console.error capture
- ✅ Network error tracking
- ✅ Error throttling to prevent spam
- ✅ Local storage persistence
- ✅ Structured error context

### Performance Monitoring
- ✅ Core Web Vitals tracking (FCP, LCP, FID, CLS, INP)
- ✅ Navigation timing metrics
- ✅ Resource timing analysis
- ✅ Long task detection
- ✅ Custom performance marks and measures
- ✅ Real-time performance assessment

### Monitoring Dashboard
- ✅ Real-time metrics display
- ✅ Error log visualization
- ✅ Core Web Vitals assessment
- ✅ System status monitoring
- ✅ Performance trends

## Usage

### Automatic Monitoring
The monitoring system automatically initializes when the page loads:

```javascript
// Already included in main.js
import errorTracker from './monitoring/error-tracker.js';
import performanceMonitor from './monitoring/performance-monitor.js';

// Automatic initialization in app
errorTracker.init();
performanceMonitor.init();
```

### Manual Error Capture
```javascript
// Capture exceptions
try {
  riskyOperation();
} catch (error) {
  errorTracker.captureException(error, {
    context: 'operation_name',
    userId: 'user123'
  });
}

// Capture messages
errorTracker.captureMessage('Something went wrong', 'warning', {
  module: 'checkout',
  action: 'payment_failed'
});
```

### Custom Performance Marks
```javascript
// Mark start of operation
performanceMonitor.mark('operation-start');

// Do work...

// Mark end and measure
performanceMonitor.mark('operation-end');
performanceMonitor.measure('operation-duration', 'operation-start', 'operation-end');
```

### Accessing Metrics
```javascript
// Get error statistics
const errorStats = errorTracker.getStats();
console.log('Total errors:', errorStats.totalErrors);
console.log('Recent errors:', errorStats.recentErrors);

// Get performance metrics
const perfMetrics = performanceMonitor.getMetrics();
console.log('Core Web Vitals:', perfMetrics.coreWebVitals);

// Get Core Web Vitals assessment
const assessment = performanceMonitor.getCoreWebVitalsAssessment();
// Returns ratings: 'good', 'needs-improvement', or 'poor'
```

## Monitoring Dashboard

Access the monitoring dashboard at `/monitoring-dashboard.html` to view:
- Real-time Core Web Vitals
- Error tracking and logs
- Performance metrics
- System status

## Integration with External Services

### Sentry Integration (Example)
```javascript
// In error-tracker.js sendToMonitoring method
if (window.Sentry) {
  Sentry.captureException(new Error(error.message), {
    contexts: {
      custom: error.context
    },
    tags: {
      environment: error.environment,
      version: error.version
    }
  });
}
```

### Google Analytics Integration (Example)
```javascript
// Send Core Web Vitals to GA
if (window.gtag) {
  const vitals = performanceMonitor.getCoreWebVitalsAssessment();
  Object.entries(vitals).forEach(([metric, data]) => {
    gtag('event', metric, {
      value: Math.round(data.value),
      metric_rating: data.rating,
      non_interaction: true
    });
  });
}
```

## Configuration

### Error Tracker Configuration
```javascript
const errorTracker = new ErrorTracker({
  maxErrors: 50,              // Max errors to store locally
  throttleMs: 1000,           // Throttle duplicate errors
  enableConsoleCapture: true, // Capture console.error
  enableNetworkCapture: true, // Capture network errors
  enableLocalStorage: true    // Persist errors locally
});
```

### Performance Monitor Configuration
```javascript
const performanceMonitor = new PerformanceMonitor({
  trackCoreWebVitals: true,  // Track CWV metrics
  trackResources: true,       // Track resource timing
  trackUserTiming: true,      // Track custom marks/measures
  sampleRate: 1.0            // Sample rate (0.0 to 1.0)
});
```

## Production Deployment

### 1. Environment Detection
The system automatically detects the environment:
- Development: localhost/127.0.0.1
- Staging: URLs containing 'staging' or 'test'
- Production: All other URLs

### 2. Production Optimizations
- Error throttling prevents spam
- Sampling rate can be adjusted for performance monitoring
- Debug logs are disabled in production
- Sensitive data should be sanitized

### 3. Security Considerations
- Never log sensitive user data
- Sanitize error messages before sending
- Use HTTPS for external service communication
- Implement rate limiting for error reporting

## Testing

### Manual Testing
1. Open developer console
2. Check for initialization messages
3. Trigger test error: `throw new Error('Test error')`
4. Check monitoring dashboard
5. Verify metrics in console

### Automated Testing
```javascript
// Test error capture
describe('ErrorTracker', () => {
  it('should capture errors', () => {
    errorTracker.captureException(new Error('Test'));
    expect(errorTracker.getStats().totalErrors).toBe(1);
  });
});

// Test performance monitoring
describe('PerformanceMonitor', () => {
  it('should track metrics', () => {
    performanceMonitor.mark('test-mark');
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.userTimings).toContainEqual(
      expect.objectContaining({ name: 'test-mark' })
    );
  });
});
```

## Troubleshooting

### No Metrics Showing
- Check browser console for errors
- Verify modules are imported correctly
- Ensure init() is called
- Check browser compatibility

### Errors Not Being Captured
- Verify error tracker is initialized
- Check console for initialization messages
- Test with manual error: `errorTracker.captureException(new Error('Test'))`

### Performance Metrics Missing
- Some metrics require user interaction (FID, INP)
- CLS updates throughout page lifetime
- Wait for page load completion
- Check browser support for PerformanceObserver

## Browser Compatibility

### Supported Browsers
- Chrome 60+
- Firefox 57+
- Safari 12.1+
- Edge 79+

### Fallbacks
- Older browsers: Basic error tracking only
- No PerformanceObserver: Limited metrics
- No localStorage: No error persistence

## Next Steps

### Recommended Integrations
1. **Sentry**: Professional error tracking
2. **LogRocket**: Session replay and logging
3. **Google Analytics**: Metrics aggregation
4. **Datadog**: Full-stack monitoring

### Future Enhancements
- [ ] Add session replay capability
- [ ] Implement user feedback widget
- [ ] Add custom alert thresholds
- [ ] Create performance budgets
- [ ] Add A/B testing metrics