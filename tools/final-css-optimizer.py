#!/usr/bin/env python3
"""
Final CSS Optimizer
Removes remaining duplicates and consolidates patterns
"""

import re
import os

def optimize_css():
    """Final optimization pass on critical-gradients.css"""

    css_file = 'src/css/critical-gradients.css'
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_size = len(content)

    # Remove duplicate text alignment rules
    # These patterns repeat for multiple pages with identical styles
    text_align_patterns = [
        # Remove duplicate page-specific text alignments that are identical
        (r'\.fnf-page--index h2 \+ p,\.fnf-page--index \.slds-text-heading_large \+ p,\.fnf-page--index section p\.slds-text-body_regular,\.fnf-page--index \.slds-text-align_center p \{text-align:center !important;margin-left:auto !important;margin-right:auto !important\}', ''),
        (r'\.fnf-page--services h1 \+ p,\.fnf-page--services h2 \+ p,\.fnf-page--services \.slds-text-heading_large \+ p,\.fnf-page--services section p\.slds-text-body_regular,\.fnf-page--services \.slds-text-align_center p \{text-align:center !important;margin-left:auto !important;margin-right:auto !important\}', ''),
        (r'\.fnf-page--resources h1 \+ p,\.fnf-page--resources h2 \+ p,\.fnf-page--resources \.slds-text-heading_large \+ p,\.fnf-page--resources section p\.slds-text-body_regular,\.fnf-page--resources \.slds-text-align_center p \{text-align:center !important;margin-left:auto !important;margin-right:auto !important\}', ''),
        (r'\.fnf-page--impact h1 \+ p,\.fnf-page--impact h2 \+ p,\.fnf-page--impact \.slds-text-heading_large \+ p,\.fnf-page--impact section p\.slds-text-body_regular,\.fnf-page--impact \.slds-text-align_center p \{text-align:center !important;margin-left:auto !important;margin-right:auto !important\}', ''),
        (r'\.fnf-page--contact h1 \+ p,\.fnf-page--contact h2 \+ p,\.fnf-page--contact \.slds-text-heading_large \+ p,\.fnf-page--contact section p\.slds-text-body_regular,\.fnf-page--contact \.slds-text-align_center p \{text-align:center !important;margin-left:auto !important;margin-right:auto !important\}', ''),
    ]

    # Consolidate into a single rule for all pages
    consolidated_text_align = """
/* Consolidated text alignment for all pages */
.slds-text-align_center p,
h1 + p, h2 + p,
.slds-text-heading_large + p,
section p.slds-text-body_regular {
  text-align: center !important;
  margin-left: auto !important;
  margin-right: auto !important;
}"""

    # Apply text alignment consolidation
    for pattern, _ in text_align_patterns:
        content = re.sub(pattern, '', content)

    # Add consolidated rule once
    if 'Consolidated text alignment' not in content:
        content = content.replace('/* Card styles consolidated',
                                 consolidated_text_align + '\n\n/* Card styles consolidated')

    # Consolidate media queries with same breakpoint
    # Find all @media (width <=767px) blocks and combine them
    media_767_pattern = r'@media \(width <=767px\) \{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
    media_767_matches = re.findall(media_767_pattern, content)

    if len(media_767_matches) > 1:
        # Combine all rules
        combined_rules = '\n  '.join(media_767_matches)
        consolidated_767 = f'@media (width <=767px) {{\n  {combined_rules}\n}}'

        # Remove all individual occurrences
        content = re.sub(media_767_pattern, '', content)

        # Add consolidated version once
        content = content + '\n\n' + consolidated_767

    # Consolidate @media (width <=48rem) blocks
    media_48rem_pattern = r'@media \(width <=48rem\) \{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
    media_48rem_matches = re.findall(media_48rem_pattern, content)

    if len(media_48rem_matches) > 1:
        combined_rules = '\n  '.join(media_48rem_matches)
        consolidated_48rem = f'@media (width <=48rem) {{\n  {combined_rules}\n}}'
        content = re.sub(media_48rem_pattern, '', content)
        content = content + '\n\n' + consolidated_48rem

    # Remove empty media queries and clean up
    content = re.sub(r'@media[^{]*\{\s*\}', '', content)

    # Clean up multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Remove trailing whitespace
    content = re.sub(r' +$', '', content, flags=re.MULTILINE)

    # Write optimized content
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(content)

    new_size = len(content)
    saved = original_size - new_size

    print(f"Final optimization complete!")
    print(f"Original size: {original_size:,} bytes")
    print(f"New size: {new_size:,} bytes")
    print(f"Saved: {saved:,} bytes ({saved/1024:.1f} KB)")

if __name__ == "__main__":
    optimize_css()