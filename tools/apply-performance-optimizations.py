#!/usr/bin/env python3
"""Apply performance optimizations to all HTML pages."""

import os
from pathlib import Path

# Critical inline CSS (minified)
CRITICAL_CSS = """*,*::before,*::after{box-sizing:border-box}html{font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%;background:#000;color:#fff}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Open Sans","Helvetica Neue",sans-serif;background:#000;color:#fff;min-height:100vh;overflow-x:hidden}:root{--nav-height:80px;--fnf-color-primary:#2E86AB;--fnf-color-white:#FFFFFF;--slds-font-family-heading:'Orbitron',sans-serif;--slds-c-background-default:#000;--slds-c-text-default:#fff;--fnf-gradient-primary:linear-gradient(135deg,#667eea 0%,#764ba2 100%);--fnf-gradient-hero:linear-gradient(135deg,rgba(102,126,234,0.05) 0%,rgba(118,75,162,0.05) 100%)}.fnf-nav{position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(0,0,0,0.95);backdrop-filter:blur(20px);height:var(--nav-height)}.fnf-nav__container{max-width:1200px;margin:0 auto;padding:0 2rem;height:100%}.fnf-nav__top-row{display:flex;align-items:center;justify-content:space-between;height:100%;position:relative}.fnf-nav__logo{z-index:10}.fnf-nav__brand{color:#fff;text-decoration:none;font-family:var(--slds-font-family-heading);font-size:2rem;font-weight:900}.fnf-nav__title{position:absolute;left:50%;transform:translateX(-50%);font-family:var(--slds-font-family-heading);color:#fff;font-size:1.8rem;font-weight:700}.fnf-nav__toggle-input{display:none}.fnf-nav__menu{display:none}.fnf-nav__mobile{display:none}main{padding-top:var(--nav-height);position:relative;z-index:2}.hero-section{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--fnf-gradient-hero);position:relative;overflow:hidden}.hero-content{text-align:center;max-width:1200px;margin:0 auto;padding:2rem;z-index:10;position:relative}.hero-title{font-family:var(--slds-font-family-heading);font-size:clamp(2.5rem,5vw,4.5rem);font-weight:900;margin:0 0 1.5rem;background:var(--fnf-gradient-primary);-webkit-background-clip:text;background-clip:text;color:transparent}.hero-subtitle{font-size:clamp(1.25rem,2vw,1.75rem);margin:0 0 2.5rem;opacity:0.9}.slds-button{display:inline-flex;align-items:center;padding:0.75rem 1.5rem;border-radius:0.5rem;text-decoration:none;font-weight:600;transition:all 0.3s ease;gap:0.5rem}.slds-button_brand{background:var(--fnf-gradient-primary);color:#fff;border:2px solid transparent}.slds-button_outline-brand{background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.3)}@media (max-width:768px){.fnf-nav__toggle{display:flex;align-items:center;justify-content:center;width:44px;height:44px;cursor:pointer;z-index:10}.fnf-nav__menu{display:none !important}.fnf-nav__title{font-size:1.4rem}}@media (min-width:769px){.fnf-nav__toggle{display:none}.fnf-nav__menu{display:flex !important;list-style:none;margin:0;padding:0;gap:2rem}.fnf-nav__link{color:#fff;text-decoration:none;font-weight:500;transition:color 0.3s}.fnf-nav__link:hover{color:var(--fnf-color-primary)}}"""

def optimize_html_file(filepath):
    """Apply performance optimizations to a single HTML file."""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already optimized (has critical inline CSS)
    if '<style>' in content and '--nav-height:80px' in content:
        print(f"  DONE: {filepath.name} already optimized")
        return False

    # Check if this is index.html (already done manually)
    if filepath.name == 'index.html':
        print(f"  DONE: {filepath.name} already optimized manually")
        return False

    # Find the head section
    head_end = content.find('</head>')
    if head_end == -1:
        print(f"  ERROR: {filepath.name} - no </head> tag found")
        return False

    # Build the optimized head content
    optimized_head = []

    # Add preconnects if not present
    if 'preconnect' not in content:
        optimized_head.append('''    <!-- Performance: Preconnect to external domains -->
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
''')

    # Add critical inline CSS
    optimized_head.append(f'''    <!-- Critical Inline CSS for fastest above-fold rendering -->
    <style>
        {CRITICAL_CSS}
    </style>
''')

    # Add optimized font loading
    optimized_head.append('''    <!-- Preload Orbitron font for hero text with font-display swap -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"></noscript>
''')

    # Add async SLDS loading
    optimized_head.append('''    <!-- Salesforce Lightning Design System CSS - Load asynchronously -->
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css"></noscript>
''')

    # Add async main CSS loading
    optimized_head.append('''    <!-- Custom CSS - Load asynchronously for non-critical styles -->
    <link rel="preload" href="src/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="src/css/main.css"></noscript>
''')

    # Remove old CSS links
    lines = content.split('\n')
    new_lines = []
    skip_next = False

    for i, line in enumerate(lines):
        # Skip old preload and stylesheet lines
        if any(x in line for x in [
            '<link rel="preload" href="src/css/main.css"',
            '<link rel="stylesheet" href="src/css/main.css">',
            '<link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/design-system',
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/design-system',
            '<!-- Preload critical resources -->',
            '<!-- Custom CSS -->',
            '<!-- Salesforce Lightning Design System CSS',
            '<noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com'
        ]):
            continue

        # Add optimizations before </head>
        if '</head>' in line:
            new_lines.extend([''.join(optimized_head).rstrip()])

        new_lines.append(line)

    # Update defer on JavaScript
    optimized_content = '\n'.join(new_lines)
    optimized_content = optimized_content.replace(
        '<script type="module" src="src/js/main.js">',
        '<script type="module" src="src/js/main.js" defer>'
    )
    optimized_content = optimized_content.replace(
        '<script src="src/js/fallback-particles.js">',
        '<script src="src/js/fallback-particles.js" defer>'
    )

    # Write the optimized content
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(optimized_content)

    print(f"  SUCCESS: {filepath.name} optimized successfully")
    return True

def main():
    """Apply optimizations to all HTML files."""

    root_dir = Path(r"C:\Users\luetk\Desktop\Website\Website Next Version")
    os.chdir(root_dir)

    print("Applying performance optimizations to all pages...")
    print()

    # Get all HTML files
    html_files = [
        'about.html',
        'services.html',
        'resources.html',
        'impact.html',
        'contact.html'
    ]

    optimized_count = 0
    for filename in html_files:
        filepath = root_dir / filename
        if filepath.exists():
            if optimize_html_file(filepath):
                optimized_count += 1
        else:
            print(f"  WARNING: {filename} not found")

    print()
    print(f"Optimization complete! {optimized_count} pages updated.")
    print()
    print("Performance improvements applied:")
    print("  - Critical CSS inlined for instant above-fold rendering")
    print("  - Non-critical CSS loaded asynchronously")
    print("  - Font loading optimized with font-display: swap")
    print("  - Preconnect hints added for external resources")
    print("  - JavaScript deferred for non-blocking execution")

if __name__ == "__main__":
    main()