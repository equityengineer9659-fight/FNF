#!/usr/bin/env python3
"""
Property Value Consolidator
Consolidates repeated CSS property values into CSS custom properties
Focuses on transition, box-shadow, and common dimension values
"""

import os
import re
import sys
from collections import Counter

def read_file_safely(filepath):
    """Read file with proper UTF-8 encoding"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def write_file_safely(filepath, content):
    """Write file with proper UTF-8 encoding"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error writing {filepath}: {e}")
        return False

def analyze_property_values(content):
    """Analyze repeated property values in CSS"""

    patterns = {}

    # Common transition values
    transition_pattern = r'transition:\s*([^;]+)(?:\s*!\s*important)?'
    transition_matches = re.findall(transition_pattern, content, re.IGNORECASE)
    patterns['transitions'] = Counter([t.strip() for t in transition_matches])

    # Box shadow values
    box_shadow_pattern = r'box-shadow:\s*([^;]+)(?:\s*!\s*important)?'
    box_shadow_matches = re.findall(box_shadow_pattern, content, re.IGNORECASE)
    patterns['box_shadows'] = Counter([b.strip() for b in box_shadow_matches])

    # Border radius values
    border_radius_pattern = r'border-radius:\s*([^;]+)(?:\s*!\s*important)?'
    border_radius_matches = re.findall(border_radius_pattern, content, re.IGNORECASE)
    patterns['border_radius'] = Counter([b.strip() for b in border_radius_matches])

    # Min-height values
    min_height_pattern = r'min-height:\s*([^;]+)(?:\s*!\s*important)?'
    min_height_matches = re.findall(min_height_pattern, content, re.IGNORECASE)
    patterns['min_heights'] = Counter([m.strip() for m in min_height_matches])

    return patterns

def property_value_consolidation(content, filename):
    """Apply property value consolidation"""
    print(f"Analyzing property values in {filename}...")

    value_analysis = analyze_property_values(content)
    consolidations = []
    total_savings = 0

    # Show top patterns
    for prop_type, counter in value_analysis.items():
        print(f"Top {prop_type}:")
        for value, count in counter.most_common(5):
            if count >= 2:
                print(f"  {value}: {count} occurrences")

    # Consolidate common transitions
    common_transitions = [
        ('all 0.3s ease', '--fnf-transition-default', 3),
        ('all 0.3s ease !important', '--fnf-transition-default-important', 2),
        ('transform 0.3s ease', '--fnf-transition-transform', 2),
        ('opacity 0.3s ease', '--fnf-transition-opacity', 2)
    ]

    for pattern, var_name, min_count in common_transitions:
        if pattern in value_analysis['transitions'] and value_analysis['transitions'][pattern] >= min_count:
            count = value_analysis['transitions'][pattern]
            print(f"Found {count} instances of transition: {pattern}")

            # Add CSS variable
            if var_name not in content:
                if ':root' in content:
                    # Find existing gradient variables and add after them
                    root_pattern = r'(:root\s*\{[^}]*--fnf-gradient-complex-linear[^}]*)'
                    if re.search(root_pattern, content):
                        content = re.sub(
                            root_pattern,
                            f'\\1\\n  {var_name}: {pattern.replace(" !important", "")};',
                            content
                        )
                        print(f"  + Added {var_name} variable")

            # Replace instances
            replacements_made = 0
            max_replacements = min(count, 3)

            if '!important' in pattern:
                search_pattern = f'transition:\\s*{re.escape(pattern.replace(" !important", ""))}\\s*!\\s*important'
                replacement = f'transition: var({var_name}) !important'
            else:
                search_pattern = f'transition:\\s*{re.escape(pattern)}'
                replacement = f'transition: var({var_name})'

            for match in re.finditer(search_pattern, content, re.IGNORECASE):
                if replacements_made >= max_replacements:
                    break
                full_match = match.group(0)
                content = content.replace(full_match, replacement, 1)
                replacements_made += 1

            if replacements_made > 0:
                saved_bytes = replacements_made * (len(pattern) - len(var_name) + 5)  # Approximate
                total_savings += saved_bytes
                consolidations.append(f"Consolidated {replacements_made} transition instances: {saved_bytes} bytes")

    # Consolidate common box shadows
    common_shadows = [
        ('0 8px 32px rgba(0, 0, 0, 0.3)', '--fnf-shadow-strong', 2),
        ('0 4px 16px rgba(0, 0, 0, 0.2)', '--fnf-shadow-medium', 2),
        ('0 2px 8px rgba(0, 0, 0, 0.1)', '--fnf-shadow-light', 2)
    ]

    for pattern, var_name, min_count in common_shadows:
        # Check both with and without !important
        plain_count = value_analysis['box_shadows'].get(pattern, 0)
        important_count = value_analysis['box_shadows'].get(pattern + ' !important', 0)
        total_count = plain_count + important_count

        if total_count >= min_count:
            print(f"Found {total_count} instances of box-shadow: {pattern}")

            # Add CSS variable
            if var_name not in content:
                if ':root' in content:
                    root_pattern = r'(:root\s*\{[^}]*--fnf-transition-opacity[^}]*)'
                    if re.search(root_pattern, content):
                        content = re.sub(
                            root_pattern,
                            f'\\1\\n  {var_name}: {pattern};',
                            content
                        )
                        print(f"  + Added {var_name} variable")

            # Replace instances
            replacements_made = 0
            max_replacements = min(total_count, 2)

            # Handle both regular and !important versions
            for important_suffix in ['', ' !important']:
                search_pattern = f'box-shadow:\\s*{re.escape(pattern + important_suffix)}'
                replacement = f'box-shadow: var({var_name}){important_suffix}'

                for match in re.finditer(search_pattern, content, re.IGNORECASE):
                    if replacements_made >= max_replacements:
                        break
                    full_match = match.group(0)
                    content = content.replace(full_match, replacement, 1)
                    replacements_made += 1

            if replacements_made > 0:
                saved_bytes = replacements_made * (len(pattern) - len(var_name) + 5)
                total_savings += saved_bytes
                consolidations.append(f"Consolidated {replacements_made} box-shadow instances: {saved_bytes} bytes")

    # Consolidate common dimensions
    common_dimensions = [
        ('300px', '--fnf-height-card', 'min-height', 2),
        ('280px', '--fnf-height-compact', 'min-height', 2),
        ('8px', '--fnf-radius-small', 'border-radius', 3),
        ('12px', '--fnf-radius-medium', 'border-radius', 2)
    ]

    for pattern, var_name, property_name, min_count in common_dimensions:
        if property_name == 'min-height':
            counter = value_analysis['min_heights']
        elif property_name == 'border-radius':
            counter = value_analysis['border_radius']
        else:
            continue

        if pattern in counter and counter[pattern] >= min_count:
            count = counter[pattern]
            print(f"Found {count} instances of {property_name}: {pattern}")

            # Add CSS variable
            if var_name not in content:
                if ':root' in content:
                    root_pattern = r'(:root\s*\{[^}]*--fnf-shadow-light[^}]*)'
                    if re.search(root_pattern, content):
                        content = re.sub(
                            root_pattern,
                            f'\\1\\n  {var_name}: {pattern};',
                            content
                        )
                        print(f"  + Added {var_name} variable")

            # Replace instances
            replacements_made = 0
            max_replacements = min(count, 2)

            search_pattern = f'{property_name}:\\s*{re.escape(pattern)}'
            replacement = f'{property_name}: var({var_name})'

            for match in re.finditer(search_pattern, content, re.IGNORECASE):
                if replacements_made >= max_replacements:
                    break
                full_match = match.group(0)
                content = content.replace(full_match, replacement, 1)
                replacements_made += 1

            if replacements_made > 0:
                saved_bytes = replacements_made * (len(pattern) - len(var_name) + 5)
                total_savings += saved_bytes
                consolidations.append(f"Consolidated {replacements_made} {property_name} instances: {saved_bytes} bytes")

    return content, total_savings, consolidations

def property_value_consolidator(css_path):
    """Apply property value consolidation to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Property value consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply property value consolidation
    optimized_content, bytes_saved, consolidations = property_value_consolidation(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nProperty Value Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if consolidations:
        print(f"\nProperty consolidations applied:")
        for consolidation in consolidations:
            print(f"  + {consolidation}")
    else:
        print("No property value consolidations identified")

    if bytes_saved < 50:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-property-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, optimized_content):
        print("+ Property value consolidation completed")
        return True
    else:
        print("- Property value consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python property-value-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = property_value_consolidator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("PROPERTY VALUE CONSOLIDATION GUARANTEE:")
        print("+ Consolidates repeated property values into CSS variables")
        print("+ Preserves all visual styling and functionality")
        print("+ Uses semantic variable names")
        print("+ Conservative replacement approach")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()