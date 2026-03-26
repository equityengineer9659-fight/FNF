# Environment Configuration Guide

## Overview
The Food-N-Force website uses environment variables to manage configuration across different deployment environments (development, staging, production).

## Quick Start

### 1. Copy Environment File
```bash
# For local development
cp .env.example .env.local

# For production build
cp .env.production .env.production.local
```

### 2. Update Variables
Edit the `.env.local` or `.env.production.local` file with your specific values.

### 3. Run the Application
```bash
# Development (uses .env.development or .env.local)
npm run dev

# Production build (uses .env.production or .env.production.local)
npm run build
```

## Environment Files

### File Priority (Vite loads in this order)
1. `.env.local` - Local overrides (ignored by git)
2. `.env.[mode]` - Environment-specific (committed to git)
3. `.env` - Default values (committed to git)

### Available Environment Files
- `.env.example` - Template with all available variables
- `.env.development` - Development defaults
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env.local` - Local overrides (create from .env.example)

## Configuration Variables

### Core Settings
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ENV` | Environment name | `development`, `staging`, `production` |
| `VITE_APP_NAME` | Application name | `Food-N-Force` |
| `VITE_APP_VERSION` | App version | `2.0.0` |

### API Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `https://api.food-n-force.org/api` |
| `VITE_API_TIMEOUT` | Request timeout (ms) | `10000` |

### Monitoring Services
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SENTRY_DSN` | Sentry error tracking | `https://key@sentry.io/project` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | `G-XXXXXXXXXX` |
| `VITE_LOGROCKET_APP_ID` | LogRocket session replay | `org/app-name` |

### Feature Flags
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_FEATURE_NEWSLETTER` | Enable newsletter popup | `true` |
| `VITE_FEATURE_PARTICLES` | Enable particle effects | `true` |
| `VITE_FEATURE_ANIMATIONS` | Enable animations | `true` |
| `VITE_FEATURE_DEBUG_MODE` | Enable debug logging | `true` (dev only) |

### Performance Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PERFORMANCE_SAMPLE_RATE` | Monitoring sample rate (0-1) | `1.0` (dev), `0.1` (prod) |
| `VITE_ERROR_THROTTLE_MS` | Error throttle delay | `1000` |
| `VITE_MAX_PARTICLE_COUNT` | Maximum particles | `10` (dev), `5` (prod) |

## Using Configuration in Code

### Import the Config Module
```javascript
import config from './config/environment.js';

// Access configuration
console.log(config.env); // 'development'
console.log(config.api.url); // 'http://localhost:3000/api'
console.log(config.features.newsletter); // true
```

### Environment Checks
```javascript
if (config.isDevelopment) {
  // Development-only code
}

if (config.isProduction) {
  // Production-only code
}

if (config.isStaging) {
  // Staging-only code
}
```

### Feature Flags
```javascript
// Check if feature is enabled
if (config.features.particles) {
  initParticleSystem();
}

// Conditional rendering
if (config.features.newsletter) {
  showNewsletterPopup();
}
```

### Debug Logging
```javascript
// Use config.log for environment-aware logging
config.log('Debug message'); // Only logs if debugMode is true
```

## Deployment Configuration

### Netlify Deployment
Netlify automatically reads environment variables from their dashboard.

1. Go to Site Settings → Environment Variables
2. Add your production variables without the `.env` file
3. Variables are automatically injected during build

### Vercel Deployment
Similar to Netlify, add variables in the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add variables for each environment
3. Select which environments should use each variable

### Docker Deployment
```dockerfile
# Pass environment variables at build time
ARG VITE_ENV=production
ARG VITE_API_URL

# Or at runtime
ENV VITE_ENV=production
ENV VITE_API_URL=https://api.food-n-force.org/api
```

### CI/CD Pipeline
```yaml
# GitHub Actions example
env:
  VITE_ENV: production
  VITE_API_URL: ${{ secrets.API_URL }}
  VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

## Security Best Practices

### 1. Never Commit Sensitive Data
- Keep `.env.local` and `.env.production.local` in `.gitignore`
- Use `.env.example` as a template without real values
- Store secrets in CI/CD secret management

### 2. Use Different Keys per Environment
- Development: Use test/sandbox API keys
- Staging: Use staging-specific keys
- Production: Use production keys with restricted permissions

### 3. Validate Configuration
```javascript
// The config module validates required settings
config.validate(); // Returns true if valid

// Get configuration summary
console.log(config.getSummary());
```

### 4. Limit API Key Permissions
- Restrict API keys to specific domains
- Use read-only keys where possible
- Rotate keys regularly

## Troubleshooting

### Variables Not Loading
1. Check file naming (must start with `VITE_`)
2. Restart dev server after changing `.env` files
3. Check file location (root directory)
4. Verify no syntax errors in `.env` file

### Wrong Environment Detected
```javascript
// Check current environment
console.log(config.env);
console.log(config.getSummary());
```

### Build vs Runtime Variables
- Vite replaces `import.meta.env` at build time
- Cannot change variables after build
- Must rebuild for production variable changes

## Testing Different Environments

### Local Testing
```bash
# Test with production settings locally
VITE_ENV=production npm run build
npm run preview

# Test with staging settings
VITE_ENV=staging npm run dev
```

### Environment-Specific Features
```javascript
// Add test helpers in development
if (config.isDevelopment) {
  window.testConfig = config;
  window.resetApp = () => location.reload();
}
```

## Migration Guide

### From Hardcoded Values
Before:
```javascript
const API_URL = 'http://localhost:3000/api';
const DEBUG = true;
```

After:
```javascript
import config from './config/environment.js';
const API_URL = config.api.url;
const DEBUG = config.features.debugMode;
```

### From process.env
Before:
```javascript
if (process.env.NODE_ENV === 'development') { }
```

After:
```javascript
if (config.isDevelopment) { }
```

## Environment Configuration Summary

Current implementation provides:
- ✅ Separate configs for dev/staging/production
- ✅ Feature flags for gradual rollout
- ✅ Performance tuning per environment
- ✅ Secure handling of sensitive data
- ✅ Easy integration with monitoring services
- ✅ Type-safe configuration access
- ✅ Validation and error checking
- ✅ Environment-aware logging