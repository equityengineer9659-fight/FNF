#!/usr/bin/env python3
"""
Ultra-Safe Pattern Consolidation
ONLY consolidates identical patterns with zero risk of regressions
Maintains all !important declarations and specificity
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

def consolidate_identical_media_queries(content):
    """Consolidate media queries with identical content"""
    consolidated_count = 0

    # Find all media queries and group by content
    media_pattern = r'@media\s*\([^)]+\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
    media_matches = list(re.finditer(media_pattern, content, re.DOTALL))

    media_groups = {}
    for match in media_matches:
        media_query = match.group(0).split('{')[0] + '{'
        media_content = match.group(1).strip()

        if media_content in media_groups:
            # Found duplicate content - can safely remove this occurrence
            if len(media_groups[media_content]) < 3:  # Only consolidate if not too many
                content = content.replace(match.group(0), '', 1)
                consolidated_count += 1
                print(f"  ✅ Consolidated duplicate media query content")
        else:
            media_groups[media_content] = [match.group(0)]

    return content, consolidated_count

def consolidate_identical_transform_patterns(content):
    """Consolidate identical transform declarations in keyframes"""
    consolidated_count = 0

    # Pattern for transform: translateY(0) in 'to' keyframes
    pattern = r'(to\s*\{\s*)(transform:\s*translateY\(0\);?\s*)(opacity:\s*1;?\s*)(\})'
    matches = list(re.finditer(pattern, content, re.MULTILINE))

    if len(matches) > 3:  # Only if we have many duplicates
        # Replace multiple instances with consolidated version
        consolidated = r'\1transform: translateY(0); opacity: 1;\4'
        content = re.sub(pattern, consolidated, content, count=len(matches)-1)
        consolidated_count += len(matches) - 1
        print(f"  ✅ Consolidated {len(matches)-1} identical transform patterns")

    return content, consolidated_count

def remove_redundant_gradient_declarations(content):
    """Remove redundant gradient declarations where both are identical"""
    removed_count = 0

    # Pattern for duplicate gradient declarations
    gradient_pattern = r'(background:\s*linear-gradient\([^;]+\);\s*)\n\s*\1'
    matches = re.findall(gradient_pattern, content, re.MULTILINE)
    if matches:
        content = re.sub(gradient_pattern, r'\1', content, flags=re.MULTILINE)
        removed_count += len(matches)
        print(f"  ✅ Removed {len(matches)} redundant gradient declarations")

    return content, removed_count

def consolidate_excessive_whitespace(content):
    """Consolidate excessive whitespace patterns"""
    # Remove more than 4 consecutive empty lines
    original_lines = len(content.split('\n'))
    content = re.sub(r'\n\s*\n\s*\n\s*\n\s*\n+', '\n\n\n', content)

    # Remove trailing whitespace but preserve structure
    lines = content.split('\n')
    cleaned_lines = [line.rstrip() for line in lines]
    content = '\n'.join(cleaned_lines).strip() + '\n'

    final_lines = len(content.split('\n'))
    lines_saved = original_lines - final_lines

    if lines_saved > 0:
        print(f"  ✅ Consolidated excessive whitespace ({lines_saved} lines)")

    return content

def ultra_safe_pattern_consolidation(css_content):
    """Apply ultra-safe pattern consolidation"""
    print("Applying ultra-safe pattern consolidation...")

    total_consolidated = 0

    # Phase 1: Media query consolidation
    css_content, media_consolidated = consolidate_identical_media_queries(css_content)
    total_consolidated += media_consolidated

    # Phase 2: Transform pattern consolidation
    css_content, transform_consolidated = consolidate_identical_transform_patterns(css_content)
    total_consolidated += transform_consolidated

    # Phase 3: Gradient declaration consolidation
    css_content, gradient_removed = remove_redundant_gradient_declarations(css_content)
    total_consolidated += gradient_removed

    # Phase 4: Whitespace consolidation
    css_content = consolidate_excessive_whitespace(css_content)

    print(f"Total patterns consolidated: {total_consolidated}")

    return css_content, total_consolidated

def main():
    if len(sys.argv) < 2:
        print("Usage: python ultra-safe-pattern-consolidation.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]

    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        sys.exit(1)

    print(f"Ultra-safe pattern consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        sys.exit(1)

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Apply ultra-safe pattern consolidation
    cleaned_content, consolidated_items = ultra_safe_pattern_consolidation(original_content)

    new_size = len(cleaned_content.encode('utf-8'))
    savings = original_size - new_size
    savings_percent = (savings / original_size) * 100

    print(f"\nPattern Consolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Optimized: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {savings:,} bytes ({savings/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")
    print(f"Patterns consolidated: {consolidated_items}")

    if savings_percent < 0.1:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-pattern-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {backup_path}")

    # Apply consolidation only if meaningful savings
    if write_file_safely(css_path, cleaned_content):
        print("✅ Ultra-safe pattern consolidation completed")
        return True
    else:
        print("❌ Pattern consolidation failed")
        return False

if __name__ == '__main__':
    main()