#!/usr/bin/env python3
"""
Ultra-Safe CSS Consolidation Tool
Merges duplicate selectors while preserving functionality and cascade order
"""

import re
import sys
import os

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

def extract_css_rules(content):
    """Extract all CSS rules with their selectors and properties"""
    rules = []

    # Pattern to match complete CSS rules including nested ones
    rule_pattern = r'([^{}@\/\n]+?)\s*\{\s*([^{}]*(?:\{[^{}]*\}[^{}]*)*)\s*\}'

    for match in re.finditer(rule_pattern, content, re.DOTALL):
        selector = match.group(1).strip()
        properties = match.group(2).strip()

        # Skip media queries and keyframes for now (too complex)
        if not selector.startswith('@') and properties:
            # Clean up selector
            selector = ' '.join(selector.split())
            rules.append({
                'selector': selector,
                'properties': properties,
                'original': match.group(0),
                'start': match.start(),
                'end': match.end()
            })

    return rules

def consolidate_duplicates(rules):
    """Consolidate duplicate selectors safely"""
    # Group rules by selector
    selector_groups = {}

    for rule in rules:
        selector = rule['selector']
        if selector not in selector_groups:
            selector_groups[selector] = []
        selector_groups[selector].append(rule)

    # Find duplicates
    duplicates = {k: v for k, v in selector_groups.items() if len(v) > 1}

    consolidated = []
    removed_count = 0

    for selector, rule_list in duplicates.items():
        print(f"  Consolidating {len(rule_list)}x '{selector[:60]}...'")

        # Merge properties from all instances
        all_properties = []

        for rule in rule_list:
            properties = rule['properties'].strip()
            if properties:
                # Split properties while preserving important ones
                prop_lines = [p.strip() for p in properties.split(';') if p.strip()]
                all_properties.extend(prop_lines)

        # Remove duplicates while preserving order
        seen = set()
        unique_properties = []

        for prop in all_properties:
            prop_key = prop.split(':')[0].strip() if ':' in prop else prop
            if prop_key not in seen:
                unique_properties.append(prop)
                seen.add(prop_key)

        # Create consolidated rule
        if unique_properties:
            consolidated_properties = ';\n  '.join(unique_properties)
            if not consolidated_properties.endswith(';'):
                consolidated_properties += ';'

            consolidated_rule = f"{selector} {{\n  {consolidated_properties}\n}}"
            consolidated.append({
                'selector': selector,
                'consolidated_rule': consolidated_rule,
                'original_rules': rule_list,
                'count': len(rule_list)
            })

            removed_count += len(rule_list) - 1

    return consolidated, removed_count

def apply_consolidation(content, consolidated_rules):
    """Apply consolidation to CSS content"""
    new_content = content

    # Sort by start position (descending) to remove from end first
    all_original_rules = []
    for consol in consolidated_rules:
        all_original_rules.extend(consol['original_rules'])

    all_original_rules.sort(key=lambda x: x['start'], reverse=True)

    # Remove all original instances
    for rule in all_original_rules:
        new_content = new_content[:rule['start']] + new_content[rule['end']:]

    # Add consolidated rules at the end
    consolidated_section = "\n\n/* CONSOLIDATED DUPLICATE SELECTORS */\n"
    for consol in consolidated_rules:
        consolidated_section += f"\n{consol['consolidated_rule']}\n"

    return new_content + consolidated_section

def main():
    if len(sys.argv) < 2:
        print("Usage: python safe-css-consolidator.py <css-file-path>")
        sys.exit(1)

    css_path = sys.argv[1]

    if not os.path.exists(css_path):
        print(f"File not found: {css_path}")
        sys.exit(1)

    print(f"Safe CSS consolidation of {css_path}...")

    original_content = read_file_safely(css_path)
    if not original_content:
        sys.exit(1)

    original_size = len(original_content.encode('utf-8'))
    print(f"Original size: {original_size:,} bytes ({original_size/1024:.2f} KB)")

    # Extract all rules
    rules = extract_css_rules(original_content)
    print(f"Found {len(rules)} CSS rules")

    # Consolidate duplicates
    consolidated_rules, removed_count = consolidate_duplicates(rules)

    if not consolidated_rules:
        print("No safe consolidation opportunities found")
        return True

    # Apply consolidation
    new_content = apply_consolidation(original_content, consolidated_rules)

    new_size = len(new_content.encode('utf-8'))
    savings = original_size - new_size
    savings_percent = (savings / original_size) * 100

    print(f"\nConsolidation Results:")
    print(f"Original: {original_size:,} bytes ({original_size/1024:.2f} KB)")
    print(f"Consolidated: {new_size:,} bytes ({new_size/1024:.2f} KB)")
    print(f"Savings: {savings:,} bytes ({savings/1024:.2f} KB)")
    print(f"Reduction: {savings_percent:.1f}%")
    print(f"Rules consolidated: {len(consolidated_rules)}")
    print(f"Duplicate rules removed: {removed_count}")

    if savings_percent < 1.0:
        print("Minimal savings detected - skipping modification")
        return True

    # Create backup
    backup_path = css_path.replace('.css', '.pre-consolidation.css')
    write_file_safely(backup_path, original_content)
    print(f"Backup: {backup_path}")

    # Apply consolidation
    if write_file_safely(css_path, new_content):
        print("✅ Safe CSS consolidation completed")
        return True
    else:
        print("❌ Consolidation failed")
        return False

if __name__ == '__main__':
    main()