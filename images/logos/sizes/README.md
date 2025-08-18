# Logo Size Variants

This directory contains size-specific optimized versions of the Food-N-Force logo for different use cases.

## Size Guidelines

### Navigation Logo
- **Desktop**: 56px × 56px
- **Tablet**: 48px × 48px  
- **Mobile**: 40px × 40px

### Hero Logo
- **Desktop**: 80px × 80px
- **Tablet**: 64px × 64px
- **Mobile**: 48px × 48px

### Footer Logo
- **All devices**: 32px × 32px

## File Naming Convention

- `fnf-logo-[size].png` - PNG versions for universal compatibility
- `fnf-logo-[size]@2x.png` - High-DPI versions for retina displays
- `fnf-logo-[size].webp` - WebP versions for modern browsers

## Performance Notes

- Use appropriately sized images to reduce bandwidth
- Serve WebP format when supported
- Implement proper image loading strategies
- Consider lazy loading for non-critical logos

## Implementation

```html
<!-- Responsive logo with size variants -->
<picture>
  <source media="(min-width: 769px)" 
          srcset="logos/sizes/fnf-logo-56.webp" 
          type="image/webp">
  <source media="(min-width: 769px)" 
          srcset="logos/sizes/fnf-logo-56.png">
  <source media="(min-width: 481px)" 
          srcset="logos/sizes/fnf-logo-48.webp" 
          type="image/webp">
  <source media="(min-width: 481px)" 
          srcset="logos/sizes/fnf-logo-48.png">
  <source srcset="logos/sizes/fnf-logo-40.webp" 
          type="image/webp">
  <img src="logos/sizes/fnf-logo-40.png" 
       alt="Food-N-Force Logo"
       class="logo-responsive">
</picture>
```