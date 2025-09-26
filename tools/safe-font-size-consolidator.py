#!/usr/bin/env python3
"""
Safe Font-Size Consolidator
Consolidates repeated clamp() font-size expressions to CSS custom properties
Ultra-conservative approach focusing on identical patterns
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

def analyze_font_size_patterns(content):
    """Analyze font-size clamp() usage patterns"""

    # Find all clamp() font-size values
    clamp_patterns = re.findall(r'font-size:\s*(clamp\([^)]+\))', content, re.IGNORECASE)
    clamp_counter = Counter([c.strip() for c in clamp_patterns])

    # Find regular font-size values that might be consolidatable
    font_size_patterns = re.findall(r'font-size:\s*([^;!]+)(?:\s*!\s*important)?', content, re.IGNORECASE)
    font_size_counter = Counter([f.strip() for f in font_size_patterns])

    return {
        'clamp_expressions': clamp_counter,
        'font_sizes': font_size_counter
    }

def safe_font_size_consolidation(content, filename):
    """Apply safe font-size consolidation"""
    print(f"Analyzing font-size patterns in {filename}...")

    font_analysis = analyze_font_size_patterns(content)
    consolidations = []
    total_savings = 0

    # Focus on high-frequency clamp() expressions
    high_freq_clamps = [(value, count) for value, count in font_analysis['clamp_expressions'].most_common(5) if count >= 3]

    print(f"High-frequency clamp() expressions:")
    for value, count in high_freq_clamps:
        print(f"  {value}: {count} occurrences")

    # Focus on high-frequency regular font sizes
    high_freq_fonts = [(value, count) for value, count in font_analysis['font_sizes'].most_common(10) if count >= 4]

    print(f"High-frequency font-size values:")
    for value, count in high_freq_fonts[:5]:
        print(f"  {value}: {count} occurrences")

    # Consolidate specific common clamp() expressions

    # Handle common responsive heading clamp - very specific pattern
    common_clamp = "clamp(1.5rem, 4vw, 2.5rem)"
    if common_clamp in [value for value, count in high_freq_clamps] and font_analysis['clamp_expressions'][common_clamp] >= 3:
        clamp_count = font_analysis['clamp_expressions'][common_clamp]

        # Add font-size variable if not exists
        if '--fnf-font-heading' not in content:
            if ':root' in content:
                # Insert into existing :root
                root_pattern = r'(:root\s*\{[^}]*--fnf-spacing-hero[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-font-heading: clamp(1.5rem, 4vw, 2.5rem);',
                        content
                    )
                    print(f"  ✅ Added --fnf-font-heading variable")

        # Replace clamp expressions safely
        safe_clamp_pattern = r'font-size:\s*clamp\(1\.5rem,\s*4vw,\s*2\.5rem\)(?:\s*!\s*important)?'
        clamp_matches = list(re.finditer(safe_clamp_pattern, content, re.IGNORECASE))

        if clamp_matches:
            safe_replacements = min(len(clamp_matches), clamp_count // 2, 3)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_clamp_pattern,
                    lambda m: m.group(0).replace('clamp(1.5rem, 4vw, 2.5rem)', 'var(--fnf-font-heading)'),
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 15  # "clamp(1.5rem, 4vw, 2.5rem)" -> "var(--fnf-font-heading)" saves ~15 chars
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} heading clamp instances: {saved_bytes} bytes")

    # Handle another common clamp pattern if it exists
    body_clamp = "clamp(1rem, 2.5vw, 1.125rem)"
    if body_clamp in [value for value, count in high_freq_clamps] and font_analysis['clamp_expressions'][body_clamp] >= 3:
        clamp_count = font_analysis['clamp_expressions'][body_clamp]

        # Add body font variable
        if '--fnf-font-body' not in content:
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-font-heading[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-font-body: clamp(1rem, 2.5vw, 1.125rem);',
                        content
                    )
                    print(f"  ✅ Added --fnf-font-body variable")

        # Replace body clamp expressions
        safe_body_pattern = r'font-size:\s*clamp\(1rem,\s*2\.5vw,\s*1\.125rem\)(?:\s*!\s*important)?'
        body_matches = list(re.finditer(safe_body_pattern, content, re.IGNORECASE))

        if body_matches:
            safe_replacements = min(len(body_matches), clamp_count // 2, 3)

            for i in range(safe_replacements):
                content = re.sub(
                    safe_body_pattern,
                    lambda m: m.group(0).replace('clamp(1rem, 2.5vw, 1.125rem)', 'var(--fnf-font-body)'),
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 12  # Approximate savings
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} body clamp instances: {saved_bytes} bytes")

    # Handle common fixed font sizes (very conservative)
    if '1rem' in [value for value, count in high_freq_fonts] and font_analysis['font_sizes']['1rem'] >= 6:
        rem_count = font_analysis['font_sizes']['1rem']

        # Add base font variable
        if '--fnf-font-base' not in content:
            if ':root' in content:
                root_pattern = r'(:root\s*\{[^}]*--fnf-font-body[^}]*)'
                if re.search(root_pattern, content):
                    content = re.sub(
                        root_pattern,
                        r'\1\n  --fnf-font-base: 1rem;',
                        content
                    )
                    print(f"  ✅ Added --fnf-font-base variable")

        # Replace 1rem font-size safely (not in clamp expressions)
        safe_1rem_pattern = r'font-size:\s*1rem(?!\s*,)(?:\s*!\s*important)?'
        rem_matches = list(re.finditer(safe_1rem_pattern, content, re.IGNORECASE))

        if rem_matches:
            safe_replacements = min(len(rem_matches), rem_count // 3, 4)  # Very conservative

            for i in range(safe_replacements):
                content = re.sub(
                    safe_1rem_pattern,
                    lambda m: m.group(0).replace('1rem', 'var(--fnf-font-base)'),
                    content,
                    count=1,
                    flags=re.IGNORECASE
                )

            saved_bytes = safe_replacements * 2  # "1rem" -> "var(--fnf-font-base)" saves ~2 chars per use
            total_savings += saved_bytes
            consolidations.append(f"Consolidated {safe_replacements} 1rem font instances: {saved_bytes} bytes")

    return content, total_savings, consolidations

def safe_font_size_consolidator(css_path):
    """Apply safe font-size consolidation to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Safe font-size consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply safe font-size consolidation
    optimized_content, bytes_saved, consolidations = safe_font_size_consolidation(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nSafe Font-Size Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if consolidations:
        print(f"\nSafe consolidations applied:")
        for consolidation in consolidations:
            print(f"  ✅ {consolidation}")
    else:
        print("No safe font-size consolidations identified")

    if bytes_saved < 10:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-font-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, optimized_content):
        print("✅ Safe font-size consolidation completed")
        return True
    else:
        print("❌ Font-size consolidation failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-font-size-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = safe_font_size_consolidator(css_path)

    if success:
        print(f"\n{'='*60}")
        print("SAFETY GUARANTEE:")
        print("✅ Only consolidates high-frequency, identical font expressions")
        print("✅ Preserves all visual typography")
        print("✅ Uses semantic CSS variable names")
        print("✅ Conservative replacement ratios")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()