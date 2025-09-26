#!/usr/bin/env python3
"""
Card Component Consolidator
Removes duplicate card component styles from critical-gradients.css
"""

import re
import os

def consolidate_cards():
    """Remove duplicate card styles from critical-gradients.css"""

    # Read the critical-gradients.css file
    css_file = 'src/css/critical-gradients.css'
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_size = len(content)

    # Pattern to match card-specific rules that should be removed
    # These are duplicates that exist in 07-components.css
    patterns_to_remove = [
        # Remove duplicate expertise-card and value-card base styles (lines 190-200)
        r'\.expertise-card,\.value-card\s*\{[^}]+\}',
        r'\.expertise-card:hover,\.value-card:hover\s*\{[^}]+\}',
        r'\.expertise-card:hover\s+\.expertise-icon,\.value-card:hover\s+\.value-icon\s*\{[^}]+\}',
        r'\.expertise-card\s+h3,\.value-card\s+h3\s*\{[^}]+\}',
        r'\.expertise-card\s+p,\.value-card\s+p\s*\{[^}]+\}',

        # Remove animation delays for individual cards (lines 202-216)
        r'\.expertise-card:nth-child\(\d+\)\s*\{[^}]+\}',
        r'\.value-card:nth-child\(\d+\)\s*\{[^}]+\}',

        # Remove duplicate display rules (line 246)
        r'\.expertise-card,\.value-card\s*\{display:[^}]+\}',

        # Remove page-specific service-card styles (lines 416-422)
        r'\.fnf-page--services\s+\.service-card\s*\{[^}]+\}',
        r'\.fnf-page--services\s+\.service-card:hover\s*\{[^}]+\}',
        r'\.fnf-page--services\s+\.service-card:hover\s+\.service-icon\s*\{[^}]+\}',

        # Remove the massive consolidated card styles (lines 450-488)
        # This is the biggest duplication
        r'\.service-card,\.resource-card,\.expertise-card,\.value-card,\.focus-area-card,\.measurable-card,\.impact-card\s*\{[^}]+\}',
        r'\.service-card\.visible,[^{]+\.visible\s*\{[^}]+\}',
        r'\.service-card:hover:not\(\.card-transform-active\),[^{]+:not\(\.card-transform-active\)\s*\{[^}]+\}',
        r'\.service-card:hover\s+\.service-icon,[^{]+\.impact-icon\s*\{[^}]+\}',
        r'\.service-card:hover\s+\.service-badge,[^{]+\.impact-badge\s*\{[^}]+\}',
        r'\.service-card:hover\s+\.service-description,[^{]+\.impact-description\s*\{[^}]+\}',
        r'\.service-card\.animate-in,[^{]+\.animate-in\s*\{[^}]+\}',
        r'\.service-card\.animate-in:nth-child\(\d+\),[^{]+:nth-child\(\d+\)\s*\{[^}]+\}',
        r'\.service-card:active,[^{]+:active\s*\{[^}]+\}',

        # Remove page-specific resource-card styles (lines 508-528)
        r'\.fnf-page--resources\s+\.resource-card\s*\{[^}]+\}',
        r'\.fnf-page--resources\s+\.resource-card:hover\s*\{[^}]+\}',
        r'\.fnf-page--resources\s+\.resource-card:hover\s+\.resource-icon\s*\{[^}]+\}',
        r'\.fnf-page--resources\s+\.resource-card:hover\s+\.resource-badge\s*\{[^}]+\}',
        r'\.fnf-page--resources\s+\.resource-card:hover\s+\.resource-description\s*\{[^}]+\}',
        r'\.fnf-page--resources\s+\.resource-card:hover\s+\.resource-action\s*\{[^}]+\}',
    ]

    # Remove each pattern
    for pattern in patterns_to_remove:
        content = re.sub(pattern, '/* Card styles moved to 07-components.css */', content, flags=re.DOTALL)

    # Clean up multiple consecutive comments
    content = re.sub(r'(/\*[^*]+\*/\s*){2,}', '/* Card styles consolidated in 07-components.css */', content)

    # Write the cleaned content back
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(content)

    new_size = len(content)
    saved = original_size - new_size

    print(f"Card consolidation complete!")
    print(f"Original size: {original_size:,} bytes")
    print(f"New size: {new_size:,} bytes")
    print(f"Saved: {saved:,} bytes ({saved/1024:.1f} KB)")

if __name__ == "__main__":
    consolidate_cards()