#!/usr/bin/env python3
"""
Media Query Optimizer
Consolidates scattered media queries in critical-gradients.css
"""

import re
import os
from collections import defaultdict

def optimize_media_queries():
    """Consolidate media queries by breakpoint"""

    css_file = 'src/css/critical-gradients.css'
    with open(css_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_size = len(content)

    # Track media queries by breakpoint
    media_queries = defaultdict(list)

    # Pattern to match media queries with their content
    pattern = r'@media\s*([^{]+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}'

    # Find all media queries
    matches = list(re.finditer(pattern, content))

    # Group rules by media query condition
    for match in matches:
        condition = match.group(1).strip()
        rules = match.group(2).strip()

        # Normalize conditions for grouping
        normalized = condition.replace(' ', '')
        media_queries[normalized].append(rules)

    # Build replacement map
    replacements = {}
    processed_conditions = set()

    for condition, rules_list in media_queries.items():
        if len(rules_list) > 1 and condition not in processed_conditions:
            # Combine all rules for this condition
            combined_rules = '\n\n  '.join(rules_list)

            # Find the first occurrence to replace
            first_pattern = f'@media\\s*{re.escape(condition.replace("(", "\\(").replace(")", "\\)"))}\\s*{{[^}}]+(?:{{[^}}]*}}[^}}]*)*}}'

            # Create consolidated version
            consolidated = f'@media {condition} {{\n  {combined_rules}\n}}'

            replacements[first_pattern] = consolidated
            processed_conditions.add(condition)

    # Apply replacements
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

    # Remove duplicate media queries (keep only first occurrence)
    for condition in processed_conditions:
        pattern = f'@media\\s*{re.escape(condition.replace("(", "\\(").replace(")", "\\)"))}\\s*{{[^}}]+(?:{{[^}}]*}}[^}}]*)*}}'
        matches = list(re.finditer(pattern, content, re.DOTALL))

        # Remove all but the first match
        if len(matches) > 1:
            for match in matches[1:]:
                content = content.replace(match.group(0), '')

    # Clean up empty lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Write optimized content
    with open(css_file, 'w', encoding='utf-8') as f:
        f.write(content)

    new_size = len(content)
    saved = original_size - new_size

    print(f"Media query optimization complete!")
    print(f"Original size: {original_size:,} bytes")
    print(f"New size: {new_size:,} bytes")
    print(f"Saved: {saved:,} bytes ({saved/1024:.1f} KB)")

    # Show consolidation summary
    print(f"\nConsolidated {len(media_queries)} unique media query conditions")
    for condition, rules in media_queries.items():
        if len(rules) > 1:
            print(f"  - {condition}: {len(rules)} rule blocks combined")

if __name__ == "__main__":
    optimize_media_queries()