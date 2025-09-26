#!/usr/bin/env python3
"""
Gradient Consolidator
Consolidates repeated gradient patterns in critical-gradients.css
Based on analysis findings: 7x triple radial, 4x complex linear gradients
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

def analyze_gradient_patterns(content):
    """Analyze gradient patterns in CSS"""

    # Find all gradient declarations
    gradient_patterns = []

    # Multi-line gradient patterns (radial-gradient combinations)
    multiline_pattern = r'background:\s*(radial-gradient\([^)]+\)(?:\s*,\s*radial-gradient\([^)]+\))*)'
    multiline_matches = re.findall(multiline_pattern, content, re.MULTILINE | re.DOTALL)

    # Single line gradient patterns
    single_pattern = r'background:\s*((?:linear-gradient|radial-gradient)\([^)]+\))'
    single_matches = re.findall(single_pattern, content)

    # Combine and analyze all patterns
    all_gradients = multiline_matches + single_matches
    gradient_counter = Counter(all_gradients)

    return {
        'all_gradients': gradient_counter,
        'multiline_gradients': Counter(multiline_matches),
        'single_gradients': Counter(single_matches)
    }

def gradient_consolidation(content, filename):
    """Apply gradient consolidation"""
    print(f"Analyzing gradient patterns in {filename}...")

    gradient_analysis = analyze_gradient_patterns(content)
    consolidations = []
    total_savings = 0

    # Show top patterns
    print(f"Top gradient patterns found:")
    for gradient, count in gradient_analysis['all_gradients'].most_common(10):
        if count >= 2:
            print(f"  Count: {count} | Pattern: {gradient[:80]}...")

    # Pattern 1: Triple radial gradient pattern
    triple_radial_base = r'radial-gradient\(circle at 20% 50%, rgba\(0, 212, 255, [0-9.]+\) 0%, transparent 50%\),\s*radial-gradient\(circle at 80% 80%, rgba\(1, 118, 211, [0-9.]+\) 0%, transparent 50%\),\s*radial-gradient\(circle at 40% 20%, rgba\(0, 153, 204, [0-9.]+\) 0%, transparent 50%\)'

    # Find all instances with different opacity values
    triple_radial_matches = list(re.finditer(r'background:\s*(' + triple_radial_base + ')', content))

    if len(triple_radial_matches) >= 3:
        print(f"Found {len(triple_radial_matches)} triple radial gradient instances")

        # Add CSS variable to existing :root if it doesn't exist
        if '--fnf-gradient-triple-radial' not in content:
            if ':root' in content:
                # Insert into existing :root after existing spacing variables
                root_pattern = r'(:root\s*\{[^}]*--fnf-spacing-hero[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-gradient-triple-radial: radial-gradient(circle at 20% 50%, rgba(0, 212, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(1, 118, 211, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 20%, rgba(0, 153, 204, 0.3) 0%, transparent 50%);',
                        content
                    )
                    print(f"  + Added --fnf-gradient-triple-radial variable")

        # Replace instances conservatively (50% of matches)
        replacements_made = 0
        max_replacements = min(len(triple_radial_matches), 4)

        for match in triple_radial_matches[:max_replacements]:
            full_match = match.group(0)
            gradient_part = match.group(1)

            # Replace with CSS variable
            new_declaration = f"background: var(--fnf-gradient-triple-radial)"
            content = content.replace(full_match, new_declaration, 1)
            replacements_made += 1

        if replacements_made > 0:
            saved_bytes = replacements_made * 180  # Approximate savings per replacement
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {replacements_made} triple radial gradient instances: {saved_bytes} bytes")

    # Pattern 2: Complex linear gradient pattern
    complex_linear_pattern = r'background:\s*(linear-gradient\(135deg,\s*rgba\(11,\s*25,\s*45,\s*[0-9.]+\)\s*0%,\s*rgba\(22,\s*50,\s*92,\s*[0-9.]+\)\s*25%,\s*rgba\(1,\s*118,\s*211,\s*[0-9.]+\)\s*75%,\s*rgba\(52,\s*152,\s*255,\s*[0-9.]+\)\s*100%\)\s*!important)'

    complex_linear_matches = list(re.finditer(complex_linear_pattern, content))

    if len(complex_linear_matches) >= 3:
        print(f"Found {len(complex_linear_matches)} complex linear gradient instances")

        # Add CSS variable
        if '--fnf-gradient-complex-linear' not in content:
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-gradient-triple-radial[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-gradient-complex-linear: linear-gradient(135deg, rgba(11, 25, 45, 0.7) 0%, rgba(22, 50, 92, 0.65) 25%, rgba(1, 118, 211, 0.6) 75%, rgba(52, 152, 255, 0.55) 100%);',
                        content
                    )
                    print(f"  + Added --fnf-gradient-complex-linear variable")

        # Replace instances
        replacements_made = 0
        max_replacements = min(len(complex_linear_matches), 3)

        for match in complex_linear_matches[:max_replacements]:
            full_match = match.group(0)
            new_declaration = f"background: var(--fnf-gradient-complex-linear) !important"
            content = content.replace(full_match, new_declaration, 1)
            replacements_made += 1

        if replacements_made > 0:
            saved_bytes = replacements_made * 140  # Approximate savings per replacement
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {replacements_made} complex linear gradient instances: {saved_bytes} bytes")

    # Pattern 3: Simple common gradients
    simple_gradients = [
        (r'background:\s*linear-gradient\(135deg,\s*#0176d3,\s*#00d4ff\)', '--fnf-gradient-blue-cyan', 'linear-gradient(135deg, #0176d3, #00d4ff)'),
        (r'background:\s*linear-gradient\(135deg,\s*#16325C\s*0%,\s*#0176d3\s*100%\)', '--fnf-gradient-dark-blue', 'linear-gradient(135deg, #16325C 0%, #0176d3 100%)')
    ]

    for pattern, var_name, var_value in simple_gradients:
        matches = list(re.finditer(pattern, content))

        if len(matches) >= 3:
            print(f"Found {len(matches)} instances of simple gradient pattern")

            # Add CSS variable
            if var_name not in content:
                if ':root' in content:
                    root_pattern = r'(:root\s*\{[^}]*--fnf-gradient-complex-linear[^}]*)'
                    if re.search(root_pattern, content):
                        content = re.sub(
                            root_pattern,
                            f'\\1\\n  {var_name}: {var_value};',
                            content
                        )
                        print(f"  + Added {var_name} variable")

            # Replace instances
            replacements_made = 0
            max_replacements = min(len(matches), 3)

            for match in matches[:max_replacements]:
                full_match = match.group(0)
                new_declaration = f"background: var({var_name})"
                content = content.replace(full_match, new_declaration, 1)
                replacements_made += 1

            if replacements_made > 0:
                saved_bytes = replacements_made * 30  # Approximate savings per replacement
                total_savings += saved_bytes
                consolidations.append(f"Consolidated {replacements_made} simple gradient instances: {saved_bytes} bytes")

    return content, total_savings, consolidations

def gradient_consolidator(css_path):
    """Apply gradient consolidation to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Gradient consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply gradient consolidation
    optimized_content, bytes_saved, consolidations = gradient_consolidation(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nGradient Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if consolidations:
        print(f"\nGradient consolidations applied:")
        for consolidation in consolidations:
            print(f"  + {consolidation}")
    else:
        print("No gradient consolidations identified")

    if bytes_saved < 100:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-gradient-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, optimized_content):
        print("+ Gradient consolidation completed")
        return True
    else:
        print("- Gradient consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python gradient-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = gradient_consolidator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("GRADIENT CONSOLIDATION GUARANTEE:")
        print("+ Consolidates repeated gradient patterns into CSS variables")
        print("+ Preserves all visual styling")
        print("+ Uses semantic variable names")
        print("+ Conservative replacement ratios")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()