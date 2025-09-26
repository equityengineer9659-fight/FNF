#!/usr/bin/env python3
"""
Precise Conflict Consolidator
Targets specific identified conflicts in CSS files
Safe consolidation of exact patterns we've found
"""

import os
import re
import sys

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

def consolidate_components_conflicts(content):
    """Consolidate specific conflicts in 07-components.css"""
    consolidations = 0

    # Remove the simple .hero-title with just font-size: 2.5rem
    simple_hero_title = r'\.hero-title\s*\{\s*font-size:\s*2\.5rem;\s*\}'
    if re.search(simple_hero_title, content):
        content = re.sub(simple_hero_title, '', content, count=1)
        consolidations += 1
        print("  + Removed simple .hero-title (2.5rem) - keeping detailed version")

    # Remove the simple .hero-title with just font-size: 2rem
    simple_hero_title_2rem = r'\.hero-title\s*\{\s*font-size:\s*2rem;\s*\}'
    if re.search(simple_hero_title_2rem, content):
        content = re.sub(simple_hero_title_2rem, '', content, count=1)
        consolidations += 1
        print("  + Removed simple .hero-title (2rem) - keeping detailed version")

    # Remove simple .hero-subtitle with just font-size
    simple_hero_subtitle = r'\.hero-subtitle\s*\{\s*font-size:\s*var\(--slds-font-size-4\);\s*\}'
    if re.search(simple_hero_subtitle, content):
        content = re.sub(simple_hero_subtitle, '', content, count=1)
        consolidations += 1
        print("  + Removed simple .hero-subtitle (size-4) - keeping detailed version")

    # Remove simple .hero-subtitle with just font-size (size-3)
    simple_hero_subtitle_3 = r'\.hero-subtitle\s*\{\s*font-size:\s*var\(--slds-font-size-3\);\s*\}'
    if re.search(simple_hero_subtitle_3, content):
        content = re.sub(simple_hero_subtitle_3, '', content, count=1)
        consolidations += 1
        print("  + Removed simple .hero-subtitle (size-3) - keeping detailed version")

    return content, consolidations

def clean_empty_blocks_after_consolidation(content):
    """Clean up empty media queries or blocks left after consolidation"""
    cleanups = 0

    # Remove empty media query blocks
    empty_media = r'@media[^{]*\{\s*\}'
    empty_matches = re.findall(empty_media, content)
    if empty_matches:
        content = re.sub(empty_media, '', content)
        cleanups += len(empty_matches)
        print(f"  + Cleaned {len(empty_matches)} empty media query blocks")

    # Remove multiple consecutive empty lines
    content = re.sub(r'\n\s*\n\s*\n\s*\n+', '\n\n\n', content)

    return content, cleanups

def precise_conflict_consolidation(css_content, filename):
    """Apply precise conflict consolidation based on file type"""
    print(f"Applying precise conflict consolidation to {filename}...")

    total_consolidations = 0

    if '07-components' in filename:
        css_content, consolidations = consolidate_components_conflicts(css_content)
        total_consolidations += consolidations

    # Clean up empty blocks
    css_content, cleanups = clean_empty_blocks_after_consolidation(css_content)
    total_consolidations += cleanups

    print(f"Total consolidations applied: {total_consolidations}")

    return css_content, total_consolidations

def main():
    if len(sys.argv) < 2:
        print("Usage: python precise-conflict-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]

    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        sys.exit(1)

    filename = os.path.basename(css_path)
    print(f"Precise conflict consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        sys.exit(1)

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply precise consolidation
    consolidated_content, consolidation_count = precise_conflict_consolidation(original_content, filename)

    new_size = len(consolidated_content.encode('utf-8'))
    savings = original_size - new_size
    savings_percent = (savings / original_size) * 100

    print(f"\nPrecise Conflict Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Consolidated: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {savings:,} bytes ({savings/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")
    print(f"Conflicts resolved: {consolidation_count}")

    if savings_percent < 0.01:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-precise-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {os.path.basename(backup_path)}")

    # Apply consolidation
    if write_file_safely(css_path, consolidated_content):
        print("+ Precise conflict consolidation completed")
        return True
    else:
        print("- Precise consolidation failed")
        return False

if __name__ == '__main__':
    main()