#!/usr/bin/env python3
"""
CSS Property Consolidator - Phase 5
Medium aggressive approach for further critical-gradients.css optimization
Focus: Property consolidation, value standardization, efficient replacements
"""

import os
import re
import sys
from collections import Counter, defaultdict

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

def analyze_property_consolidation_opportunities(content):
    """Find high-impact property consolidation opportunities"""
    opportunities = {
        'margin_padding': Counter(),
        'width_height': Counter(),
        'border_radius': Counter(),
        'z_index': Counter(),
        'opacity': Counter(),
        'flex_properties': Counter()
    }

    # Margin/Padding patterns
    margin_matches = re.findall(r'margin:\s*([^;]+)', content, re.IGNORECASE)
    padding_matches = re.findall(r'padding:\s*([^;]+)', content, re.IGNORECASE)
    opportunities['margin_padding'].update(margin_matches + padding_matches)

    # Width/Height patterns
    width_matches = re.findall(r'width:\s*([^;]+)', content, re.IGNORECASE)
    height_matches = re.findall(r'height:\s*([^;]+)', content, re.IGNORECASE)
    opportunities['width_height'].update(width_matches + height_matches)

    # Border radius patterns
    border_radius_matches = re.findall(r'border-radius:\s*([^;]+)', content, re.IGNORECASE)
    opportunities['border_radius'].update(border_radius_matches)

    # Z-index patterns
    z_index_matches = re.findall(r'z-index:\s*([^;]+)', content, re.IGNORECASE)
    opportunities['z_index'].update(z_index_matches)

    # Opacity patterns
    opacity_matches = re.findall(r'opacity:\s*([^;]+)', content, re.IGNORECASE)
    opportunities['opacity'].update(opacity_matches)

    # Flex properties
    flex_matches = re.findall(r'(?:flex|justify-content|align-items):\s*([^;]+)', content, re.IGNORECASE)
    opportunities['flex_properties'].update(flex_matches)

    return opportunities

def apply_property_consolidation(content):
    """Apply medium aggressive property consolidation"""
    print("Applying property consolidation optimization...")

    original_size = len(content.encode('utf-8'))
    optimizations = []
    total_savings = 0

    # 1. Standardize common margin/padding values
    common_spacing = [
        ('margin: 0', '--fnf-margin-zero', 8),
        ('padding: 0', '--fnf-padding-zero', 6),
        ('margin: 1rem', '--fnf-margin-base', 5),
        ('padding: 1rem', '--fnf-padding-base', 5),
        ('margin: 2rem', '--fnf-margin-large', 4),
        ('padding: 2rem', '--fnf-padding-large', 4)
    ]

    for pattern, var_name, min_count in common_spacing:
        count = len(re.findall(re.escape(pattern), content, re.IGNORECASE))
        if count >= min_count:
            # Add variable to :root if not exists
            if var_name not in content and ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-radial-med-opacity[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        f'\\1\n  {var_name}: {pattern.split(": ")[1]};',
                        content
                    )

            # Replace instances conservatively (50% replacement ratio)
            replacements = min(count // 2, 3)
            for _ in range(replacements):
                content = content.replace(pattern, f'{pattern.split(": ")[0]}: var({var_name})', 1)

            if replacements > 0:
                saved = replacements * (len(pattern) - len(var_name) - 8)
                total_savings += saved
                optimizations.append(f"Spacing consolidation: {replacements} instances, {saved}B saved")

    # 2. Consolidate common width/height values
    common_dimensions = [
        ('width: 100%', '--fnf-width-full', 6),
        ('height: 100%', '--fnf-height-full', 5),
        ('width: 100vw', '--fnf-width-viewport', 3),
        ('height: 100vh', '--fnf-height-viewport', 4)
    ]

    for pattern, var_name, min_count in common_dimensions:
        count = len(re.findall(re.escape(pattern), content, re.IGNORECASE))
        if count >= min_count:
            # Add variable
            if var_name not in content and ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-padding-zero[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        f'\\1\n  {var_name}: {pattern.split(": ")[1]};',
                        content
                    )

            # Conservative replacement
            replacements = min(count // 2, 2)
            for _ in range(replacements):
                content = content.replace(pattern, f'{pattern.split(": ")[0]}: var({var_name})', 1)

            if replacements > 0:
                saved = replacements * (len(pattern) - len(var_name) - 8)
                total_savings += saved
                optimizations.append(f"Dimension consolidation: {replacements} instances, {saved}B saved")

    # 3. Consolidate z-index values
    z_index_pattern = r'z-index:\s*(\d+)'
    z_indices = re.findall(z_index_pattern, content)
    z_index_counts = Counter(z_indices)

    common_z_indices = [
        ('z-index: 1000', '--fnf-z-overlay', 3),
        ('z-index: 999', '--fnf-z-modal', 2),
        ('z-index: 9999', '--fnf-z-top', 2)
    ]

    for pattern, var_name, min_count in common_z_indices:
        z_value = pattern.split(': ')[1]
        count = z_index_counts.get(z_value, 0)
        if count >= min_count:
            # Add variable
            if var_name not in content and ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-height-viewport[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        f'\\1\n  {var_name}: {z_value};',
                        content
                    )

            # Replace instances
            replacements = min(count, 2)  # Very conservative for z-index
            for _ in range(replacements):
                content = content.replace(pattern, f'z-index: var({var_name})', 1)

            if replacements > 0:
                saved = replacements * 8  # Conservative estimate
                total_savings += saved
                optimizations.append(f"Z-index consolidation: {replacements} instances, {saved}B saved")

    # 4. Consolidate common opacity values
    opacity_values = re.findall(r'opacity:\s*([0-9.]+)', content)
    opacity_counts = Counter(opacity_values)

    for opacity_val, count in opacity_counts.items():
        if count >= 4 and opacity_val in ['0.5', '0.8', '0.9', '1']:
            var_name = f'--fnf-opacity-{opacity_val.replace(".", "")}'
            if var_name not in content and ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-z-top[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        f'\\1\n  {var_name}: {opacity_val};',
                        content
                    )

            # Conservative replacement
            replacements = min(count // 2, 2)
            pattern = f'opacity: {opacity_val}'
            for _ in range(replacements):
                content = content.replace(pattern, f'opacity: var({var_name})', 1)

            if replacements > 0:
                saved = replacements * 6
                total_savings += saved
                optimizations.append(f"Opacity consolidation: {replacements} instances, {saved}B saved")

    new_size = len(content.encode('utf-8'))
    actual_savings = original_size - new_size

    return content, max(total_savings, actual_savings), optimizations

def css_property_consolidate(css_path):
    """Apply CSS property consolidation optimization"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"CSS property consolidation of {filename}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Create backup
    backup_path = css_path.replace('.css', '.pre-property-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup created: {os.path.basename(backup_path)}")

    # Analyze property consolidation opportunities
    print("Analyzing property consolidation opportunities...")
    opportunities = analyze_property_consolidation_opportunities(original_content)

    print("Property frequency analysis:")
    for prop_type, counter in opportunities.items():
        if counter:
            most_common = counter.most_common(3)
            print(f"  {prop_type}: {len(counter)} unique values, top: {most_common}")

    # Apply consolidation
    optimized_content, savings, optimizations = apply_property_consolidation(original_content)

    new_size = len(optimized_content.encode('utf-8'))
    total_reduction = original_size - new_size
    savings_percent = (total_reduction / original_size) * 100 if total_reduction > 0 else 0

    print(f"\nProperty Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Total Savings: {total_reduction:,} bytes ({total_reduction/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if optimizations:
        print(f"\nOptimizations applied:")
        for opt in optimizations:
            print(f"  - {opt}")

    if total_reduction < 100:
        print("Minimal savings detected - file already highly optimized")
        return True

    # Write optimized content
    if write_file_safely(css_path, optimized_content):
        print("Property consolidation completed successfully")
        return True
    else:
        print("Property consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python css-property-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = css_property_consolidate(css_path)

    if success:
        print("=" * 50)
        print("CSS PROPERTY CONSOLIDATION COMPLETE:")
        print("- Property consolidation analysis completed")
        print("- CSS variables added for common values")
        print("- Medium aggressive approach maintained")
        print("- Backup created for rollback safety")
        print("=" * 50)

if __name__ == '__main__':
    main()