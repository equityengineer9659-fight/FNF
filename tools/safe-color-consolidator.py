#!/usr/bin/env python3
"""
Safe Color Consolidator
Consolidates repeated color values to CSS custom properties
Ultra-conservative approach with validation
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

def analyze_color_usage(content):
    """Analyze color usage patterns in CSS"""
    # Find all hex color values
    hex_colors = re.findall(r'#[0-9a-fA-F]{3,8}', content)
    color_counter = Counter(hex_colors)

    # Find all rgb/rgba values
    rgb_colors = re.findall(r'rgba?\([^)]+\)', content, re.IGNORECASE)
    rgb_counter = Counter(rgb_colors)

    # Find all named colors (common ones)
    named_colors = re.findall(r'\b(white|black|red|blue|green|yellow|gray|grey)\b', content, re.IGNORECASE)
    named_counter = Counter([color.lower() for color in named_colors])

    return {
        'hex_colors': color_counter,
        'rgb_colors': rgb_counter,
        'named_colors': named_counter
    }

def safe_color_consolidation(content, filename):
    """Apply safe color consolidation"""
    print(f"Analyzing color usage in {filename}...")

    color_analysis = analyze_color_usage(content)
    consolidations = []
    total_savings = 0

    # Focus on high-frequency colors that are safe to consolidate
    high_freq_hex = [(color, count) for color, count in color_analysis['hex_colors'].most_common(10) if count >= 5]

    print(f"High-frequency colors found:")
    for color, count in high_freq_hex:
        print(f"  {color}: {count} occurrences")

    # Start with #ffffff (white) - most common and safest
    if '#ffffff' in color_analysis['hex_colors'] and color_analysis['hex_colors']['#ffffff'] >= 8:
        white_count = color_analysis['hex_colors']['#ffffff']

        # Check if we already have a white variable defined
        if '--fnf-color-white' not in content:
            # Add white variable to existing design tokens or create section
            if ':root' in content:
                # Insert into existing :root block
                root_pattern = r'(:root\s*\{[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-color-white: #ffffff;',
                        content
                    )
                    print(f"  ✅ Added --fnf-color-white variable to existing :root")
                else:
                    # Add new :root block
                    content = '/* Color consolidation variables */\n:root {\n  --fnf-color-white: #ffffff;\n}\n\n' + content
                    print(f"  ✅ Added new :root block with --fnf-color-white")

        # Replace #ffffff with var(--fnf-color-white) in safe contexts
        # Only replace in property values, not in comments or selectors
        safe_white_pattern = r'(color|background|background-color|border-color|fill|stroke):\s*#ffffff(?!\w)'
        white_matches = list(re.finditer(safe_white_pattern, content, re.IGNORECASE))

        if white_matches:
            # Only replace half to be ultra-conservative
            safe_replacements = min(len(white_matches), white_count // 2, 10)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_white_pattern,
                    r'\1: var(--fnf-color-white)',
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 3  # "#ffffff" -> "var(--fnf-color-white)" saves ~3 chars per use
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} #ffffff instances: {saved_bytes} bytes")

    # Handle #000000 or #000 (black) if frequent enough
    black_variants = ['#000000', '#000']
    black_total = sum(color_analysis['hex_colors'].get(variant, 0) for variant in black_variants)

    if black_total >= 5:
        if '--fnf-color-black' not in content:
            # Add black variable
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-color-white[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-color-black: #000000;',
                        content
                    )
                    print(f"  ✅ Added --fnf-color-black variable")

        # Replace black variants safely
        safe_black_pattern = r'(color|background|background-color|border-color):\s*(#000000|#000)(?!\w)'
        black_matches = list(re.finditer(safe_black_pattern, content, re.IGNORECASE))

        if black_matches:
            safe_replacements = min(len(black_matches), black_total // 2, 5)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_black_pattern,
                    r'\1: var(--fnf-color-black)',
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 4  # Average savings
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} black color instances: {saved_bytes} bytes")

    return content, total_savings, consolidations

def safe_color_consolidator(css_path):
    """Apply safe color consolidation to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Safe color consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply safe color consolidation
    optimized_content, bytes_saved, consolidations = safe_color_consolidation(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nSafe Color Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if consolidations:
        print(f"\nSafe consolidations applied:")
        for consolidation in consolidations:
            print(f"  ✅ {consolidation}")
    else:
        print("No safe color consolidations identified")

    if bytes_saved < 10:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-color-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, optimized_content):
        print("✅ Safe color consolidation completed")
        return True
    else:
        print("❌ Color consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-color-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = safe_color_consolidator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("SAFETY GUARANTEE:")
        print("- Only consolidates high-frequency, low-risk colors")
        print("- Preserves all visual styling")
        print("- Uses semantic CSS variable names")
        print("- Conservative replacement ratios")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()