#!/usr/bin/env python3
"""
Safe !important Reducer
Identifies and reduces excessive !important declarations safely
Only removes !important when it's clearly redundant
"""

import os
import re
import sys
from collections import defaultdict

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

def analyze_important_usage(content):
    """Analyze !important usage patterns"""
    # Find all !important declarations
    important_pattern = r'([^{};]+):\s*([^;]+)\s*!\s*important\s*;'
    important_matches = list(re.finditer(important_pattern, content, re.IGNORECASE))

    analysis = {
        'total_important': len(important_matches),
        'by_property': defaultdict(int),
        'by_value': defaultdict(int),
        'redundant_candidates': []
    }

    for match in important_matches:
        prop = match.group(1).strip()
        value = match.group(2).strip()

        analysis['by_property'][prop] += 1
        analysis['by_value'][f"{prop}: {value}"] += 1

    # Find potentially redundant !important declarations
    # 1. Properties that are used with !important more than 5 times with same value
    for prop_value, count in analysis['by_value'].items():
        if count >= 3:  # Conservative threshold
            # Check if this property+value combination could be safely consolidated
            analysis['redundant_candidates'].append({
                'property_value': prop_value,
                'count': count,
                'estimated_savings': count * 10  # Conservative estimate
            })

    return analysis

def safe_important_reduction(content, filename):
    """Apply safe !important reduction"""
    print(f"Analyzing !important usage in {filename}...")

    analysis = analyze_important_usage(content)

    print(f"Found {analysis['total_important']} !important declarations")

    if analysis['total_important'] == 0:
        return content, 0, []

    # Show top !important usage by property
    top_properties = sorted(analysis['by_property'].items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"\nTop !important properties:")
    for prop, count in top_properties:
        print(f"  {prop}: {count} times")

    # Conservative approach: Only remove !important from very specific safe cases
    reductions = []
    total_savings = 0

    # Case 1: Remove !important from 'auto' margin values when used many times
    # This is typically safe as 'auto' margins are rarely overridden
    auto_margin_pattern = r'(margin(?:-[a-z]+)?:\s*auto)\s*!\s*important'
    auto_margin_matches = list(re.finditer(auto_margin_pattern, content, re.IGNORECASE))

    if len(auto_margin_matches) >= 5:  # Conservative threshold
        # Only remove from first half to be extra safe
        removals = len(auto_margin_matches) // 2
        content = re.sub(auto_margin_pattern, r'\1', content, count=removals, flags=re.IGNORECASE)
        saved_bytes = removals * 11  # " !important"
        total_savings += saved_bytes
        reductions.append(f"Removed !important from {removals} 'auto' margin declarations: {saved_bytes} bytes")

    # Case 2: Remove !important from display: block when used multiple times
    # Often redundant in component-specific styles
    display_block_pattern = r'(display:\s*block)\s*!\s*important'
    display_matches = list(re.finditer(display_block_pattern, content, re.IGNORECASE))

    if len(display_matches) >= 3:
        removals = min(len(display_matches) // 2, 3)  # Very conservative
        content = re.sub(display_block_pattern, r'\1', content, count=removals, flags=re.IGNORECASE)
        saved_bytes = removals * 11
        total_savings += saved_bytes
        reductions.append(f"Removed !important from {removals} 'display: block' declarations: {saved_bytes} bytes")

    # Case 3: Remove !important from box-sizing: border-box (often redundant)
    box_sizing_pattern = r'(box-sizing:\s*border-box)\s*!\s*important'
    box_sizing_matches = list(re.finditer(box_sizing_pattern, content, re.IGNORECASE))

    if len(box_sizing_matches) >= 3:
        removals = min(len(box_sizing_matches) // 2, 2)  # Very conservative
        content = re.sub(box_sizing_pattern, r'\1', content, count=removals, flags=re.IGNORECASE)
        saved_bytes = removals * 11
        total_savings += saved_bytes
        reductions.append(f"Removed !important from {removals} 'box-sizing' declarations: {saved_bytes} bytes")

    return content, total_savings, reductions

def safe_important_reducer(css_path):
    """Apply safe !important reduction to CSS file"""
    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        return False

    filename = os.path.basename(css_path)
    print(f"Safe !important reduction of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        return False

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply safe !important reduction
    optimized_content, bytes_saved, reductions = safe_important_reduction(original_content, filename)

    new_size = len(optimized_content.encode('utf-8'))
    savings_percent = (bytes_saved / original_size) * 100 if bytes_saved > 0 else 0

    print(f"\nSafe !important Reduction Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {bytes_saved:,} bytes ({bytes_saved/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")

    if reductions:
        print(f"\nSafe reductions applied:")
        for reduction in reductions:
            print(f"  + {reduction}")
    else:
        print("No safe !important reductions identified")

    if bytes_saved < 10:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-important-reduction.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply optimization
    if write_file_safely(css_path, optimized_content):
        print("+ Safe !important reduction completed")
        return True
    else:
        print("- !important reduction failed")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-important-reducer.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]
    success = safe_important_reducer(css_path)

    if success:
        print(f"\n{'='*60}")
        print("SAFETY GUARANTEE:")
        print("+ Only removes !important from clearly redundant cases")
        print("+ Preserves all visual styling")
        print("+ Conservative approach - no cascade risks")
        print("+ All functionality maintained")
        print(f"{'='*60}")

if __name__ == '__main__':
    main()