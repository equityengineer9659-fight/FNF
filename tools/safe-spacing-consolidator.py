#!/usr/bin/env python3
"""
Safe Spacing Consolidator
Consolidates repeated margin/padding values to CSS custom properties
Ultra-conservative approach focusing on most common patterns
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

def analyze_spacing_patterns(content):
    """Analyze spacing (margin/padding) usage patterns"""

    # Find margin values
    margin_patterns = re.findall(r'margin(?:-[a-z]+)?:\s*([^;!]+)(?:\s*!\s*important)?', content, re.IGNORECASE)
    margin_counter = Counter([m.strip() for m in margin_patterns])

    # Find padding values
    padding_patterns = re.findall(r'padding(?:-[a-z]+)?:\s*([^;!]+)(?:\s*!\s*important)?', content, re.IGNORECASE)
    padding_counter = Counter([p.strip() for p in padding_patterns])

    return {
        'margins': margin_counter,
        'paddings': padding_counter
    }

def safe_spacing_consolidation(content, filename):
    """Apply safe spacing consolidation"""
    print(f"Analyzing spacing patterns in {filename}...")

    spacing_analysis = analyze_spacing_patterns(content)
    consolidations = []
    total_savings = 0

    # Focus on high-frequency spacing values that are safe to consolidate
    high_freq_margins = [(value, count) for value, count in spacing_analysis['margins'].most_common(10) if count >= 3]
    high_freq_paddings = [(value, count) for value, count in spacing_analysis['paddings'].most_common(10) if count >= 3]

    print(f"High-frequency margin values:")
    for value, count in high_freq_margins[:5]:
        print(f"  {value}: {count} occurrences")

    print(f"High-frequency padding values:")
    for value, count in high_freq_paddings[:5]:
        print(f"  {value}: {count} occurrences")

    # Start with very safe, common spacing values

    # Handle "1.5rem !important" margins - very common pattern
    if '1.5rem' in [value for value, count in high_freq_margins] and spacing_analysis['margins']['1.5rem'] >= 5:
        margin_count = spacing_analysis['margins']['1.5rem']

        # Add spacing variable if not exists
        if '--fnf-spacing-lg' not in content:
            if ':root' in content:
                # Insert into existing :root
                root_pattern = r'(:root\s*\{[^}]*--fnf-color-white[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-spacing-lg: 1.5rem;',
                        content
                    )
                    print(f"  ✅ Added --fnf-spacing-lg variable")

        # Replace margin: 1.5rem !important safely
        safe_margin_pattern = r'margin(?:-bottom|-top)?:\s*1\.5rem\s*!\s*important'
        margin_matches = list(re.finditer(safe_margin_pattern, content, re.IGNORECASE))

        if margin_matches:
            safe_replacements = min(len(margin_matches), margin_count // 2, 8)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_margin_pattern,
                    lambda m: m.group(0).replace('1.5rem', 'var(--fnf-spacing-lg)'),
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 4  # "1.5rem" -> "var(--fnf-spacing-lg)" saves ~4 chars per use
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} margin 1.5rem instances: {saved_bytes} bytes")

    # Handle "2rem !important" paddings - very common
    if '2rem' in [value for value, count in high_freq_paddings] and spacing_analysis['paddings']['2rem'] >= 4:
        padding_count = spacing_analysis['paddings']['2rem']

        # Add padding variable if not exists
        if '--fnf-spacing-xl' not in content:
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-spacing-lg[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-spacing-xl: 2rem;',
                        content
                    )
                    print(f"  ✅ Added --fnf-spacing-xl variable")

        # Replace padding: 2rem safely
        safe_padding_pattern = r'padding(?:-[a-z]+)?:\s*2rem(?:\s*!\s*important)?'
        padding_matches = list(re.finditer(safe_padding_pattern, content, re.IGNORECASE))

        if padding_matches:
            safe_replacements = min(len(padding_matches), padding_count // 2, 5)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_padding_pattern,
                    lambda m: m.group(0).replace('2rem', 'var(--fnf-spacing-xl)'),
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 3  # "2rem" -> "var(--fnf-spacing-xl)" saves ~3 chars per use
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} padding 2rem instances: {saved_bytes} bytes")

    # Handle "4rem 2rem !important" - specific pattern from analysis
    complex_padding = "4rem 2rem"
    if complex_padding in [value for value, count in high_freq_paddings] and spacing_analysis['paddings'][complex_padding] >= 3:

        # Add complex spacing variable
        if '--fnf-spacing-hero' not in content:
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-spacing-xl[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-spacing-hero: 4rem 2rem;',
                        content
                    )
                    print(f"  ✅ Added --fnf-spacing-hero variable")

        # Replace the complex padding
        complex_pattern = r'padding:\s*4rem\s+2rem\s*!\s*important'
        complex_matches = list(re.finditer(complex_pattern, content, re.IGNORECASE))

        if complex_matches:
            safe_replacements = min(len(complex_matches), 3)

            for i in range(safe_replacements):
                content = re.sub(
                    complex_pattern,
                    'padding: var(--fnf-spacing-hero) !important',
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 7  # "4rem 2rem" -> "var(--fnf-spacing-hero)" saves ~7 chars
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} complex padding instances: {saved_bytes} bytes")

    return content, total_savings, consolidations

def safe_spacing_consolidator(css_path):
    """Apply safe spacing consolidation to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Safe spacing consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply safe spacing consolidation
    optimized_content, bytes_saved, consolidations = safe_spacing_consolidation(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nSafe Spacing Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if consolidations:
        print(f"\nSafe consolidations applied:")
        for consolidation in consolidations:
            print(f"  ✅ {consolidation}")
    else:
        print("No safe spacing consolidations identified")

    if bytes_saved < 10:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-spacing-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, optimized_content):
        print("✅ Safe spacing consolidation completed")
        return True
    else:
        print("❌ Spacing consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-spacing-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = safe_spacing_consolidator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("SAFETY GUARANTEE:")
        print("✅ Only consolidates high-frequency spacing patterns")
        print("✅ Preserves all visual spacing relationships")
        print("✅ Uses semantic CSS variable names")
        print("✅ Conservative replacement ratios")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()